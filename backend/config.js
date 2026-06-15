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
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coreinventory',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Debug logging
console.log('[Config] Environment variables loaded:');
console.log('  EMAIL_USER:', config.emailUser ? '***' : 'undefined');
console.log('  EMAIL_PASS:', config.emailPass ? '***' : 'undefined');
console.log('  PORT:', config.port);
