// pages/api/cron/check-triggers.ts
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendVaultDeliveryEmail } from '../../../lib/resend';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secret = req.headers.authorization?.split(' ')[1];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const query = `
      SELECT 
        v.id, v.cid, v.name, v."passwordHash", v."recipientEmails" as recipients
      FROM 
        vaults v
      JOIN 
        users u ON v."userId" = u.id
      WHERE
        v."deliveryStatus" = 'pending' AND (
          v."triggerDate" <= NOW()
          OR
          (v."inactivityTrigger" = TRUE AND u."lastSeen" < NOW() - INTERVAL '6 months')
        )
    `;
    const { rows: dueVaults } = await pool.query(query);

    if (dueVaults.length === 0) {
      return res.status(200).json({ message: 'No vaults due for delivery.' });
    }

    console.log(`Found ${dueVaults.length} vaults to be delivered.`);
    let successCount = 0;
    let errorCount = 0;

    for (const vault of dueVaults) {
      try {
        // **NEW DEBUGGING LOG**: This will show us the exact data before the email is sent.
        console.log(`Processing Vault ID: ${vault.id}. Details:`, JSON.stringify(vault, null, 2));

        if (!vault.recipients || vault.recipients.length === 0) {
          console.warn(`Vault ID ${vault.id} has no recipients. Marking as failed.`);
          errorCount++;
          // Optionally mark as failed in DB to prevent retrying
          // await pool.query('UPDATE vaults SET "deliveryStatus" = \'failed\' WHERE id = $1', [vault.id]);
          continue; 
        }
        
        // We are not sending a password in the email anymore, so we don't pass it.
        await sendVaultDeliveryEmail({
          recipients: vault.recipients,
          vaultName: vault.name,
          cid: vault.cid,
        });

        await pool.query(
          'UPDATE vaults SET "deliveryStatus" = \'delivered\' WHERE id = $1',
          [vault.id]
        );
        successCount++;
        console.log(`Successfully processed and delivered vault ID: ${vault.id}`);

      } catch (processingError) {
        errorCount++;
        console.error(`Failed to process vault ID ${vault.id}:`, processingError);
      }
    }

    res.status(200).json({ 
      message: 'Cron job finished.',
      processed: dueVaults.length,
      successful_deliveries: successCount,
      failed_deliveries: errorCount,
    });

  } catch (error) {
    console.error('Cron Job Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
