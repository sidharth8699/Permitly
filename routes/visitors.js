import express from 'express';
const router = express.Router();

// Visitor Routes
router.post('/', (req, res) => {
    // TODO: Create new visitor request
    // Required fields: name, phone_number, email, purpose_of_visit, host_id
    // Auto-set: status='pending', created_at, updated_at
});

router.get('/', (req, res) => {
    // TODO: Get all visitors (filtered by host_id if not admin)
    // Query params: status, date_range, host_id
    // Returns: visitor details with host information
});

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
