// pages/api/user/complete-onboarding.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';
import { Pool } from 'pg';

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

  try {
    const userId = session.user.id;
    await pool.query(
      'UPDATE users SET "hasCompletedOnboarding" = TRUE WHERE id = $1',
      [userId]
    );
    res.status(200).json({ message: 'Onboarding completed successfully.' });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
