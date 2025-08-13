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

    // 3. **KEY CHANGE: If password is correct, fetch the real content from Pinata's IPFS gateway**
    const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const contentResponse = await axios.get(pinataGatewayUrl);
    
    // 4. Return the actual content from the vault
    res.status(200).json({ content: contentResponse.data });

  } catch (error) {
    console.error('Unlock Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
