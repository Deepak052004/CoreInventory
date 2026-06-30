import { config } from '../config.js';

/**
 * Centralized error handling middleware.
 * Handles Mongoose validation errors, duplicate key errors, JWT errors,
 * and generic server errors. Returns consistent JSON error responses.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // ── Mongoose Duplicate Key ────────────────────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field];
    message = `Duplicate value: "${value}" already exists for ${field}.`;
  }

  // ── Mongoose CastError (invalid ObjectId) ─────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  // ── Log errors in development ──────────────────────────────────────────────
  if (config.nodeEnv === 'development') {
    console.error(`[Error] ${statusCode} ${message}`, err.stack);
  } else if (statusCode >= 500) {
    // Only log server errors in production (not expected 4xx errors)
    console.error(`[Error] ${statusCode} ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack traces in development
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
