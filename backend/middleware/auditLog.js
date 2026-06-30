import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/** Extract client IP from request (handles proxies) */
const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.headers['x-real-ip'] ||
  req.socket?.remoteAddress ||
  'unknown';

/** Extract user-agent string (truncated to 255 chars for storage) */
const getDevice = (req) => (req.headers['user-agent'] || 'unknown').substring(0, 255);

/**
 * Audit Log Middleware
 * Captures write operations (POST, PUT, PATCH, DELETE) and logs them to the database.
 * Does not block the request. Runs asynchronously after the response finishes.
 */
export const auditLog = (req, res, next) => {
  // Only log state-changing requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Hook into the response finish event to capture status and final state
  res.on('finish', () => {
    // Determine the resource from the URL (e.g., /api/users -> Users)
    const pathParts = req.baseUrl.split('/');
    let resource = pathParts[pathParts.length - 1];
    
    // Fallback if baseUrl doesn't give us what we need
    if (!resource || resource === 'api') {
      const originalPathParts = req.originalUrl.split('?')[0].split('/');
      resource = originalPathParts[2] || 'unknown'; // assuming /api/resource
    }
    
    resource = resource.charAt(0).toUpperCase() + resource.slice(1);

    // Determine the action based on the HTTP method
    let action = 'UNKNOWN';
    switch (req.method) {
      case 'POST':
        action = `CREATE_${resource.toUpperCase()}`;
        break;
      case 'PUT':
      case 'PATCH':
        action = `UPDATE_${resource.toUpperCase()}`;
        break;
      case 'DELETE':
        action = `DELETE_${resource.toUpperCase()}`;
        break;
    }

    // Try to extract a resource ID if present in the URL (e.g., /api/users/123)
    const resourceId = req.params?.id || null;

    const auditEntry = {
      user: req.user?._id || null, // null if unauthenticated (e.g., login/signup)
      action,
      resource,
      resourceId,
      details: {
        body: req.method !== 'DELETE' ? req.body : undefined, // Don't log full body for deletes
        query: req.query,
      },
      ip: getClientIp(req),
      device: getDevice(req),
      status: res.statusCode >= 400 ? 'failure' : 'success',
      errorMessage: res.statusCode >= 400 ? res.statusMessage : undefined,
    };

    // Strip sensitive fields from details.body
    if (auditEntry.details?.body) {
      const sanitizedBody = { ...auditEntry.details.body };
      ['password', 'newPassword', 'otp', 'token'].forEach(field => delete sanitizedBody[field]);
      auditEntry.details.body = sanitizedBody;
    }

    // Save to DB (fire and forget)
    // Only log if we have a user (we don't want to audit public routes heavily here unless needed,
    // though login failures are already tracked in LoginHistory)
    if (auditEntry.user) {
      AuditLog.create(auditEntry).catch((err) => {
        logger.error(`[Audit Middleware] Failed to save audit log: ${err.message}`);
      });
    }
    
    // Also log via Winston for file backup
    logger.info(`Audit: ${action} on ${resource} by ${auditEntry.user || 'system'} - Status: ${auditEntry.status}`, {
       action: auditEntry.action,
       resource: auditEntry.resource,
       userId: auditEntry.user,
       ip: auditEntry.ip,
       status: auditEntry.status
    });
  });

  next();
};
