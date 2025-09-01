// pages/api/vaults/public-view.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { streamToDataURL } from '../../../lib/utils';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { cid } = req.query;
  if (!cid || typeof cid !== 'string') {
    return res.status(400).json({ error: 'CID is required.' });
  }

  try {
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
    console.error('Public view error:', error);
    res.status(500).json({ error: 'Failed to retrieve vault data.' });
  }
}
