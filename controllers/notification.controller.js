import { NotificationService } from '../services/notification.service.js';

const notificationService = new NotificationService();

export class NotificationController {
    /**
     * Get all notifications for the current user
     */
    async getUserNotifications(req, res) {
        try {
            // Get notifications for the current authenticated user
            const notifications = await notificationService.getUserNotifications(req.user.user_id);
            
            res.status(200).json({
                status: 'success',
                results: notifications.length,
                data: {
                    notifications
                }
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
