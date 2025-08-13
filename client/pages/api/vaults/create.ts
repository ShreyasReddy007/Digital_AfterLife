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
  // 1. Secure the endpoint: Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 2. Authenticate the user: Check for a valid session
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 3. Get the data from the request
  const { cid } = req.body;
  if (!cid) {
    return res.status(400).json({ error: 'CID is required' });
  }

  // 4. Save to the database
  try {
    const userId = session.user.id;
    
    // Insert the new CID and the user's ID into the 'vaults' table
    const newVault = await pool.query(
      'INSERT INTO vaults (cid, "userId") VALUES ($1, $2) RETURNING *',
      [cid, userId]
    );

    // 5. Send a success response
    res.status(201).json(newVault.rows[0]);

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error while creating vault' });
  }
}
