// pages/api/vaults/unlock.ts
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
    const { rows } = await pool.query(
      'SELECT "passwordHash", "originalFilename", "mimeType" FROM vaults WHERE cid = $1 AND "userId" = $2',
      [cid, session.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vault not found or access denied.' });
    }

    const vault = rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, vault.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(403).json({ error: 'Invalid password.' });
    }

    const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const contentResponse = await axios.get(pinataGatewayUrl, {
      responseType: 'arraybuffer'
    });
    
    const buffer = Buffer.from(contentResponse.data);

    // --- THIS IS THE KEY LOGIC CHANGE ---

    // Case 1: It's a text-based vault (created via the 'Create' page)
    if (!vault.mimeType) {
      const jsonContent = JSON.parse(buffer.toString('utf8'));
      res.status(200).json({
        type: 'json', // Tell the frontend it's a text message
        data: jsonContent.message, // Send ONLY the message string
      });
      return;
    }

    // Case 2: It's a file-based vault (created via the 'Upload' page)
    const mimeType = vault.mimeType || 'application/octet-stream';
    const fileName = vault.originalFilename || 'vault_content';
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    res.status(200).json({
      type: 'file',
      data: dataUri,
      fileName: fileName,
    });

  } catch (error) {
    console.error('Unlock Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}