import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendOtpEmail } from '../utils/sendEmail.js';

/** Generate a 6-digit numeric OTP */
const generateOtp = () => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/** OTP expiry duration: 5 minutes */
const OTP_EXPIRY_MS = 5 * 60 * 1000;

// ============ Signup ============
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'user' });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// ============ Login ============
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ============ POST /auth/forgot-password ============
// User enters email → generate 6-digit OTP → hash and save to User → send OTP email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const otp = generateOtp();
    const otpHashed = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

    user.otpCode = otpHashed;
    user.otpExpires = otpExpires;
    user.otpVerified = false;
    await user.save({ validateBeforeSave: false });

    const result = await sendOtpEmail(user.email, otp);

    if (result.sent) {
      return res.json({ success: true, message: 'OTP sent to your email. It expires in 5 minutes.' });
    }
    if (result.otpForDev) {
      return res.json({
        success: true,
        message: 'Email not configured. Use the OTP below (development only).',
        otpForDev: result.otpForDev,
      });
    }
    return res.status(503).json({
      success: false,
      message: 'Email service is temporarily unavailable. Please try again later.',
    });
  } catch (err) {
    next(err);
  }
};

// ============ POST /auth/verify-otp ============
// Verify OTP → check expiry → mark OTP as verified, clear stored OTP so it cannot be reused
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this email. Request a new one.' });
    }

    if (new Date() > user.otpExpires) {
      user.clearOtp();
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isValid = await user.compareOtp(otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    user.otpVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'OTP verified. You can now reset your password.' });
  } catch (err) {
    next(err);
  }
};

// ============ POST /auth/reset-password ============
// Reset password only if OTP was verified; then clear OTP fields and return token
export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify your OTP first before resetting password.',
      });
    }

    user.password = newPassword;
    user.clearOtp();
    await user.save();

    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: 'Password reset successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ============ Get current user (protected) ============
export const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};
