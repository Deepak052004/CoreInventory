import express from 'express';
import * as returnController from '../controllers/returnController.js';
import { authorizePermission as requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', returnController.getAll);
router.get('/:id', returnController.getOne);
router.post('/', returnController.create);
router.put('/:id', returnController.update);
router.post('/:id/process', requirePermission('inventory:write'), returnController.processReturn);
router.patch('/:id/cancel', requirePermission('inventory:write'), returnController.cancel);

export default router;
