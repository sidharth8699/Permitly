import { PrismaClient } from '@prisma/client';
import { validateEmail, validatePhoneNumber } from '../utils/validators.js';

const prisma = new PrismaClient();

export class VisitorService {
    async getAllVisitors(queryParams, userId, userRole) {
        const { status, date_range, host_id } = queryParams;
        
        // Build filter conditions
        let where = {};
        
        // Filter by status if provided
        if (status) {
            where.status = status;
        }

        // Filter by date range if provided
        if (date_range) {
            const [startDate, endDate] = date_range.split(',').map(date => new Date(date));
            where.created_at = {
                gte: startDate,
                lte: endDate || new Date()
            };
        }

        // If not admin, only show visitors for the current host
        if (userRole !== 'admin') {
            where.host_id = userId;
        } 
        // If admin and specific host_id provided, filter by that host
        else if (host_id) {
            where.host_id = parseInt(host_id);
        }

        // Get visitors with their host information
        const visitors = await prisma.visitor.findMany({
            where,
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                },
                passes: {
                    select: {
                        status: true,
                        created_at: true,
                        expiry_time: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return visitors;
    }

    async createVisitor(visitorData) {
        const { name, phone_number, email, purpose_of_visit, host_id } = visitorData;

        // Validate required fields
        if (!name || !phone_number || !email || !purpose_of_visit || !host_id) {
            throw new Error('Missing required fields');
        }

        // Validate email and phone number format
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (!validatePhoneNumber(phone_number)) {
            throw new Error('Invalid phone number format');
        }

        // Check if host exists
        const host = await prisma.user.findUnique({
            where: { user_id: parseInt(host_id) }
        });

        if (!host) {
            throw new Error('Host not found');
        }

        // Create new visitor
        const visitor = await prisma.visitor.create({
            data: {
                name,
                phone_number,
                email,
                purpose_of_visit,
                host_id: parseInt(host_id),
                status: 'pending',
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            }
        });

        // Create notification for host
        await prisma.notification.create({
            data: {
                recipient_id: host.user_id,
                type: 'email',
                content: `New visitor request from ${name} for purpose: ${purpose_of_visit}`,
                status: 'sent'
            }
        });

        return visitor;
    }
}
