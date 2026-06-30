import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import RefreshToken from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  hashRefreshToken,
} from '../utils/generateTokens.js';
import {
  sendOtpEmail,
  sendVerificationEmail,
  sendAccountLockedEmail,
  sendPasswordChangedEmail,
} from '../utils/sendEmail.js';
import { config } from '../config.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract client IP from request (handles proxies) */
const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.headers['x-real-ip'] ||
  req.socket?.remoteAddress ||
  'unknown';

/** Extract user-agent string (truncated to 255 chars for storage) */
const getDevice = (req) => (req.headers['user-agent'] || 'unknown').substring(0, 255);

/** Generate a 6-digit numeric OTP */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/** Set a secure HttpOnly cookie for the refresh token */
const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: config.refreshTokenExpireMs,
    path: '/api/auth',
  });
};

/** Log a login history event (non-blocking — fire and forget) */
const logAuthEvent = (userId, action, req, extra = {}) => {
  LoginHistory.create({
    user: userId,
    action,
    ip: getClientIp(req),
    device: getDevice(req),
    ...extra,
  }).catch((err) => console.error('[AuthController] Failed to log auth event:', err.message));
};

// ─── Signup ────────────────────────────────────────────────────────────────────

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent duplicate accounts
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate email verification token
    const { plainToken, tokenHash } = generateEmailVerificationToken();
    const verificationExpires = new Date(Date.now() + config.emailVerificationExpireMs);

    // Create user — password is hashed by pre-save hook
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'user',
      isEmailVerified: false,
      emailVerificationToken: tokenHash,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${plainToken}&email=${encodeURIComponent(user.email)}`;
    const emailResult = await sendVerificationEmail(user.email, verificationUrl);

    const responsePayload = {
      success: true,
      message: 'Account created. Please verify your email before logging in.',
    };

    // In development, expose the verification token if email is not configured
    if (!emailResult.sent && config.nodeEnv === 'development') {
      responsePayload.devVerificationUrl = verificationUrl;
    }

    return res.status(201).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIp(req);
    const device = getDevice(req);

    // Fetch user with sensitive fields needed for login checks
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password +loginAttempts +lockUntil +isEmailVerified +emailVerificationToken +emailVerificationExpires'
    );

    // Unknown email — do NOT reveal whether email exists (security best practice)
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Account disabled
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact an administrator.' });
    }

    // Account locked check
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logAuthEvent(user._id, 'login_failed', req, { failureReason: 'account_locked' });
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
        lockUntil: user.lockUntil,
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      await user.incrementLoginAttempts(config.maxLoginAttempts, config.lockDurationMs);

      // Re-fetch to get updated attempt count
      const refreshedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
      logAuthEvent(user._id, 'login_failed', req, { failureReason: 'wrong_password' });

      if (refreshedUser.isLocked) {
        // Send lock notification (non-blocking)
        const lockMinutes = Math.ceil(config.lockDurationMs / 60000);
        sendAccountLockedEmail(user.email, lockMinutes).catch(() => {});
        logAuthEvent(user._id, 'account_locked', req);

        return res.status(423).json({
          success: false,
          message: `Account locked after ${config.maxLoginAttempts} failed attempts. Try again in ${lockMinutes} minute(s).`,
        });
      }

      const attemptsLeft = config.maxLoginAttempts - (refreshedUser.loginAttempts || 1);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining before account lock.`,
      });
    }

    // Email verification check
    if (!user.isEmailVerified) {
      logAuthEvent(user._id, 'login_failed', req, { failureReason: 'email_not_verified' });
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // ── Login successful ──────────────────────────────────────────────────────

    // Reset failed login attempts
    await User.findByIdAndUpdate(user._id, {
      $set: {
        loginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        lastLoginDevice: device,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const { plainToken: plainRefresh, tokenHash: refreshHash } = generateRefreshToken();

    // Persist hashed refresh token
    await RefreshToken.create({
      user: user._id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + config.refreshTokenExpireMs),
      ip,
      device,
    });

    // Send refresh token as HttpOnly cookie
    setRefreshCookie(res, plainRefresh);

    // Audit log
    logAuthEvent(user._id, 'login_success', req);

    return res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────────

export const logout = async (req, res, next) => {
  try {
    const { refreshToken: tokenFromBody } = req.body;
    const tokenFromCookie = req.cookies?.refreshToken;
    const plainToken = tokenFromBody || tokenFromCookie;

    if (plainToken) {
      const tokenHash = hashRefreshToken(plainToken);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { isRevoked: true } });
    }

    // Clear the cookie regardless
    res.clearCookie('refreshToken', { path: '/api/auth' });

    if (req.user) {
      logAuthEvent(req.user._id, 'logout', req);
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: tokenFromBody } = req.body;
    const tokenFromCookie = req.cookies?.refreshToken;
    const plainToken = tokenFromBody || tokenFromCookie;

    if (!plainToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not provided.' });
    }

    const tokenHash = hashRefreshToken(plainToken);
    const storedToken = await RefreshToken.findOne({ tokenHash }).select('+tokenHash');

    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    if (storedToken.isRevoked) {
      // Token reuse detected — revoke ALL tokens for this user (security: token theft)
      await RefreshToken.updateMany({ user: storedToken.user }, { $set: { isRevoked: true } });
      return res.status(401).json({
        success: false,
        message: 'Token reuse detected. All sessions have been invalidated. Please log in again.',
      });
    }

    if (storedToken.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token has expired. Please log in again.' });
    }

    // Verify user still exists and is active
    const user = await User.findById(storedToken.user);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    // ── Rotate refresh token (one-time use) ──────────────────────────────────
    const { plainToken: newPlain, tokenHash: newHash } = generateRefreshToken();
    const ip = getClientIp(req);
    const device = getDevice(req);

    // Revoke old token, create new one
    await Promise.all([
      RefreshToken.findByIdAndUpdate(storedToken._id, {
        $set: { isRevoked: true, replacedByTokenHash: newHash },
      }),
      RefreshToken.create({
        user: user._id,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + config.refreshTokenExpireMs),
        ip,
        device,
      }),
    ]);

    const newAccessToken = generateAccessToken(user._id);
    setRefreshCookie(res, newPlain);

    return res.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────────

export const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ success: false, message: 'Verification token and email are required.' });
    }

    const { tokenHash } = { tokenHash: hashRefreshToken(token) };

    // Import crypto inline to hash the email verification token (same SHA-256)
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isEmailVerified: false,
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link or email is already verified.',
      });
    }

    if (user.emailVerificationToken !== hashedToken) {
      return res.status(400).json({ success: false, message: 'Invalid or tampered verification token.' });
    }

    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired. Please request a new one.',
        code: 'VERIFICATION_EXPIRED',
      });
    }

    // Mark email as verified
    await User.findByIdAndUpdate(user._id, {
      $set: { isEmailVerified: true },
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    });

    return res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// ─── Resend Verification Email ─────────────────────────────────────────────────

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+isEmailVerified +emailVerificationToken +emailVerificationExpires'
    );

    // Always respond with success to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'If an unverified account exists for this email, a new verification link has been sent.',
      });
    }

    const { plainToken, tokenHash } = generateEmailVerificationToken();
    const verificationExpires = new Date(Date.now() + config.emailVerificationExpireMs);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: verificationExpires,
      },
    });

    const verificationUrl = `${config.frontendUrl}/verify-email?token=${plainToken}&email=${encodeURIComponent(user.email)}`;
    const emailResult = await sendVerificationEmail(user.email, verificationUrl);

    const response = {
      success: true,
      message: 'A new verification link has been sent to your email.',
    };

    if (!emailResult.sent && config.nodeEnv === 'development') {
      response.devVerificationUrl = verificationUrl;
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────────

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpCode +otpExpires +otpVerified');

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account with this email exists, an OTP has been sent.' });
    }

    const otp = generateOtp();
    const otpHashed = await bcrypt.hash(otp, 10);

    user.otpCode = otpHashed;
    user.otpExpires = new Date(Date.now() + config.otpExpireMs);
    user.otpVerified = false;
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendOtpEmail(user.email, otp);

    const response = { success: true, message: 'If an account with this email exists, an OTP has been sent.' };

    if (!emailResult.sent && config.nodeEnv === 'development') {
      response.otpForDev = emailResult.otpForDev;
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

// ─── Verify OTP ────────────────────────────────────────────────────────────────

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otpCode +otpExpires +otpVerified');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP was requested for this account. Please request a new one.' });
    }

    if (new Date() > user.otpExpires) {
      user.clearOtp();
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isValid = await user.compareOtp(otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    // Mark OTP as verified and clear the code (single-use)
    user.otpVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password +otpVerified +otpCode +otpExpires'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (!user.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify your OTP before resetting your password.',
      });
    }

    user.password = newPassword;
    user.clearOtp();
    // Reset login attempts on password change
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke all existing refresh tokens for security
    await RefreshToken.updateMany({ user: user._id }, { $set: { isRevoked: true } });

    // Notify user
    sendPasswordChangedEmail(user.email, user.name).catch(() => {});
    logAuthEvent(user._id, 'password_reset', req);

    return res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Current User ──────────────────────────────────────────────────────────

export const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id).select(
      'name email role isEmailVerified isActive lastLoginAt lastLoginIp createdAt'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
