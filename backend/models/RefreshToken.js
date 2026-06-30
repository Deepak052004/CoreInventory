import mongoose from 'mongoose';

/**
 * RefreshToken — Stores hashed refresh tokens for secure rotation.
 * Never stores plaintext tokens. TTL index auto-expires documents.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false, // Never return in queries by default
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    ip: { type: String, default: 'unknown' },
    device: { type: String, default: 'unknown' },
    replacedByTokenHash: { type: String, default: null }, // For rotation chain tracking
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes expired tokens (cleanup handled by DB)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for fast lookup by user + revoked status
refreshTokenSchema.index({ user: 1, isRevoked: 1 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
