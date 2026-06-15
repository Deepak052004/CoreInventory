import nodemailer from 'nodemailer';
import { config } from '../config.js';

/**
 * Create Nodemailer transporter for Gmail SMTP.
 * Uses EMAIL_USER and EMAIL_PASS from environment.
 * For Gmail: enable 2FA and use an App Password (not your regular password).
 */
const createTransporter = () => {
  const user = config.emailUser;
  const pass = config.emailPass;
  if (!user || !pass) {
    console.warn('[sendEmail] EMAIL_USER or EMAIL_PASS not set. OTP emails will not be sent.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
};

const transporter = createTransporter();

/**
 * Send OTP email for password reset.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP (plain text)
 * @param {string} subject - Email subject
 * @returns {Promise<{ sent: boolean, otpForDev?: string }>}
 */
export const sendOtpEmail = async (to, otp, subject = 'CoreInventory - Password Reset OTP') => {
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Your one-time password is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This OTP expires in 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    console.log('[sendEmail] OTP for', to, ':', otp, '(email not configured)');
    return { sent: false, otpForDev: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[sendEmail] Failed:', err.message);
    return {
      sent: false,
      otpForDev: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }
};
