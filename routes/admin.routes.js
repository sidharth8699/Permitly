import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { AdminController } from '../controllers/admin.controller.js';

const router = express.Router();
const adminController = new AdminController();

// Protect all admin routes
router.use(protect);
router.use(restrictTo('admin'));

/**
 * Admin User Management Routes
 */
// Get all users with filtering and pagination
router.get('/users', adminController.getAllUsers);//only admin

// Get user details with related entities
router.get('/users/:userId', adminController.getUserById);      // all things of user come in one search.

// Update user details
router.put('/users/:userId', adminController.updateUser);

// Delete user and cleanup related entities
router.delete('/users/:userId', adminController.deleteUser);

export default router;
