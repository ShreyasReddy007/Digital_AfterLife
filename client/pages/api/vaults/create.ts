// pages/api/vaults/create.ts
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import bcrypt from 'bcrypt';

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

  // --- NEW: Destructure recipientEmails string ---
  const { cid, password, name, originalFilename, mimeType, recipientEmails } = req.body;
  
  if (!cid || !password || !name) {
    return res.status(400).json({ error: 'CID, password, and name are required' });
  }

  try {
    const userId = session.user.id;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // --- NEW: Process the email string into a clean array for the database ---
    let emailsToStore: string[] | null = null;
    if (recipientEmails && typeof recipientEmails === 'string' && recipientEmails.trim() !== '') {
      emailsToStore = recipientEmails
        .split(',') // Split the string by commas
        .map(email => email.trim()) // Remove whitespace from each email
        .filter(email => email); // Filter out any empty strings
      if (emailsToStore.length === 0) {
        emailsToStore = null;
      }
    }

    // --- NEW: Updated SQL query to insert the array ---
    const newVault = await pool.query(
      'INSERT INTO vaults (cid, "userId", name, "passwordHash", "originalFilename", "mimeType", "recipientEmails") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, cid, name, created_at',
      [cid, userId, name, passwordHash, originalFilename, mimeType, emailsToStore]
    );

    res.status(201).json(newVault.rows[0]);

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Internal Server Error while creating vault' });
  }
}
