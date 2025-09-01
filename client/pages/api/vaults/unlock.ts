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
      'SELECT "passwordHash" FROM vaults WHERE cid = $1 AND "userId" = $2',
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

    const manifestRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const manifest = manifestRes.data;

    const unlockedFiles = [];
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
    console.error('Unlock error:', error);
    res.status(500).json({ error: 'Failed to unlock vault.' });
  }
}

