// pages/api/user/set-recovery-key.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
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

  const { recoveryKey } = req.body;
  if (!recoveryKey || recoveryKey.length < 10) {
    return res.status(400).json({ error: 'Recovery key must be at least 10 characters long.' });
  }

  try {
    const userId = session.user.id;
    const saltRounds = 10;
    const recoveryKeyHash = await bcrypt.hash(recoveryKey, saltRounds);

    await pool.query(
      'UPDATE users SET "recoveryKeyHash" = $1 WHERE id = $2',
      [recoveryKeyHash, userId]
    );

    res.status(200).json({ message: 'Recovery key set successfully.' });
  } catch (error) {
    console.error('Set Recovery Key Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
