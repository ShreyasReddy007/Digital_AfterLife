// pages/api/auth/verify-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const { rows } = await pool.query('SELECT "passwordHash" FROM users WHERE id = $1', [session.user.id]);
    const user = rows[0];
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Secondary password not set for this account.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (isValid) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}