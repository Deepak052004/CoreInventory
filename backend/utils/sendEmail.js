import nodemailer from 'nodemailer';
import { config } from '../config.js';

// ─── Transporter Factory ───────────────────────────────────────────────────────

/**
 * Create a Nodemailer transporter.
 * Supports both Gmail (EMAIL_USER/EMAIL_PASS) and generic SMTP (SMTP_HOST etc.).
 * Returns null when email is not configured — callers must handle gracefully.
 */
const createTransporter = () => {
  // Generic SMTP (SendGrid, Mailgun, AWS SES, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  // Gmail shorthand (EMAIL_USER + EMAIL_PASS app password)
  if (config.emailUser && config.emailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.emailUser, pass: config.emailPass },
    });
  }

  return null;
};

const transporter = createTransporter();

// ─── Base Send Function ────────────────────────────────────────────────────────

/**
 * Send an email. Logs to console in development when SMTP is not configured.
 * @returns {{ sent: boolean, devInfo?: object }}
 */
const send = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn(`[Email] SMTP not configured. Would have sent "${subject}" to ${to}`);
    return { sent: false, devInfo: { to, subject } };
  }
  try {
    await transporter.sendMail({
      from: `"CoreInventory" <${config.emailFrom}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    return { sent: true };
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return { sent: false, devInfo: { to, subject, error: err.message } };
  }
};

// ─── Email Templates ───────────────────────────────────────────────────────────

const baseWrapper = (content) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; background: #f8fafc;">
    <div style="background: #0f172a; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="color: #6ee7b7; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">CoreInventory</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Enterprise Inventory Management</p>
    </div>
    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      ${content}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        This is an automated message from CoreInventory. Do not reply to this email.
      </p>
    </div>
  </div>
`;

const otpBox = (otp) => `
  <div style="background: #f1f5f9; border-radius: 10px; padding: 20px 32px; text-align: center; margin: 24px 0; letter-spacing: 12px; font-size: 34px; font-weight: 800; color: #0f172a; font-family: 'Courier New', monospace;">
    ${otp}
  </div>
`;

// ─── Exported Email Functions ──────────────────────────────────────────────────

/**
 * Send password reset OTP email.
 * @param {string} to
 * @param {string} otp - Plain 6-digit OTP (not hashed)
 * @returns {{ sent: boolean, otpForDev?: string }}
 */
export const sendOtpEmail = async (to, otp, subject = 'CoreInventory - Password Reset OTP') => {
  const html = baseWrapper(`
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px;">Password Reset Request</h2>
    <p style="color: #475569; margin: 0 0 4px;">You requested to reset your CoreInventory password.</p>
    <p style="color: #475569; margin: 0 0 20px;">Use the OTP below to verify your identity:</p>
    ${otpBox(otp)}
    <p style="color: #64748b; font-size: 13px; margin: 0;">This OTP expires in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
  `);

  const result = await send({ to, subject, html });

  if (!result.sent && config.nodeEnv === 'development') {
    console.log(`[Email:DEV] OTP for ${to}: ${otp}`);
    return { sent: false, otpForDev: otp };
  }

  return result;
};

/**
 * Send email verification link.
 * @param {string} to
 * @param {string} verificationUrl - Full URL with token embedded
 */
export const sendVerificationEmail = async (to, verificationUrl) => {
  const html = baseWrapper(`
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px;">Verify Your Email</h2>
    <p style="color: #475569; margin: 0 0 20px;">Welcome to CoreInventory! Please click the button below to verify your email address and activate your account.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${verificationUrl}"
         style="background: #10b981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px; margin: 0;">
      This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
    </p>
    <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">
      If the button doesn't work, copy and paste this URL into your browser:<br/>
      <a href="${verificationUrl}" style="color: #6ee7b7; word-break: break-all;">${verificationUrl}</a>
    </p>
  `);

  return send({ to, subject: 'CoreInventory - Verify Your Email Address', html });
};

/**
 * Send account locked notification email.
 * @param {string} to
 * @param {number} lockDurationMinutes
 */
export const sendAccountLockedEmail = async (to, lockDurationMinutes = 15) => {
  const html = baseWrapper(`
    <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 8px;">⚠️ Account Temporarily Locked</h2>
    <p style="color: #475569; margin: 0 0 20px;">
      Your CoreInventory account has been temporarily locked due to multiple failed login attempts.
    </p>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="color: #991b1b; margin: 0; font-weight: 600;">Lock Duration: ${lockDurationMinutes} minutes</p>
    </div>
    <p style="color: #64748b; font-size: 13px;">
      If this was not you, please reset your password immediately. Your account will automatically unlock after ${lockDurationMinutes} minutes.
    </p>
  `);

  return send({ to, subject: 'CoreInventory - Account Locked', html });
};

/**
 * Send password changed confirmation email.
 * @param {string} to
 * @param {string} name
 */
export const sendPasswordChangedEmail = async (to, name) => {
  const html = baseWrapper(`
    <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 8px;">Password Changed Successfully</h2>
    <p style="color: #475569; margin: 0 0 20px;">Hi ${name || 'there'}, your CoreInventory password has been changed successfully.</p>
    <p style="color: #64748b; font-size: 13px;">
      If you did not make this change, please contact your administrator immediately.
    </p>
  `);

  return send({ to, subject: 'CoreInventory - Password Changed', html });
};
