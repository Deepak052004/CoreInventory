import express from 'express';
import * as supplierController from '../controllers/supplierController.js';
import { protect, authorizePermission as authorize } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.getAll)
  .post(authorize(PERMISSIONS.SUPPLIERS_CREATE), supplierController.create);

router.route('/:id')
  .get(authorize(PERMISSIONS.SUPPLIERS_READ), supplierController.getOne)
  .put(authorize(PERMISSIONS.SUPPLIERS_UPDATE), supplierController.update)
  .delete(authorize(PERMISSIONS.SUPPLIERS_DELETE), supplierController.remove);

export default router;
