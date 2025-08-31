// pages/api/vaults/recipient-unlock.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import axios from 'axios';
import { streamToDataURL } from '../../../lib/utils';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
    
  try {
    const { cid } = req.body;
    const userEmail = session.user.email;

    if (!cid) {
      return res.status(400).json({ error: 'CID is required.' });
    }

    const { rows } = await pool.query(
      `SELECT "originalFilename", "mimeType" FROM vaults WHERE cid = $1 AND $2 = ANY("recipientEmails") AND "deliveryStatus" = 'delivered'`,
      [cid, userEmail]
    );

    const vault = rows[0];
    if (!vault) {
      return res.status(403).json({ error: 'Access denied. You are not a verified recipient of this triggered vault.' });
    }
    
    const manifestRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const manifest = manifestRes.data;

    let fileData = null;
    if (manifest.fileCid) {
        const fileRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${manifest.fileCid}`, {
            responseType: 'stream',
        });
        fileData = await streamToDataURL(fileRes.data, vault.mimeType);
    }

    res.status(200).json({
      data: {
        message: manifest.message,
        fileData: fileData,
      },
      fileName: vault.originalFilename,
    });

  } catch (error) {
    console.error('Recipient unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock vault.' });
  }
}
