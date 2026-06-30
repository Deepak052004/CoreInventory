import mongoose from 'mongoose';

/**
 * LoginHistory — Audit trail for every login/logout/failed attempt.
 * Used by admin dashboard and security monitoring.
 */
const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['login_success', 'login_failed', 'logout', 'account_locked', 'password_reset'],
      required: true,
    },
    ip: { type: String, default: 'unknown' },
    device: { type: String, default: 'unknown' }, // User-Agent string
    location: { type: String, default: null },     // Geo (future: from IP)
    failureReason: { type: String, default: null }, // e.g. 'wrong_password', 'not_verified'
  },
  {
    timestamps: true,
    // TTL index: auto-delete entries older than 90 days
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

// Compound index for querying by user + date
loginHistorySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('LoginHistory', loginHistorySchema);
