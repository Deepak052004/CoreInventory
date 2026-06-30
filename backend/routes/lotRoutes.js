import express from 'express';
import * as lotController from '../controllers/lotController.js';
import { authorizePermission as requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('inventory:read'), lotController.getAll);
router.get('/:id', requirePermission('inventory:read'), lotController.getOne);

export default router;
