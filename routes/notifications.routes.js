import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { NotificationController } from '../controllers/notification.controller.js';

const router = express.Router();
const notificationController = new NotificationController();

// Protect notification routes - require authentication
router.use(protect);

// Get all notifications for current authenticated user
router.get('/', notificationController.getUserNotifications);//not doing in mvp. need limit to 100 notifications, sorted by created_at DESC

// router.get('/unread', (req, res) => {
//     // TODO: Get all unread notifications for current user
//     // Returns: notifications where status='sent'
//     // Sorted by: created_at DESC
// });

// router.get('/:notificationId', (req, res) => {
//     // TODO: Get notification details
//     // Returns: all notification fields + recipient details
//     // Validates: user has access to this notification
// });

// router.put('/:notificationId/read', (req, res) => {
//     // TODO: Mark notification as read
//     // Updates: status='read'
//     // Validates: user owns the notification
// });

// router.delete('/:notificationId', (req, res) => {
//     // TODO: Delete notification
//     // Soft delete recommended for audit trail
// });


export default router;
