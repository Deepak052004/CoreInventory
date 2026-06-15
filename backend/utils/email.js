import nodemailer from 'nodemailer';

// Only create transporter when SMTP is properly configured (avoids ECONNREFUSED to localhost)
const isSmtpConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return host && user && pass && host !== '127.0.0.1' && host !== 'localhost';
};

const createTransporter = () => {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Send OTP email. If SMTP is not configured or send fails:
 * - In development: returns { sent: false, otpForDev } so caller can expose OTP for testing
 * - Logs OTP to console for debugging
 */
export const sendOtpEmail = async (to, otp, subject = 'CoreInventory - Password Reset OTP') => {
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Your one-time password is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (!transporter || !isSmtpConfigured()) {
    console.log('[CoreInventory] SMTP not configured. OTP for', to, ':', otp);
    return { sent: false, otpForDev: process.env.NODE_ENV === 'development' ? otp : undefined };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[CoreInventory] Email send failed:', err.message);
    return {
      sent: false,
      otpForDev: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }
};
