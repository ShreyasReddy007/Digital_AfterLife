// pages/api/vaults/recipient-vaults.ts
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

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const userEmail = session.user.email;

      // **MODIFIED**: This query now ONLY selects vaults where the user is a recipient
      // AND the vault's deliveryStatus has been marked as 'delivered' by the cron job.
      const query = `
        SELECT 
          v.id, v.cid, v.name, v.created_at, u.name as "ownerName"
        FROM 
          vaults v
        JOIN 
          users u ON v."userId" = u.id
        WHERE 
          $1 = ANY(v."recipientEmails") AND v."deliveryStatus" = 'delivered'
      `;
      
      const { rows } = await pool.query(query, [userEmail]);

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
