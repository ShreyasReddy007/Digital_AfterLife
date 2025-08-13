import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';

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
    // Check if the vault exists for this user
    const { rows } = await pool.query(
      'SELECT * FROM vaults WHERE cid = $1 AND "userId" = $2',
      [cid, session.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vault not found or access denied.' });
    }

    // --- MOCK DECRYPTION ---
    // In a real app, you would fetch encrypted data from Pinata and decrypt it.
    // For now, we'll use a simple password check.
    if (password.toLowerCase() !== 'password') { 
        return res.status(403).json({ error: 'Invalid password.' });
    }

    const unlockedContent = {
        message: "This content was successfully unlocked from the backend.",
        retrievedAt: new Date().toISOString(),
        cid: cid
    };

    res.status(200).json({ content: unlockedContent });

  } catch (error) {
    console.error('Unlock Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
