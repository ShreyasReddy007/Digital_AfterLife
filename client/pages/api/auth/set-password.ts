// pages/api/auth/set-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const isPasswordStrong = (password: string): boolean => {
    if (!password) return false;
    const hasLength = password.length >= 11;
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return hasLength && hasUppercase && hasDigit && hasSymbol;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { password } = req.body;
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ error: 'Password does not meet the strength requirements.' });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    await pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [passwordHash, session.user.id]);
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}