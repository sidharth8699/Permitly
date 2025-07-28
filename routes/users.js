import express from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * Auth Routes
 */
router.post('/register', authController.signUp);
router.post('/login', authController.signIn);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.signOut);

/**
 * User Profile Routes
 */
router.get('/profile', (req, res) => {
    // TODO: Get logged in user's profile
    // Returns: user details + counts of related entities
    // Includes: visitors_count, pending_approvals etc.
});

router.put('/profile', (req, res) => {
    // TODO: Update logged in user's profile
    // Optional fields: name, email, current_password, new_password
    // Auto-update: updated_at, password_hash if password changed
    // Validates: current_password if changing password/email
});

/**
 * Admin Routes
 */
router.get('/', (req, res) => {
    // TODO: Get all users (Admin only)
    // Query params: role (enum: 'admin', 'host', 'guard'), page, limit, sort
    // Returns: users with related entity counts
});

router.get('/:userId', (req, res) => {
    // TODO: Get user by ID (Admin only)
    // Returns: user details + related entities summary
    // Includes: visitors, passes, notifications
});

router.put('/:userId', (req, res) => {
    // TODO: Update user (Admin only)
    // Optional fields: name, email, role, status
    // Auto-update: updated_at
    // Validates: role permissions, email uniqueness
});

router.delete('/:userId', (req, res) => {
    // TODO: Delete user (Admin only)
    // Validates: no pending visitors/passes
    // Side effect: reassign or archive related entities
});

/**
 * Host-specific Routes
 */
router.get('/hosts', (req, res) => {
    // TODO: Get all hosts (for visitor to select host)
    // Returns: active hosts with basic info
    // Filters: only users with role='host'
});

router.get('/hosts/:hostId/visitors', (req, res) => {
    // TODO: Get all visitors for a specific host
    // Query params: status, date_range, page, limit
    // Returns: visitors with their pass status
    // Validates: requestor has access to host's data
});

export default router;
