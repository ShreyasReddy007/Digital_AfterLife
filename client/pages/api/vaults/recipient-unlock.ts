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
      `SELECT * FROM vaults WHERE cid = $1 AND $2 = ANY("recipientEmails") AND "deliveryStatus" = 'delivered'`,
      [cid, userEmail]
    );

    const vault = rows[0];
    if (!vault) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    
    const manifestRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const manifest = manifestRes.data;

    const unlockedFiles = [];
    // If the manifest has a files array, process each file
    if (manifest.files && Array.isArray(manifest.files)) {
      for (const fileInfo of manifest.files) {
        const fileRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${fileInfo.cid}`, {
            responseType: 'stream',
        });
        const fileData = await streamToDataURL(fileRes.data, fileInfo.type);
        unlockedFiles.push({
          data: fileData,
          name: fileInfo.name,
          type: fileInfo.type,
        });
      }
    }

    res.status(200).json({
      message: manifest.message,
      files: unlockedFiles,
    });

  } catch (error) {
    console.error('Recipient unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock vault.' });
  }
}

