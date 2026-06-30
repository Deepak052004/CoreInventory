import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';

/**
 * Generate a short-lived JWT access token (15 minutes by default).
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

/**
 * Generate a cryptographically secure refresh token.
 * Returns both the plaintext token (sent to client) and its SHA-256 hash
 * (stored in the database — never store plaintext).
 *
 * @returns {{ plainToken: string, tokenHash: string }}
 */
export const generateRefreshToken = () => {
  const plainToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
  return { plainToken, tokenHash };
};

/**
 * Hash a plaintext refresh token for database lookup.
 * Use this when verifying a client-submitted refresh token.
 *
 * @param {string} plainToken - Token received from client cookie/body
 * @returns {string} SHA-256 hash of the token
 */
export const hashRefreshToken = (plainToken) => {
  return crypto.createHash('sha256').update(plainToken).digest('hex');
};

/**
 * Generate an email verification token (URL-safe random hex string).
 * Returns plaintext (embedded in email link) and hash (stored in DB).
 *
 * @returns {{ plainToken: string, tokenHash: string }}
 */
export const generateEmailVerificationToken = () => {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
  return { plainToken, tokenHash };
};
