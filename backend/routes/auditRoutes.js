import express from 'express';
import { protect, authorizePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/permissions.js';
import { getAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

// Require auth and specific permission to view audit logs
router.use(protect);
router.use(authorizePermission(PERMISSIONS.AUDIT_READ));

router.get('/', getAuditLogs);

export default router;
