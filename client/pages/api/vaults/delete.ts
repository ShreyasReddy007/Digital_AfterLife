import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

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

  const { cid } = req.body;
  if (!cid) {
    return res.status(400).json({ error: 'CID is required' });
  }

  try {
    // Unpin the file from Pinata to free up storage
    const pinataUnpinUrl = `https://api.pinata.cloud/pinning/unpin/${cid}`;
    await axios.delete(pinataUnpinUrl, {
      headers: {
        'pinata_api_key': process.env.PINATA_API!,
        'pinata_secret_api_key': process.env.PINATA_SECRET!,
      },
    });

    // Delete the vault record
    await pool.query(
      'DELETE FROM vaults WHERE cid = $1 AND "userId" = $2',
      [cid, session.user.id]
    );

    res.status(200).json({ message: 'Vault successfully deleted.' });

  } catch (error: any) {
    // Handle cases where the file might already be unpinned or other errors
    if (error.response && error.response.status === 404) {
        console.warn(`CID ${cid} not found on Pinata, but proceeding to delete from DB.`);
        // If not found on Pinata, Still try to delete from DB.
         await pool.query(
            'DELETE FROM vaults WHERE cid = $1 AND "userId" = $2',
            [cid, session.user.id]
        );
        return res.status(200).json({ message: 'Vault deleted from database.' });
    }
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
