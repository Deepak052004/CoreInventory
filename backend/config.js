import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Export configuration
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coreinventory',

  // JWT — short-lived access token
  jwtSecret: process.env.JWT_SECRET || 'fallback-access-secret-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '15m',

  // JWT — long-lived refresh token
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  refreshTokenExpireMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

  // Email
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@coreinventory.com',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Auth security
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  lockDurationMs: parseInt(process.env.LOCK_DURATION_MS || String(15 * 60 * 1000), 10), // 15 min

  // Email verification
  emailVerificationExpireMs: 24 * 60 * 60 * 1000, // 24 hours

  // OTP
  otpExpireMs: 5 * 60 * 1000, // 5 minutes
};
