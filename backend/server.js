/**
 * CoreInventory - Backend Server
 * Entry point for the REST API
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { errorHandler } from './middleware/errorHandler.js';
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

import { config } from './config.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/stock-ledger', stockLedgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'CoreInventory API' }));

// Error handling
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CoreInventory API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
