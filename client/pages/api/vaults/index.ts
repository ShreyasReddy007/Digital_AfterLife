// pages/api/vaults/index.ts
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
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const userId = session.user.id;
      const { rows } = await pool.query(
        'SELECT id, cid, name, created_at, "triggerDate" FROM vaults WHERE "userId" = $1 ORDER BY created_at DESC',
        [userId]
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
