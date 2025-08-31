// pages/api/vaults/content.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cid } = req.query;

  if (!cid || typeof cid !== 'string') {
    return res.status(400).json({ error: 'CID is required.' });
  }

  try {
    const pinataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    res.status(200).json(pinataResponse.data);
  } catch (error) {
    console.error('Failed to fetch vault content:', error);
    res.status(500).json({ error: 'Failed to fetch vault content from IPFS.' });
  }
}


