// pages/api/vaults/set-trigger.ts
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

  const { vaultId, triggerDate } = req.body;
  if (!vaultId || !triggerDate) {
    return res.status(400).json({ error: 'Vault ID and trigger date are required.' });
  }

  try {
    await pool.query(
      'UPDATE vaults SET "triggerDate" = $1 WHERE id = $2 AND "userId" = $3',
      [triggerDate, vaultId, session.user.id]
    );

    res.status(200).json({ message: 'Trigger date set successfully.' });

  } catch (error) {
    console.error('Set Trigger Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
