// pages/api/vaults/deliver-by-key.ts
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { sendVaultDeliveryEmail } from '../../../lib/nodemailer';

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

  const { email, recoveryKey } = req.body;
  if (!email || !recoveryKey) {
    return res.status(400).json({ error: 'Email and recovery key are required.' });
  }

  try {
    // Find the user by their email
    const userResult = await pool.query('SELECT id, "recoveryKeyHash" FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !user.recoveryKeyHash) {
      return res.status(404).json({ error: 'Invalid email or recovery key not set for this user.' });
    }

    // Verify the recovery key by comparing hashes
    const isKeyValid = await bcrypt.compare(recoveryKey, user.recoveryKeyHash);
    if (!isKeyValid) {
      return res.status(403).json({ error: 'Invalid recovery key.' });
    }

    // find all pending vaults for this user
    const vaultsResult = await pool.query(
      'SELECT id, cid, name, "recipientEmails" FROM vaults WHERE "userId" = $1 AND "deliveryStatus" = \'pending\'',
      [user.id]
    );
    const dueVaults = vaultsResult.rows;

    if (dueVaults.length === 0) {
      return res.status(200).json({ message: 'Recovery key is valid, but there are no pending vaults to deliver.' });
    }

    // Process each vault
    let successCount = 0;
    for (const vault of dueVaults) {
      if (vault.recipientEmails && vault.recipientEmails.length > 0) {
        await sendVaultDeliveryEmail({
          recipients: vault.recipientEmails,
          vaultName: vault.name,
          cid: vault.cid,
        });
        await pool.query(
          'UPDATE vaults SET "deliveryStatus" = \'delivered\' WHERE id = $1',
          [vault.id]
        );
        successCount++;
      }
    }

    res.status(200).json({ message: `Successfully delivered ${successCount} of ${dueVaults.length} vaults.` });

  } catch (error) {
    console.error('Deliver by Key Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
