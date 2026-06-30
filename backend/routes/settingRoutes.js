import express from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../middleware/auth.js';
import * as settingController from '../controllers/settingController.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();
router.use(protect);

router.get('/', settingController.getSettings);
router.put('/', restrictTo('admin'), settingController.updateSettings);
router.post('/logo', restrictTo('admin'), upload.single('logo'), settingController.uploadLogo);

export default router;
