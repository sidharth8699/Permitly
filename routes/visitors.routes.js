import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { VisitorController } from '../controllers/visitor.controller.js';

const router = express.Router();
const visitorController = new VisitorController();

// Protect all visitor routes except creation
router.use(protect);
// Only hosts and admins can manage visitors
router.use('/:id', restrictTo('admin', 'host'));

// Visitor Routes
router.post('/', visitorController.createVisitor);

router.get('/', visitorController.getAllVisitors);

router.get('/:visitorId', (req, res) => {
    // TODO: Get visitor details
    // Returns: all visitor fields + host details + associated passes
});

router.put('/:visitorId/status', (req, res) => {
    // TODO: Update visitor status
    // Required: status (enum: 'pending', 'approved', 'rejected', 'expired')
    // Auto-update: updated_at
    // Side effect: create notification for visitor
});

router.get('/host/:hostId', (req, res) => {
    // TODO: Get all visitors for a specific host
    // Query params: status, date_range
    // Returns: filtered visitors with pass information
});

router.delete('/:visitorId', (req, res) => {
    // TODO: Delete visitor request
    // Side effect: cancel associated passes, notify relevant parties
});

export default router;
