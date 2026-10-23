import express from 'express';
import {
  getAllUsers,
  getAllWeddingPages,
  deleteUser,
  deleteWeddingPage,
  getAnalytics,
  updateUserByAdmin,
  updateWeddingByAdmin,
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Saare admin routes par authentication (protect) aur authorization (isAdmin) ek sath apply kar diya
router.use(protect, isAdmin);

/**
 * Route: GET /api/admin/users
 * Explanation: Platform ke saare registered users ki list laata hai (passwords ke bina).
 * Access: Private (Sirf Admin)
 */
router.get('/users', getAllUsers);

/**
 * Route: DELETE /api/admin/users/:id
 * Explanation: Kisi specific user account aur uske wedding page ko database se delete karta hai.
 * Access: Private (Sirf Admin)
 */
router.delete('/users/:id', deleteUser);

/**
 * Route: GET /api/admin/weddings
 * Explanation: Platform ke saare wedding pages ki list user details ke sath laata hai.
 * Access: Private (Sirf Admin)
 */
router.get('/weddings', getAllWeddingPages);

/**
 * Route: DELETE /api/admin/weddings/:id
 * Explanation: Kisi bhi wedding page ko uski ID se delete karta hai.
 * Access: Private (Sirf Admin)
 */
router.delete('/weddings/:id', deleteWeddingPage);

/**
 * Route: GET /api/admin/analytics
 * Explanation: Admin dashboard ke liye counts (total users, total wedding pages, is hafte/mahine ke counts) calculate karke deta hai.
 * Access: Private (Sirf Admin)
 */
router.get('/analytics', getAnalytics);

/**
 * // admin kisi bhi user ka data update kar sakta hai is route se
 * Route: PUT /api/admin/users/:id
 * Access: Private (Sirf Admin)
 */
router.put('/users/:id', protect, isAdmin, updateUserByAdmin);

/**
 * // admin kisi bhi wedding page ka data update/edit kar sakta hai is route se
 * Route: PUT /api/admin/weddings/:id
 * Access: Private (Sirf Admin)
 */
router.put('/weddings/:id', protect, isAdmin, updateWeddingByAdmin);

export default router;
