import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { userController } from '../controllers/user.controller.js';

const router = express.Router();

// Protect all user routes
router.use(protect);

/**
 * User Profile Routes
 */
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

/**
 * Recent Visitors Route (Host Only)
 */
router.get('/recent-visitors', userController.getRecentVisitors);

export default router;
