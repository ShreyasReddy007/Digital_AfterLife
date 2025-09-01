// pages/api/vaults/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import bcrypt from 'bcrypt';

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
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = formidable({ multiples: true });
    const [fields, files] = await form.parse(req);

    const name = fields.name?.[0];
    const password = fields.password?.[0];
    const message = fields.message?.[0];
    const recipientEmails = fields.recipientEmails?.[0];
    const uploadedFiles = files.files;

    if (!name || !password) {
      return res.status(400).json({ error: 'Vault name and password are required.' });
    }

    const fileManifests = [];
    const originalFilenames = [];
    const mimeTypes = [];

    if (uploadedFiles) {
      for (const file of uploadedFiles) {
        const fileCid = await uploadFileToPinata(file.filepath, file.originalFilename || 'file');
        fileManifests.push({
          cid: fileCid,
          name: file.originalFilename,
          type: file.mimetype,
        });
        originalFilenames.push(file.originalFilename || 'file');
        mimeTypes.push(file.mimetype || 'application/octet-stream');
      }
    }

    const masterContent = {
      message: message || '',
      files: fileManifests, 
    };
    const masterCid = await uploadJsonToPinata(masterContent);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let emailsToStore: string[] | null = null;
    if (recipientEmails && recipientEmails.trim() !== '') {
        emailsToStore = recipientEmails.split(',').map(e => e.trim()).filter(e => e);
    }

    const newVault = await pool.query(
      'INSERT INTO vaults (cid, "userId", name, "passwordHash", "recipientEmails", "originalFilenames", "mimeTypes") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, cid, name, created_at',
      [masterCid, session.user.id, name, passwordHash, emailsToStore, originalFilenames, mimeTypes]
    );

    res.status(201).json(newVault.rows[0]);

  } catch (error) {
    console.error('Create Vault Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
