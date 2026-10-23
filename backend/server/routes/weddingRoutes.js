import express from 'express';
import {
  createWeddingInfo,
  getMyWeddingPage,
  updateWeddingInfo,
  deleteWeddingInfo,
  getPublicWeddingPage,
  uploadWeddingPhoto,
  createRsvp,
  getWeddingRsvps,
} from '../controllers/weddingController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * Route: POST /api/wedding/create
 * Explanation: Logged-in user ke wedding details (dulha, dulhan, date, venue) ko database me create karta hai.
 * Access: Private (JWT token protect middleware se verify hoga)
 */
router.post('/create', protect, createWeddingInfo);

/**
 * Route: GET /api/wedding/my-page
 * Explanation: Logged-in user ka apna banaya hua wedding page aur AI generated HTML website fetch karta hai.
 * Access: Private (JWT token zaroori hai)
 */
router.get('/my-page', protect, getMyWeddingPage);

/**
 * Route: PUT /api/wedding/update
 * Explanation: Logged-in user ke existing wedding details ko edit/update karne ke liye.
 * Access: Private (Protected route)
 */
router.put('/update', protect, updateWeddingInfo);

/**
 * Route: DELETE /api/wedding/delete
 * Explanation: Logged-in user ke wedding page ko database se permanently delete karta hai.
 * Access: Private (Protected route)
 */
router.delete('/delete', protect, deleteWeddingInfo);

/**
 * Route: GET /api/wedding/public/:shareSlug
 * Explanation: Public link ke zariye guests ke liye wedding page fetch karta hai bina login ke.
 * Access: Public (Koi bhi guest bina login ke shareable link dekh sakta hai)
 */
router.get('/public/:shareSlug', getPublicWeddingPage);

/**
 * Route: POST /api/wedding/upload-photo
 * Explanation: Couple ki photo ko Multer se lekar Cloudinary pe upload karta hai aur URL save karta hai.
 * Access: Private (JWT verification + Multer single photo upload)
 */
router.post('/upload-photo', protect, upload.single('photo'), uploadWeddingPhoto);

/**
 * Route: POST /api/wedding/rsvp
 * Explanation: Public route jo guests ko RSVP submit karne deta hai bina kisi login ke.
 * Access: Public
 */
router.post('/rsvp', createRsvp);

/**
 * Route: GET /api/wedding/rsvps
 * Explanation: Logged-in wedding owner ke liye uski wedding ke saare RSVPs return karta hai.
 * Access: Private (JWT token protect middleware se verify hoga)
 */
router.get('/rsvps', protect, getWeddingRsvps);

export default router;
