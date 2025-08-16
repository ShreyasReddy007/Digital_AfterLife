// pages/api/cron/check-triggers.ts
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // You can add a secret key here for security if you want
  // const secret = req.headers.authorization?.split(' ')[1];
  // if (secret !== process.env.CRON_SECRET) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    // Find all vaults where the trigger date is in the past and an email hasn't been sent yet
    const { rows } = await pool.query(
      'SELECT * FROM vaults WHERE "triggerDate" <= NOW()' // Add a "sent" flag in a real app
    );

    console.log(`Found ${rows.length} vaults to be triggered.`);

    for (const vault of rows) {
      // TODO:
      // 1. Get the list of recipients for this vault (needs a new table).
      // 2. Fetch the vault content from Pinata.
      // 3. Use an email service (like SendGrid, Resend, etc.) to send the content.
      // 4. Mark the vault as "triggered" in the database to prevent re-sending.
      console.log(`Triggering vault ID: ${vault.id}, CID: ${vault.cid}`);
    }

    res.status(200).json({ message: `Processed ${rows.length} vaults.` });

  } catch (error) {
    console.error('Cron Job Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}