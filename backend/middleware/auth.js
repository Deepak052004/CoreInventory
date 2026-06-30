import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config.js';
import { hasPermission } from '../config/permissions.js';

// ─── protect ──────────────────────────────────────────────────────────────────
/**
 * Verify JWT access token from Authorization header.
 * Attaches req.user (without password) on success.
 * Compatible with both old (7d) and new (15m) token durations.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token.' });
  }
};

// ─── restrictTo (backward compatibility alias) ────────────────────────────────
/**
 * @deprecated Use authorizeRole() instead.
 * Kept for backward compatibility with existing routes.
 */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

// ─── authorizeRole ─────────────────────────────────────────────────────────────
/**
 * Middleware to restrict access by user role.
 * Usage: authorizeRole('admin', 'manager')
 */
export const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Your role (${req.user.role}) is not authorized for this action.`,
    });
  }
  next();
};

// ─── authorizePermission ───────────────────────────────────────────────────────
/**
 * Middleware to restrict access by granular permission string.
 * Checks role-based default permissions + custom per-user overrides.
 * Passes if the user has ANY of the listed permissions.
 *
 * Usage: authorizePermission('products:create', 'products:update')
 */
export const authorizePermission = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userHasAny = requiredPermissions.some((perm) =>
    hasPermission(req.user.role, req.user.customPermissions || [], perm)
  );

  if (!userHasAny) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required permission: ${requiredPermissions.join(' or ')}.`,
    });
  }

  next();
};
