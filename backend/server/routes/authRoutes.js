import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Route: POST /api/auth/register
 * Explanation: Naye user ko register karta hai aur response me JWT token deta hai.
 * Access: Public (koi bhi access kar sakta hai)
 */
router.post('/register', registerUser);

/**
 * Route: POST /api/auth/login
 * Explanation: User credentials (email aur password) check karke login karwata hai aur JWT token deta hai.
 * Access: Public (koi bhi access kar sakta hai)
 */
router.post('/login', loginUser);

/**
 * Route: GET /api/auth/profile
 * Explanation: Currently logged-in user ki profile details return karta hai.
 * Access: Private (protect middleware JWT token verify karega)
 */
router.get('/profile', protect, getProfile);

/**
 * Route: GET /api/auth/me
 * Explanation: Alias for /profile endpoint (returns currently logged-in user info).
 * Access: Private (Protected route)
 */
router.get('/me', protect, getProfile);

export default router;
