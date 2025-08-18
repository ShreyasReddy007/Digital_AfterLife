// lib/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface VaultDetails {
  recipients: string[];
  vaultName: string;
  cid: string;
  password?: string; // Password might not always exist
}

export const sendVaultDeliveryEmail = async ({
  recipients,
  vaultName,
  cid,
  password,
}: VaultDetails) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is not configured.');
  }

  const subject = `A secure vault named "${vaultName}" has been delivered to you`;
  const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

  // This is the email content. You can customize it with HTML.
  const emailBody = `
    <p>Hello,</p>
    <p>A secure vault named <strong>${vaultName}</strong> has been shared with you.</p>
    <p>You can access the encrypted content using the following link:</p>
    <p><a href="${pinataGatewayUrl}">${pinataGatewayUrl}</a></p>
    ${password ? `<p>The password to decrypt the content is: <strong>${password}</strong></p>` : ''}
    <p>Please keep this information safe and secure.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Vault Delivery <onboarding@resend.dev>',
      to: recipients,
      subject: subject,
      html: emailBody,
    });

    if (error) {
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};