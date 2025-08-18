// pages/api/vaults/recipient-unlock.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { Pool } from 'pg';
import axios from 'axios';
// You will need a function to decrypt content, similar to your original unlock endpoint.
// Let's assume you have a utility for that.
// import { decryptContent } from '../../../lib/encryption'; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { cid } = req.body;
      const userEmail = session.user.email;

      if (!cid) {
        return res.status(400).json({ error: 'CID is required.' });
      }

      // Security Check: Verify this user is a recipient of this specific, delivered vault.
      const { rows } = await pool.query(
        `SELECT * FROM vaults WHERE cid = $1 AND $2 = ANY("recipientEmails") AND "deliveryStatus" = 'delivered'`,
        [cid, userEmail]
      );

      const vault = rows[0];
      if (!vault) {
        return res.status(403).json({ error: 'Access denied. You are not a verified recipient of this triggered vault.' });
      }
      
      // Since the check passed, we can now fetch the content from Pinata.
      // This part will be similar to your original unlock logic, but without password decryption.
      // For now, let's assume we are just returning a success message.
      // In a real implementation, you would fetch from Pinata and decrypt here.
      const pinataResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      // This is a placeholder for how you would return the content.
      // You'll need to adapt this based on how you handle file vs. json unlocking.
      res.status(200).json({
        type: 'file', // or 'json'
        data: pinataResponse.data, // This might need further processing
        fileName: vault.originalFilename || 'vault_content'
      });

    } catch (error) {
      console.error('Recipient unlock error:', error);
      res.status(500).json({ error: 'Failed to unlock vault.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
