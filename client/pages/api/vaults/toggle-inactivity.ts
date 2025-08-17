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
  // First, get the user's session to make sure they are authenticated.
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    // If there's no session, deny access.
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // This endpoint should only accept POST requests.
  if (req.method === 'POST') {
    try {
      const userId = session.user.id;
      // Get the vault ID and the new enabled state from the request body.
      const { vaultId, isEnabled } = req.body;

      // Validate that the required data was sent.
      if (vaultId === undefined || isEnabled === undefined) {
        return res.status(400).json({ message: 'Missing vaultId or isEnabled flag.' });
      }

      // Update the "inactivityTrigger" column in the database.
      // The WHERE clause ensures that users can only modify their own vaults.
      const { rowCount } = await pool.query(
        `UPDATE vaults SET "inactivityTrigger" = $1 WHERE id = $2 AND "userId" = $3`,
        [isEnabled, vaultId, userId]
      );

      // If rowCount is 0, it means no vault was found for that user with that ID.
      if (rowCount === 0) {
          return res.status(404).json({ message: 'Vault not found or access denied.' });
      }

      // If the update was successful, return a success message.
      res.status(200).json({ message: 'Inactivity trigger updated successfully.' });
    } catch (error) {
      console.error('Failed to update inactivity trigger:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    // If the request method is not POST, reject it.
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
