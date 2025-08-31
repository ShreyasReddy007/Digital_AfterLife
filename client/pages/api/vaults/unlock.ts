// pages/api/vaults/unlock.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { streamToDataURL } from '../../../lib/utils';

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

  try {
    const { cid, password } = req.body;
    if (!cid || !password) {
      return res.status(400).json({ error: 'CID and password are required.' });
    }

    const { rows } = await pool.query(
      'SELECT "passwordHash", "originalFilename", "mimeType" FROM vaults WHERE cid = $1 AND "userId" = $2',
      [cid, session.user.id]
    );

    const vault = rows[0];
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found or access denied.' });
    }

    const passwordIsValid = await bcrypt.compare(password, vault.passwordHash);
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Fetch the master JSON manifest
    const manifestRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const manifest = manifestRes.data;

    let fileData = null;
    // If the manifest has a fileCid, fetch the file content
    if (manifest.fileCid) {
      const fileRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${manifest.fileCid}`, {
          responseType: 'stream',
      });
      // Convert the file stream to a base64 data URL
      fileData = await streamToDataURL(fileRes.data, vault.mimeType);
    }

    // Send the complete content object to the frontend
    res.status(200).json({
      data: {
        message: manifest.message,
        fileData: fileData,
      },
      fileName: vault.originalFilename,
    });

  } catch (error) {
    console.error('Unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock vault.' });
  }
}
