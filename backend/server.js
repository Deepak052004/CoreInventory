/**
 * CoreInventory - Backend Server
 * Entry point for the REST API
 * M1: Added security middleware (helmet, rate-limiting, CORS, sanitization)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { errorHandler } from './middleware/errorHandler.js';
import { protect as requireAuth } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import adjustmentRoutes from './routes/adjustmentRoutes.js';
import stockLedgerRoutes from './routes/stockLedgerRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import poRoutes from './routes/poRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import salesOrderRoutes from './routes/salesOrderRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import lotRoutes from './routes/lotRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { auditLog } from './middleware/auditLog.js';

import { config } from './config.js';

dotenv.config();

const app = express();
const PORT = config.port;

// ─── Trust Proxy (needed for accurate IP behind reverse proxy / Nginx) ─────────
app.set('trust proxy', 1);

// ─── Security: HTTP Headers ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for dev
  contentSecurityPolicy: false, // Disable CSP to prevent upgrade-insecure-requests on localhost
  hsts: false, // Disable HSTS to prevent forcing HTTPS on localhost
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true, // Required for cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────

// Global limiter: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Auth limiter: 10 requests per 15 minutes per IP (stricter for auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

app.use(globalLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Security: NoSQL Injection Prevention ─────────────────────────────────────
app.use(mongoSanitize());

// ─── Security: HTTP Parameter Pollution ───────────────────────────────────────
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'status', 'category', 'warehouse'],
}));

// ─── Security: XSS Sanitization (request body) ────────────────────────────────
// Sanitizes string values in req.body using the 'xss' package
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitizeObject);
      if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
        );
      }
      return obj;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
});

// ─── Security: Audit Logging ───────────────────────────────────────────────────
app.use(auditLog);

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', requireAuth, adjustmentRoutes);
app.use('/api/stock-ledger', requireAuth, stockLedgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/suppliers', requireAuth, supplierRoutes);
app.use('/api/purchase-orders', requireAuth, poRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/sales-orders', requireAuth, salesOrderRoutes);
app.use('/api/returns', requireAuth, returnRoutes);
app.use('/api/lots', requireAuth, lotRoutes);
app.use('/api/ai', aiRoutes);

// ─── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    message: 'CoreInventory API',
    version: '2.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  })
);

// ─── Frontend Integration (Monolith Deployment) ────────────────────────────────
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ─── MongoDB + Server Start ────────────────────────────────────────────────────
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('[CoreInventory] MongoDB connected');
    app.listen(PORT, () => {
      console.log(`[CoreInventory] API v2.0 running at http://localhost:${PORT}`);
      console.log(`[CoreInventory] Environment: ${config.nodeEnv}`);
    });
  })
  .catch((err) => {
    console.error('[CoreInventory] MongoDB connection error:', err.message);
    process.exit(1);
  });
