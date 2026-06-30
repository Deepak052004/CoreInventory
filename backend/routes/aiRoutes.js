import express from 'express';
import { chatWithAi } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// The chat endpoint is protected, so only logged-in users can use it
// You could also add authorizePermission('ai:chat') if you wanted role-based access to the AI
router.post('/chat', protect, chatWithAi);

export default router;
