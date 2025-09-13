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
    console.warn(`Method ${req.method} not allowed on complete-onboarding`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    console.warn('Unauthorized complete-onboarding request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = session.user.id;
    console.log(`Completing onboarding for user ID: ${userId}`);

    await pool.query(
      'UPDATE users SET "hasCompletedOnboarding" = TRUE WHERE id = $1',
      [userId]
    );

    const { rows } = await pool.query(
      'SELECT "hasCompletedOnboarding" FROM users WHERE id = $1',
      [userId]
    );

    const hasCompletedOnboarding = rows[0]?.hasCompletedOnboarding ?? false;

    console.log(`User ${userId} updated onboarding to: ${hasCompletedOnboarding}`);

    return res.status(200).json({
      message: 'Onboarding completed successfully.',
      hasCompletedOnboarding,
    });
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
