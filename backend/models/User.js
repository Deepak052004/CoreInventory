import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ─── Core Identity ────────────────────────────────────────────────────────
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },

    // ─── Role ─────────────────────────────────────────────────────────────────
    // 5-tier RBAC introduced in M2. 'user' kept for backward compatibility.
    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'warehouse_staff', 'viewer', 'user'],
      default: 'viewer',
    },
    isActive: { type: Boolean, default: true, index: true },

    // ─── Custom Permission Overrides ───────────────────────────────────────────
    // Augments or restricts the default role permissions per user.
    // Grant: 'products:create'   →  adds this permission on top of role defaults
    // Deny:  'deny:products:delete' →  removes this permission from role defaults
    customPermissions: { type: [String], default: [] },

    // ─── Email Verification ───────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },

    // ─── Password Reset OTP ───────────────────────────────────────────────────
    otpCode: { type: String, default: null, select: false },
    otpExpires: { type: Date, default: null, select: false },
    otpVerified: { type: Boolean, default: false, select: false },

    // ─── Account Lock (brute-force protection) ────────────────────────────────
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // ─── Login Audit ──────────────────────────────────────────────────────────
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    lastLoginDevice: { type: String, default: null },
  },
  { timestamps: true }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

/** Returns true if the account is currently locked */
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Hash password only when the password field is modified */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/** Compare a plain-text candidate password against the stored hash */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** Compare a plain OTP against the stored hashed OTP */
userSchema.methods.compareOtp = async function (plainOtp) {
  if (!this.otpCode) return false;
  return bcrypt.compare(plainOtp, this.otpCode);
};

/** Clear all OTP fields after successful reset or expiry */
userSchema.methods.clearOtp = function () {
  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.otpVerified = false;
};

/** Increment failed login counter; lock account when threshold is reached */
userSchema.methods.incrementLoginAttempts = async function (maxAttempts, lockDurationMs) {
  // If previous lock has expired, reset counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.constructor.findByIdAndUpdate(this._id, {
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account when the threshold is reached
  if (this.loginAttempts + 1 >= maxAttempts) {
    updates.$set = { lockUntil: new Date(Date.now() + lockDurationMs) };
  }

  await this.constructor.findByIdAndUpdate(this._id, updates);
};

/** Reset login attempts after a successful login */
userSchema.methods.resetLoginAttempts = function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
};

export default mongoose.model('User', userSchema);
