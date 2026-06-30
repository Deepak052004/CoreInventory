import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import RefreshToken from '../models/RefreshToken.js';
import { PERMISSIONS, ROLE_PERMISSIONS, getEffectivePermissions, getRoleLevel } from '../config/permissions.js';
import { body, validationResult } from 'express-validator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

/**
 * Safe projection — fields returned in list/detail responses.
 * Never exposes password, OTP, or verification tokens.
 */
const SAFE_FIELDS =
  'name email role isActive isEmailVerified customPermissions lastLoginAt lastLoginIp lastLoginDevice createdAt updatedAt';

// ─── GET /api/users — List All Users ──────────────────────────────────────────

export const listUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) filter.role = role;

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter).select(SAFE_FIELDS).sort(sort).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/:id — Get Single User ─────────────────────────────────────

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(SAFE_FIELDS);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Attach effective permissions for display
    const effectivePermissions = getEffectivePermissions(user.role, user.customPermissions);

    return res.json({ success: true, data: { ...user.toObject(), effectivePermissions } });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/users — Create User (Admin/Owner only) ─────────────────────────

export const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, role = 'viewer' } = req.body;

    // Prevent creating a user with a higher role than the creator
    const creatorLevel = getRoleLevel(req.user.role);
    const targetLevel = getRoleLevel(role);
    if (targetLevel >= creatorLevel && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: `You cannot create a user with role "${role}" because it equals or exceeds your own role level.`,
      });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      // Admin-created accounts are pre-verified
      isEmailVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: await User.findById(user._id).select(SAFE_FIELDS),
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/:id — Update User ────────────────────────────────────────

export const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const targetUser = await User.findById(req.params.id).select(SAFE_FIELDS);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent modifying a user with equal or higher role (except owner)
    const editorLevel = getRoleLevel(req.user.role);
    const targetLevel = getRoleLevel(targetUser.role);

    if (req.user.role !== 'owner' && targetLevel >= editorLevel) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify a user with equal or higher authority than yourself.',
      });
    }

    // Prevent role escalation above editor's own level
    if (role) {
      const newRoleLevel = getRoleLevel(role);
      if (newRoleLevel >= editorLevel && req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: `You cannot assign the role "${role}" — it equals or exceeds your own role level.`,
        });
      }
    }

    // Prevent disabling the last owner
    if (isActive === false && targetUser.role === 'owner') {
      const ownerCount = await User.countDocuments({ role: 'owner', isActive: true });
      if (ownerCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last owner account.' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select(SAFE_FIELDS);

    // If user was deactivated, revoke all refresh tokens
    if (isActive === false) {
      await RefreshToken.updateMany({ user: req.params.id }, { $set: { isRevoked: true } });
    }

    return res.json({ success: true, message: 'User updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/:id — Soft Delete User ────────────────────────────────

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const targetUser = await User.findById(req.params.id).select('role isActive name email');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deleting owner (except by another owner)
    if (targetUser.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only an owner can delete an owner account.' });
    }

    // Soft delete — mark as inactive
    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    // Revoke all sessions
    await RefreshToken.updateMany({ user: req.params.id }, { $set: { isRevoked: true } });

    return res.json({ success: true, message: `User "${targetUser.name}" has been deactivated.` });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/users/:id/permissions — Update Custom Permissions ─────────────

export const updateUserPermissions = async (req, res, next) => {
  try {
    const { grant = [], revoke = [] } = req.body;

    const targetUser = await User.findById(req.params.id).select(SAFE_FIELDS);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only owner/admin can manage permissions
    // And cannot manage permissions for equal/higher role users (except owner)
    const editorLevel = getRoleLevel(req.user.role);
    const targetLevel = getRoleLevel(targetUser.role);
    if (req.user.role !== 'owner' && targetLevel >= editorLevel) {
      return res.status(403).json({
        success: false,
        message: 'You cannot manage permissions for a user with equal or higher authority.',
      });
    }

    // Validate all permission strings
    const allValidPerms = Object.values(PERMISSIONS);
    const invalidGrants = grant.filter((p) => !allValidPerms.includes(p));
    const invalidRevokes = revoke.filter((p) => !allValidPerms.includes(p));
    if (invalidGrants.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid permissions: ${invalidGrants.join(', ')}` });
    }
    if (invalidRevokes.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid permissions to revoke: ${invalidRevokes.join(', ')}` });
    }

    let currentCustom = targetUser.customPermissions || [];

    // Apply grants
    for (const perm of grant) {
      const denyKey = `deny:${perm}`;
      currentCustom = currentCustom.filter((p) => p !== denyKey); // Remove any existing deny
      if (!currentCustom.includes(perm)) currentCustom.push(perm);
    }

    // Apply revokes — add deny: prefix
    for (const perm of revoke) {
      currentCustom = currentCustom.filter((p) => p !== perm); // Remove any existing grant
      const denyKey = `deny:${perm}`;
      if (!currentCustom.includes(denyKey)) currentCustom.push(denyKey);
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { customPermissions: currentCustom },
      { new: true }
    ).select(SAFE_FIELDS);

    const effectivePermissions = getEffectivePermissions(updated.role, updated.customPermissions);

    return res.json({
      success: true,
      message: 'Permissions updated successfully.',
      data: { ...updated.toObject(), effectivePermissions },
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/:id/permissions — Reset to Role Defaults ───────────────

export const resetUserPermissions = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id).select(SAFE_FIELDS);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.findByIdAndUpdate(req.params.id, { customPermissions: [] });

    return res.json({
      success: true,
      message: 'Permissions reset to role defaults.',
      defaultPermissions: ROLE_PERMISSIONS[targetUser.role] || [],
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/:id/login-history — Login History ────────────────────────

export const getUserLoginHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Viewers cannot see other users' login history
    if (req.user.role === 'viewer' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [history, total] = await Promise.all([
      LoginHistory.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LoginHistory.countDocuments({ user: req.params.id }),
    ]);

    return res.json({
      success: true,
      data: history,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/:id/permissions — Get Effective Permissions ───────────────

export const getUserPermissions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('role customPermissions isActive');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const effectivePermissions = getEffectivePermissions(user.role, user.customPermissions);
    const roleDefaults = ROLE_PERMISSIONS[user.role] || [];

    return res.json({
      success: true,
      data: {
        role: user.role,
        roleDefaults,
        customPermissions: user.customPermissions,
        effectivePermissions,
        allAvailablePermissions: Object.values(PERMISSIONS),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/profile — Own Profile ────────────────────────────────────
// Preserved from original userController.js

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(SAFE_FIELDS);
    const effectivePermissions = getEffectivePermissions(user.role, user.customPermissions);
    return res.json({ success: true, user: { ...user.toObject(), effectivePermissions } });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/users/profile — Update Own Profile ───────────────────────────

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select(SAFE_FIELDS);

    return res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
};
