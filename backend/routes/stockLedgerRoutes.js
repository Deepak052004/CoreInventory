import express from 'express';
import { protect } from '../middleware/auth.js';
import { getAll } from '../controllers/stockLedgerController.js';

const router = express.Router();
router.use(protect);
router.get('/', getAll);

export default router;
