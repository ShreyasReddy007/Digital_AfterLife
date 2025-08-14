// pages/api/vaults/create.ts
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import bcrypt from 'bcrypt';

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

  const { cid, password, name } = req.body;
  if (!cid || !password || !name) {
    return res.status(400).json({ error: 'CID, password, and name are required' });
  }

  try {
    const userId = session.user.id;
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save the CID, user ID, name, and hashed password
    const newVault = await pool.query(
      'INSERT INTO vaults (cid, "userId", name, "passwordHash") VALUES ($1, $2, $3, $4) RETURNING id, cid, name, created_at',
      [cid, userId, name, passwordHash]
    );

    res.status(201).json(newVault.rows[0]);

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error while creating vault' });
  }
}
