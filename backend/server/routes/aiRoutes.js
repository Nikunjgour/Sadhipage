import express from 'express';
import { generateWeddingPage } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Route: POST /api/ai/generate
 * Explanation: Gemini AI (gemini-2.5-flash) ko call karke user ke liye Tailwind styled HTML wedding website generate karta hai.
 * Access: Private (JWT token protect middleware se verify hoga)
 */
router.post('/generate', protect, generateWeddingPage);

export default router;
