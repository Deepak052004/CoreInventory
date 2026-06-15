import express from 'express';
import { protect } from '../middleware/auth.js';
import { getAll, create } from '../controllers/adjustmentController.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  next();
};

router.use(protect);

router.get('/', getAll);
router.post('/', [
  body('product').isMongoId(),
  body('warehouse').isMongoId(),
  body('countedQuantity').isNumeric(),
], validate, create);

export default router;
