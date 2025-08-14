import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import bcrypt from 'bcrypt';
import axios from 'axios';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cid, password } = req.body;
  if (!cid || !password) {
    return res.status(400).json({ error: 'CID and password are required' });
  }

  try {
    // 1. Find the vault and its stored password hash
    const { rows } = await pool.query(
      'SELECT "passwordHash" FROM vaults WHERE cid = $1 AND "userId" = $2',
      [cid, session.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vault not found or access denied.' });
    }

    const storedHash = rows[0].passwordHash;

    // 2. Compare the provided password with the stored hash
    const isPasswordCorrect = await bcrypt.compare(password, storedHash);
    if (!isPasswordCorrect) {
      return res.status(403).json({ error: 'Invalid password.' });
    }

    // 3. Fetch the real content from Pinata's IPFS gateway
    const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const contentResponse = await axios.get(pinataGatewayUrl, {
      responseType: 'arraybuffer' // so we can detect binary
    });

    let type: 'json' | 'file' = 'file';
    let data: any;

    // Try to interpret the content
    const contentType = contentResponse.headers['content-type'] || '';
    const buffer = Buffer.from(contentResponse.data);

    if (contentType.includes('application/json')) {
      type = 'json';
      data = JSON.parse(buffer.toString('utf8'));
    } 
    else if (contentType.startsWith('text/')) {
      try {
        data = JSON.parse(buffer.toString('utf8'));
        type = 'json';
      } catch {
        type = 'json';
        data = buffer.toString('utf8');
      }
    } 
    else if (contentType.startsWith('image/')) {
      type = 'file';
      const base64 = buffer.toString('base64');
      data = `data:${contentType};base64,${base64}`;
    } 
    else {
      // Generic binary file — return as downloadable base64
      type = 'file';
      const base64 = buffer.toString('base64');
      data = `data:application/octet-stream;base64,${base64}`;
    }

    // 4. Return in the shape the frontend expects
    res.status(200).json({ type, data });

  } catch (error) {
    console.error('Unlock Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
