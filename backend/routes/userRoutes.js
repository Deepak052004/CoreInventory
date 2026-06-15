import express from 'express';
import { protect } from '../middleware/auth.js';
import { getProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();
router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;
