import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo('admin'));

/**
 * Admin User Management Routes
 */
router.get('/users', (req, res) => {
    // TODO: Get all users (Admin only)
    // Query params: role (enum: 'admin', 'host', 'guard'), page, limit, sort
    // Returns: users with related entity counts
});

router.get('/users/:userId', (req, res) => {
    // TODO: Get user by ID (Admin only)
    // Returns: user details + related entities summary
    // Includes: visitors, passes, notifications
});

router.put('/users/:userId', (req, res) => {
    // TODO: Update user (Admin only)
    // Optional fields: name, email, role, status
    // Auto-update: updated_at
    // Validates: role permissions, email uniqueness
});

router.delete('/users/:userId', (req, res) => {
    // TODO: Delete user (Admin only)
    // Validates: no pending visitors/passes
    // Side effect: reassign or archive related entities
});

export default router;
