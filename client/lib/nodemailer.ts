// lib/nodemailer.ts
import nodemailer from 'nodemailer';

// Configure the email transporter using your Gmail account
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
  const pinataGatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

  const emailBody = `
    <p>Hello,</p>
    <p>A secure vault named <strong>${vaultName}</strong> has been shared with you.</p>
    <p>You can access the encrypted content using the following link:</p>
    <p><a href="${pinataGatewayUrl}">${pinataGatewayUrl}</a></p>
    <p>To unlock the content, you must log in to the application with your email address.</p>
    <p>Please keep this information safe and secure.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Digital Afterlife" <${process.env.GMAIL_USER}>`, // Sender address
      to: recipients.join(', '), // List of receivers
      subject: subject, // Subject line
      html: emailBody, // HTML body
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};