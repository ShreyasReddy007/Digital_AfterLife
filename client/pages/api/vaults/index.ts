import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';

// Initialize the connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Secure the endpoint by checking for a valid session
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle GET request to fetch vaults
  if (req.method === 'GET') {
    try {
      const userId = session.user.id;
      
      // Query the database for all vaults belonging to the current user
      const { rows } = await pool.query(
        'SELECT id, cid, created_at FROM vaults WHERE "userId" = $1 ORDER BY created_at DESC',
        [userId]
      );

      res.status(200).json(rows);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Reject any other HTTP method
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
