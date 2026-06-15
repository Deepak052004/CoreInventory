import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  next();
};

// POST /auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'manager', 'user']),
  ],
  validate,
  signup
);

// POST /auth/login
router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);

// POST /auth/forgot-password - Request OTP; sends 6-digit OTP to user's email
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  forgotPassword
);

// POST /auth/verify-otp - Verify OTP before allowing password reset
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric'),
  ],
  validate,
  verifyOtp
);

// POST /auth/reset-password - Reset password (only after OTP verified)
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  resetPassword
);

// GET /auth/me - Current user (protected)
router.get('/me', protect, getMe);

export default router;
