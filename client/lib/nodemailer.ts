// lib/nodemailer.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface VaultDetails {
  recipients: string[];
  vaultName: string;
  cid: string;
}

export const sendVaultDeliveryEmail = async ({
  recipients,
  vaultName,
  cid,
}: VaultDetails) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials are not configured.');
  }

  const subject = `A secure vault named "${vaultName}" has been delivered to you`;
  const viewVaultUrl = `${process.env.NEXTAUTH_URL}/view/${cid}`;

  const emailBody = `
    <p>Hello,</p>
    <p>A secure vault named <strong>${vaultName}</strong> has been shared with you.</p>
    <p>You can view the delivered content by clicking the link below:</p>
    <p><a href="${viewVaultUrl}">${viewVaultUrl}</a></p>
    <p>This link is unique to this vault. Please keep it safe.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Digital Afterlife" <${process.env.GMAIL_USER}>`,
      to: recipients.join(', '),
      subject: subject,
      html: emailBody,
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
