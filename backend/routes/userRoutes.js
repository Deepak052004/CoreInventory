import express from 'express';
import { body } from 'express-validator';
import { protect, authorizeRole, authorizePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/permissions.js';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions,
  resetUserPermissions,
  getUserLoginHistory,
  getUserPermissions,
  getProfile,
  updateProfile,
} from '../controllers/userManagementController.js';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// ─── Own Profile (available to all authenticated users) ───────────────────────
router.get('/profile', getProfile);
router.patch('/profile', [body('name').trim().notEmpty().withMessage('Name is required.')], updateProfile);

// ─── User Management (admin/owner only) ───────────────────────────────────────

// GET /api/users — List all users
router.get(
  '/',
  authorizePermission(PERMISSIONS.USERS_READ),
  listUsers
);

// GET /api/users/:id — Get single user
router.get(
  '/:id',
  authorizePermission(PERMISSIONS.USERS_READ),
  getUser
);

// POST /api/users — Create new user
router.post(
  '/',
  authorizePermission(PERMISSIONS.USERS_CREATE),
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role')
      .optional()
      .isIn(['owner', 'admin', 'manager', 'warehouse_staff', 'viewer'])
      .withMessage('Invalid role. Must be one of: owner, admin, manager, warehouse_staff, viewer'),
  ],
  createUser
);

// PUT /api/users/:id — Update user (role, name, active status)
router.put(
  '/:id',
  authorizePermission(PERMISSIONS.USERS_UPDATE),
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('role')
      .optional()
      .isIn(['owner', 'admin', 'manager', 'warehouse_staff', 'viewer'])
      .withMessage('Invalid role.'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean.'),
  ],
  updateUser
);

// DELETE /api/users/:id — Soft delete user
router.delete(
  '/:id',
  authorizePermission(PERMISSIONS.USERS_DELETE),
  deleteUser
);

// ─── Permission Management ────────────────────────────────────────────────────

// GET /api/users/:id/permissions — View effective permissions
router.get(
  '/:id/permissions',
  authorizePermission(PERMISSIONS.USERS_READ),
  getUserPermissions
);

// PATCH /api/users/:id/permissions — Grant or revoke specific permissions
router.patch(
  '/:id/permissions',
  authorizePermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS),
  [
    body('grant').optional().isArray().withMessage('grant must be an array.'),
    body('revoke').optional().isArray().withMessage('revoke must be an array.'),
  ],
  updateUserPermissions
);

// DELETE /api/users/:id/permissions — Reset to role defaults
router.delete(
  '/:id/permissions',
  authorizePermission(PERMISSIONS.USERS_MANAGE_PERMISSIONS),
  resetUserPermissions
);

// ─── Login History ─────────────────────────────────────────────────────────────

// GET /api/users/:id/login-history
router.get(
  '/:id/login-history',
  authorizePermission(PERMISSIONS.USERS_READ),
  getUserLoginHistory
);

export default router;
