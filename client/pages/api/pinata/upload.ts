import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Ensure the user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const pinataData = {
      pinataContent: req.body.content,
      pinataMetadata: {
        name: `VaultContent_${new Date().toISOString()}`,
      },
    };

    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      pinataData,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': process.env.PINATA_API!,
          'pinata_secret_api_key': process.env.PINATA_SECRET!,
        },
      }
    );

    // Return the real CID
    res.status(200).json({ cid: pinataResponse.data.IpfsHash });

  } catch (error) {
    console.error("Pinata API Error:", error);
    res.status(500).json({ error: 'Failed to upload content to Pinata.' });
  }
}
