import express from 'express';
import { body, query, validationResult } from 'express-validator';
import {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Validation Middleware ─────────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// ─── Public Routes ─────────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
    body('role')
      .optional()
      .isIn(['owner', 'admin', 'manager', 'warehouse_staff', 'viewer', 'user'])
      .withMessage('Invalid role.'),
  ],
  validate,
  signup
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// GET /api/auth/verify-email?token=...&email=...
router.get(
  '/verify-email',
  [
    query('token').notEmpty().withMessage('Verification token is required.'),
    query('email').isEmail().withMessage('A valid email is required.'),
  ],
  validate,
  verifyEmail
);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail().withMessage('A valid email is required.')],
  validate,
  resendVerification
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('A valid email is required.')],
  validate,
  forgotPassword
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits.')
      .isNumeric()
      .withMessage('OTP must be numeric.'),
  ],
  validate,
  verifyOtp
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  resetPassword
);

// ─── Protected Routes ──────────────────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', protect, getMe);

export default router;
