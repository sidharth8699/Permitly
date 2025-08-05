import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { GuardController } from '../controllers/guard.controller.js';

const router = express.Router();
const guardController = new GuardController();

// Protect all guard routes and restrict to guard role
router.use(protect);
router.use(restrictTo('guard'));

/**
 * Manual Visitor Entry Routes
 */
// Guard creates a visitor entry with provided host_id
router.post('/visitors', guardController.createVisitorEntry);

router.get('/visitors/pending', guardController.getPendingVisitors);//only for created by guards

// Get today's pending visitors
router.get('/visitors/pending/today', guardController.getTodaysPendingVisitors);

// Get today's approved visitors
router.get('/visitors/approved/today', guardController.getApprovedVisitors);// idhar exit button also.

// Get approved visitors by host ID
router.get('/visitors/approved/host/:hostId', guardController.getApprovedVisitorsByHostId);

/**
 * QR Code Scanning Routes
 */
router.post('/scan/:passId', guardController.processPassScan);

// router.get('/scan/history', (req, res) => {
//     // TODO: Get scan history for the guard
//     // Returns: List of passes scanned by this guard
//     // Includes: entry and exit times
// });

/**
 * Statistics Routes
 */
router.get('/stats/today', guardController.getDailyStats);

export default router;
