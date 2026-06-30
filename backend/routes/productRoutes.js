import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { getAll, getOne, create, update, remove, importCSV } from '../controllers/productController.js';
import { body, param, validationResult } from 'express-validator';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  next();
};

router.use(protect);

router.post('/import', upload.single('file'), importCSV);

router.get('/', getAll);
router.get('/:id', [param('id').isMongoId()], validate, getOne);
router.post('/', [
  body('name').trim().notEmpty(),
  body('SKU').trim().notEmpty(),
  body('category').isMongoId(),
], validate, create);
router.put('/:id', [param('id').isMongoId()], validate, update);
router.delete('/:id', [param('id').isMongoId()], validate, remove);

export default router;
