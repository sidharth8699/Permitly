import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all guard routes and restrict to guard role
router.use(protect);
router.use(restrictTo('guard'));

/**
 * Manual Visitor Entry Routes
 */
router.post('/visitors', (req, res) => {
    // TODO: Guard manually creates a visitor entry
    // Required fields: name, phone_number, email, purpose_of_visit, host_id
    // Creates: visitor record + pass request for host approval
    // Auto-set: status='pending'
});

router.get('/visitors/pending', (req, res) => {
    // TODO: Get all pending visitor entries created by this guard
    // Returns: List of visitors with their pass status
    // Filter: status='pending'
});

/**
 * Pass Management Routes
 */
router.get('/passes/pending', (req, res) => {
    // TODO: Get all pending passes that need guard verification
    // Returns: List of approved passes waiting for guard check
    // Filter: status='approved' but no entry_time
});

/**
 * QR Code Scanning Routes
 */
router.post('/scan/:passId', (req, res) => {
    // TODO: Process QR code scan for visitor entry
    // Validates: pass is approved and not expired
    // Updates: entry_time or exit_time based on scan type
    // Returns: visitor and pass details
});

router.get('/scan/history', (req, res) => {
    // TODO: Get scan history for the guard
    // Returns: List of passes scanned by this guard
    // Includes: entry and exit times
});

/**
 * Statistics Routes
 */
router.get('/stats/today', (req, res) => {
    // TODO: Get today's statistics for the guard
    // Returns: count of entries, exits, pending approvals
    // Filter: Only today's data
});

export default router;
