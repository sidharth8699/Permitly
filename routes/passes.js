import express from 'express';
const router = express.Router();

// Pass Routes
router.post('/', (req, res) => {
    // TODO: Generate new pass for visitor
    // Required fields: visitor_id, expiry_time
    // Auto-set: status='pending', qr_code_data, created_at
});

router.get('/', (req, res) => {
    // TODO: Get all passes
    // Query params: visitor_id, status, date_range
    // Returns: pass details with visitor and approver information
});

router.get('/:passId', (req, res) => {
    // TODO: Get pass details
    // Returns: all pass fields + visitor details + approver details
});

router.put('/:passId/status', (req, res) => {
    // TODO: Update pass status
    // Required: status (enum: 'pending', 'approved', 'expired')
    // If approved: set approved_at and approved_by
    // Side effect: create notification for visitor
});

router.put('/:passId/entry', (req, res) => {
    // TODO: Record entry time
    // Validates: pass is approved and not expired
    // Updates: entry_time
    // Side effect: notify host
});

router.put('/:passId/exit', (req, res) => {
    // TODO: Record exit time
    // Validates: pass has entry_time
    // Updates: exit_time
    // Side effect: notify host if needed
});

router.get('/qr/:qrCode', (req, res) => {
    // TODO: Validate QR code and get pass details
    // Returns: pass status, validity, and visitor details
    // Used by guards for quick verification
});

export default router;
