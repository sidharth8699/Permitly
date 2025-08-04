import { PrismaClient } from '@prisma/client';
import AppError from '../middleware/error.middleware.js';
import { validateEmail } from '../utils/validators.js';

const prisma = new PrismaClient();

export class AdminService {
    /**
     * Get all users with filtering, pagination and related counts
     */
    async getAllUsers({ page = 1, limit = 10, sort = 'created_at:desc' }) {
        const skip = (page - 1) * limit;
        const [field, order] = sort.split(':');

        // Get users with counts of related entities
        const users = await prisma.user.findMany({
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                phone_number: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: {
                        visitors: true,           // Count of visitors hosted
                        passes: true,             // Count of passes
                        notifications: true       // Count of notifications
                    }
                }
            },
            orderBy: {
                [field]: order.toLowerCase()
            },
            skip,
            take: limit
        });

        // Get total count for pagination
        const total = await prisma.user.count();

        return {
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get user by ID with detailed related entities summary
     */
    async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { user_id: userId },
                select: {
                    user_id: true,
                    name: true,
                    email: true,
                    role: true,
                    phone_number: true,
                    created_at: true,
                    updated_at: true,
                    visitors: {
                        select: {
                            visitor_id: true,
                            name: true,
                            status: true,
                            created_at: true,
                            passes: {
                                select: {
                                    pass_id: true,
                                    created_at: true,
                                    approved_at: true,
                                    expiry_time: true
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' },
                        take: 5
                    },
                    passes: {
                        select: {
                            pass_id: true,
                            created_at: true,
                            approved_at: true,
                            expiry_time: true,
                            visitor: {
                                select: {
                                    name: true,
                                    host: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: { created_at: 'desc' },
                        take: 5
                    },
                    _count: {
                        select: {
                            visitors: true,
                            passes: true
                        }
                    }
                }
            });

            if (!user) {
                throw new AppError('User not found', 404);
            }

            return user;
        } catch (error) {
            throw new AppError(error.message, error.statusCode || 500);
        }
    }

    /**
     * Update user details with validation
     */
    async updateUser(userId, updateData) {
        const { email, role, status, ...otherData } = updateData;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { user_id: userId }
        });

        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        // Validate email format and uniqueness if email is being changed
        if (email && email !== existingUser.email) {
            // Validate email format
            if (!validateEmail(email)) {
                throw new AppError('Invalid email format', 400);
            }

            // Check if email is already taken by another user
            const emailTaken = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { user_id: userId }
                }
            });

            if (emailTaken) {
                throw new AppError('Email already exists', 400);
            }
        }

        // If changing role from host, check for pending items
        if (role && existingUser.role === 'HOST' && role !== 'HOST') {
            const hasPendingItems = await prisma.visitor.findFirst({
                where: {
                    host_id: userId,
                    status: 'PENDING'
                }
            });

            if (hasPendingItems) {
                throw new AppError('Cannot change role while user has pending visitors', 400);
            }
        }

        // Use transaction to update user and create notification
        return await prisma.$transaction(async (prisma) => {
            // Update user
            const updatedUser = await prisma.user.update({
                where: { user_id: userId },
                data: {
                    ...otherData,
                    ...(email && { email }),
                    ...(role && { role }),
                    ...(status && { status }),
                    updated_at: new Date()
                },
                include: {
                    _count: {
                        select: {
                            visitors: true,
                            passes: true
                        }
                    }
                }
            });

            // Create notification for the user
            await prisma.notification.create({
                data: {
                    recipient_id: userId,
                    content: `Your account details have been updated${role ? `. New role: ${role}` : ''}${status ? `. New status: ${status}` : ''}`
                }
            });

            return updatedUser;
        });
    }

    /**
     * Delete user with validation and cleanup
     */
    async deleteUser(userId) {
        // Check if user exists and get their current role
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            include: {
                visitors: {
                    where: { status: 'PENDING' }
                },
                passes: {
                    where: {
                        approved_at: null,
                        expiry_time: {
                            gt: new Date()
                        }
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check for pending items
        if (user.visitors.length > 0 || user.passes.length > 0) {
            throw new AppError('Cannot delete user with pending visitors or passes', 400);
        }

        // Use transaction to handle all cleanup
        return await prisma.$transaction(async (prisma) => {
            // Archive notifications
            await prisma.notification.updateMany({
                where: { recipient_id: userId },
                data: { status: 'archived' }
            });

            // Delete the user
            await prisma.user.delete({
                where: { user_id: userId }
            });

            return { message: 'User deleted successfully' };
        });
    }
}
