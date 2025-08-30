import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const userId = session.user.id;
      const { rows } = await pool.query(
        'SELECT "recoveryKeyHash" FROM users WHERE id = $1',
        [userId]
      );

      const user = rows[0];
      const hasKey = !!user && !!user.recoveryKeyHash;
      
      res.status(200).json({ hasKey });
    } catch (error) {
      console.error('Error checking recovery key status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
