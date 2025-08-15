import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import pinataSDK from '@pinata/sdk';
import formidable from 'formidable';
import fs from 'fs';

// formidable can process the raw file stream.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pinata = new pinataSDK({ pinataApiKey: process.env.PINATA_API!, pinataSecretApiKey: process.env.PINATA_SECRET! });

  const form = formidable({});
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable Error:', err);
      return res.status(500).json({ error: 'Error parsing form data.' });
    }

    try {
      const file = files.file?.[0];
      if (!file) {
        return res.status(400).json({ error: 'No file found in request.' });
      }

      const stream = fs.createReadStream(file.filepath);
      const options = {
        pinataMetadata: {
          name: file.originalFilename || `VaultFile_${Date.now()}`,
        },
      };
      
      const result = await pinata.pinFileToIPFS(stream, options);

      // (Optional but recommended) Clean up the temporary file
      fs.unlink(file.filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting temporary file:", unlinkErr);
        }
      });

      // Send success response
      return res.status(200).json({ cid: result.IpfsHash });

    } catch (error) {
      console.error("Pinata File Upload Error:", error);
      return res.status(500).json({ error: 'Failed to upload file to Pinata.' });
    }
  });
}