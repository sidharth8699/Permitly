import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
    /**
     * Get all notifications for the current user
     * @param {number} userId - The ID of the current user
     * @returns {Promise<Array>} List of notifications
     */
    async getUserNotifications(userId) {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    recipient_id: userId
                },
                include: {
                    recipient: {
                        select: {
                            name: true,
                            email: true,
                            role: true
                        }
                    },
                    visitor: {
                        select: {
                            name: true,
                            email: true,
                            status: true,
                            purpose_of_visit: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            return notifications;
        } catch (error) {
            throw new Error(`Failed to fetch notifications: ${error.message}`);
        }
    }
}
