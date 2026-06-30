import express from 'express';
import * as salesOrderController from '../controllers/salesOrderController.js';
import { authorizePermission as requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', salesOrderController.getAll);
router.get('/:id', salesOrderController.getOne);
router.post('/', salesOrderController.create);
router.put('/:id', salesOrderController.update);
router.patch('/:id/approve', requirePermission('sales_orders:approve'), salesOrderController.approve);
router.patch('/:id/cancel', requirePermission('sales_orders:cancel'), salesOrderController.cancel);

export default router;
