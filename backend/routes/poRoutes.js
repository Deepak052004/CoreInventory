import express from 'express';
import * as poController from '../controllers/poController.js';
import { protect, authorizePermission as authorize } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(PERMISSIONS.PO_READ), poController.getAll)
  .post(authorize(PERMISSIONS.PO_CREATE), poController.create);

router.route('/:id')
  .get(authorize(PERMISSIONS.PO_READ), poController.getOne)
  .put(authorize(PERMISSIONS.PO_UPDATE), poController.update);

router.patch('/:id/approve', authorize(PERMISSIONS.PO_APPROVE), poController.approve);
router.patch('/:id/cancel', authorize(PERMISSIONS.PO_CANCEL), poController.cancel);

export default router;
