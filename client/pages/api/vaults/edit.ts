// pages/api/vaults/edit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadFileToPinata = async (filePath: string, fileName: string) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath), fileName);

    const response = await axios.post(url, data, {
        headers: {
            ...data.getHeaders(),
            'pinata_api_key': process.env.PINATA_API!,
            'pinata_secret_api_key': process.env.PINATA_SECRET!,
        },
    });
    return response.data.IpfsHash;
};

const uploadJsonToPinata = async (jsonContent: object) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const response = await axios.post(url, jsonContent, {
        headers: {
            'pinata_api_key': process.env.PINATA_API!,
            'pinata_secret_api_key': process.env.PINATA_SECRET!,
        },
    });
    return response.data.IpfsHash;
};

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
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const vaultId = fields.vaultId?.[0];
    const name = fields.name?.[0];
    const message = fields.message?.[0];
    const recipientEmails = fields.recipientEmails?.[0];
    const file = files.file?.[0];
    
    if (!vaultId || !name) {
      return res.status(400).json({ error: 'Vault ID and name are required.' });
    }

    const userId = session.user.id;
    const { rows: currentVaultRows } = await pool.query(
        'SELECT cid FROM vaults WHERE id = $1 AND "userId" = $2',
        [vaultId, userId]
    );

    if (currentVaultRows.length === 0) {
        return res.status(404).json({ error: 'Vault not found or access denied.' });
    }
    const oldMasterCid = currentVaultRows[0].cid;

    const oldContentRes = await axios.get(`https://gateway.pinata.cloud/ipfs/${oldMasterCid}`);
    const oldContent = oldContentRes.data;
    let newFileCid = oldContent.fileCid;

    if (file && file.filepath) {
        newFileCid = await uploadFileToPinata(file.filepath, file.originalFilename || 'file');
    }
    
    const newContent = {
        message: message || '',
        fileCid: newFileCid || null,
    };
    const newMasterCid = await uploadJsonToPinata(newContent);

    let emailsToStore: string[] | null = null;
    if (recipientEmails && recipientEmails.trim() !== '') {
        emailsToStore = recipientEmails.split(',').map(e => e.trim()).filter(e => e);
    }
    
    await pool.query(
        'UPDATE vaults SET name = $1, "recipientEmails" = $2, cid = $3 WHERE id = $4 AND "userId" = $5',
        [name, emailsToStore, newMasterCid, vaultId, userId]
    );

    res.status(200).json({ message: 'Vault updated successfully.', newCid: newMasterCid });

  } catch (error) {
    console.error('Edit Vault Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

