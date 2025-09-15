// pages/api/vaults/toggle-inactivity.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // make sure they are authenticated.
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    // deny access.
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const userId = session.user.id;
      const { vaultId, isEnabled } = req.body;

      // Check that the required data was sent.
      if (vaultId === undefined || isEnabled === undefined) {
        return res.status(400).json({ message: 'Missing vaultId or isEnabled flag.' });
      }

      // users can only modify their own vaults.
      const { rowCount } = await pool.query(
        `UPDATE vaults SET "inactivityTrigger" = $1 WHERE id = $2 AND "userId" = $3`,
        [isEnabled, vaultId, userId]
      );

      if (rowCount === 0) {
          return res.status(404).json({ message: 'Vault not found or access denied.' });
      }
      res.status(200).json({ message: 'Inactivity trigger updated successfully.' });
    } catch (error) {
      console.error('Failed to update inactivity trigger:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
