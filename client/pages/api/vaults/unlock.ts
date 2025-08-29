// pages/api/vaults/unlock.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import axios from 'axios';
import { streamToBuffer } from '../../../lib/utils';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { cid, password } = req.body;
      const userId = session.user.id;

      if (!cid || !password) {
        return res.status(400).json({ error: 'CID and password are required.' });
      }

      const { rows } = await pool.query(
        'SELECT * FROM vaults WHERE cid = $1 AND "userId" = $2',
        [cid, userId]
      );
      const vault = rows[0];

      if (!vault) {
        return res.status(404).json({ error: 'Vault not found or access denied.' });
      }

      const passwordMatch = await bcrypt.compare(password, vault.passwordHash);
      if (!passwordMatch) {
        return res.status(403).json({ error: 'Invalid password.' });
      }

      // 1. Fetch the master JSON from Pinata
      const jsonResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const vaultContent = jsonResponse.data;

      // 2. Check if there's a file CID inside the JSON
      if (vaultContent.fileCid) {
        const fileResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${vaultContent.fileCid}`, { responseType: 'stream' });
        const buffer = await streamToBuffer(fileResponse.data);
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:${vault.mimeType};base64,${base64Data}`;
        
        return res.status(200).json({ 
            message: vaultContent.message || null,
            file: {
                dataUrl: dataUrl,
                fileName: vault.originalFilename
            }
        });
      }
      
      // If there's only a message
      res.status(200).json({ message: vaultContent.message || null, file: null });

    } catch (error) {
      console.error('Unlock error:', error);
      res.status(500).json({ error: 'Failed to unlock vault.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
