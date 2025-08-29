// pages/api/vaults/public-view.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import axios from 'axios';
import { streamToBuffer } from '../../../lib/utils';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { cid } = req.query;

      if (!cid || typeof cid !== 'string') {
        return res.status(400).json({ error: 'A valid CID is required.' });
      }

      const { rows } = await pool.query(
        'SELECT "mimeType", "originalFilename" FROM vaults WHERE cid = $1',
        [cid]
      );
      const vaultMeta = rows[0];

      if (!vaultMeta) {
        return res.status(404).json({ error: 'Vault not found.' });
      }

      const jsonResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const vaultContent = jsonResponse.data;

      //fetch the file and convert it
      if (vaultContent.fileCid) {
        const fileResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${vaultContent.fileCid}`, { responseType: 'stream' });
        const buffer = await streamToBuffer(fileResponse.data);
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:${vaultMeta.mimeType};base64,${base64Data}`;
        
        return res.status(200).json({ 
            message: vaultContent.message || null,
            file: {
                dataUrl: dataUrl,
                fileName: vaultMeta.originalFilename
            }
        });
      }
      
      // If there's only a message
      res.status(200).json({ message: vaultContent.message || null, file: null });

    } catch (error) {
      console.error('Public view error:', error);
      res.status(500).json({ error: 'Failed to retrieve vault content.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
