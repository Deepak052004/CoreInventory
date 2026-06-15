import express from 'express';
import { protect } from '../middleware/auth.js';
import { getAll, getOne, create, completeTransfer, remove } from '../controllers/transferController.js';
import { param, validationResult } from 'express-validator';

const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  next();
};

router.use(protect);

router.get('/', getAll);
router.get('/:id', [param('id').isMongoId()], validate, getOne);
router.post('/', create);
router.post('/:id/complete', [param('id').isMongoId()], validate, completeTransfer);
router.delete('/:id', [param('id').isMongoId()], validate, remove);

export default router;
