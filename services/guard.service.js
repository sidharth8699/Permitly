import { PrismaClient } from '@prisma/client';
import { validateEmail, validatePhoneNumber } from '../utils/validators.js';

const prisma = new PrismaClient();

export class GuardService {
    /**
     * Get all approved visitors for a specific host
     */
    async getApprovedVisitorsByHostId(hostId) {
        // First verify that the host exists
        const host = await prisma.user.findUnique({
            where: { user_id: hostId }
        });

        if (!host) {
            throw new Error('Host not found');
        }

        // Get all approved visitors for this host
        const visitors = await prisma.visitor.findMany({
            where: {
                host_id: hostId,
                status: 'APPROVED'
            },
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
                        pass_id: true,
                        qr_code_data: true,
                        expiry_time: true
                    },
                    where: {
                        approved_at: { not: null }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return visitors;
    }
    /**
     * Process QR code scan and handle pass/visitor approval or expiration
     */
    async processPassScan(passId, guardId) {
        const now = new Date();

        // Get pass with visitor and guard details
        const pass = await prisma.pass.findUnique({
            where: { pass_id: parseInt(passId) },
            include: {
                visitor: {
                    include: {
                        host: true
                    }
                }
            }
        });

        // Get guard details
        const guard = await prisma.user.findUnique({
            where: { user_id: guardId },
            select: { name: true }
        });

        if (!pass) {
            throw new Error('Pass not found');
        }

        // Validate pass state
        if (pass.approved_at) {
            throw new Error('Pass already processed');
        }

        // Check if visitor is already approved
        if (pass.visitor.status === 'APPROVED') {
            throw new Error('Visitor is already approved');
        }

        // Check if pass is expired
        if (now > pass.expiry_time) {
            // Mark pass as processed and expire visitor
            await prisma.$transaction(async (prisma) => {
                await prisma.pass.update({
                    where: { pass_id: pass.pass_id },
                    data: {
                        approved_at: now,
                        approved_by: guardId
                    }
                });

                await prisma.visitor.update({
                    where: { visitor_id: pass.visitor_id },
                    data: {
                        status: 'EXPIRED',
                        exit_time: now // Set exit time to mark as fully processed
                    }
                });

                // Create notification about expired pass
                await prisma.notification.create({
                    data: {
                        recipient_id: pass.visitor.host.user_id,
                        visitor_id: pass.visitor_id,
                        content: `Pass for visitor ${pass.visitor.name} has expired. Checked by Guard ${guard.name} at ${now.toLocaleString()}`
                    }
                });
            });

            throw new Error('Pass has expired');
        }

        // If pass is valid, process pass and approve visitor
        const result = await prisma.$transaction(async (prisma) => {
            // Update pass with approval
            const updatedPass = await prisma.pass.update({
                where: { pass_id: pass.pass_id },
                data: {
                    approved_at: now,
                    approved_by: guardId
                }
            });

            // Update visitor with approved status and entry time
            const updatedVisitor = await prisma.visitor.update({
                where: { visitor_id: pass.visitor_id },
                data: {
                    status: 'APPROVED',
                    entry_time: now
                }
            });

                // Create notification for host
            await prisma.notification.create({
                data: {
                    recipient_id: pass.visitor.host.user_id,
                    visitor_id: pass.visitor_id,
                    content: `Visitor ${pass.visitor.name} has been approved by Guard ${guard.name}. Entry time: ${now.toLocaleString()}`
                }
            });            return { pass: updatedPass, visitor: updatedVisitor };
        });

        return result;
    }

    /**
     * Get all pending visitors created by the guard
     */
    async getPendingVisitors(guardId) {
        return await prisma.visitor.findMany({
            where: {
                created_by_guard_id: guardId,
                status: 'PENDING'
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                },
                passes: {
                    where: {
                        approved_at: null,
                        expiry_time: {
                            gt: new Date()
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }

    /**
     * Get today's pending visitors
     */
    async getTodaysPendingVisitors() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await prisma.visitor.findMany({
            where: {
                status: 'PENDING',
                created_at: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }

    /**
     * Get today's approved visitors
     */
    async getApprovedVisitors() {
        // Get today's start and end time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await prisma.visitor.findMany({
            where: {
                status: 'APPROVED',
                entry_time: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            },
            orderBy: {
                entry_time: 'desc'
            }
        });
    }

    /**
     * Get guard's daily statistics
     */
    async getDailyStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [approvedVisitors, pendingVisitors, expiredVisitors, rejectedVisitors] = await Promise.all([
            // Count all approved visitors today
            prisma.visitor.count({
                where: {
                    status: 'APPROVED',
                    entry_time: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            // Count all pending visitors
            prisma.visitor.count({
                where: {
                    status: 'PENDING',
                    created_at: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            // Count all expired visitors today
            prisma.visitor.count({
                where: {
                    status: 'EXPIRED',
                    exit_time: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }),
            // Count all rejected visitors today
            prisma.visitor.count({
                where: {
                    status: 'REJECTED',
                    created_at: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            })
        ]);

        return {
            approvedVisitors,
            pendingVisitors,
            expiredVisitors,
            rejectedVisitors,
            totalVisitors: approvedVisitors + pendingVisitors + expiredVisitors + rejectedVisitors,
            date: today.toISOString().split('T')[0]
        };
    }

    /**
     * Guard manually creates a visitor entry
     */
    async createVisitorEntry(visitorData, guardId) {
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

        // Check for existing active visit
        const existingActiveVisit = await prisma.visitor.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone_number: phone_number }
                ],
                AND: {
                    status: {
                        in: ['PENDING', 'APPROVED']
                    }
                }
            }
        });

        if (existingActiveVisit) {
            throw new Error('This visitor already has an active or pending visit');
        }

        // Use transaction to create visitor and notification
        return await prisma.$transaction(async (prisma) => {
            // Create visitor entry
            const visitor = await prisma.visitor.create({
                data: {
                    name,
                    phone_number,
                    email,
                    purpose_of_visit,
                    host_id: parseInt(host_id),
                    status: 'PENDING',
                    created_by_guard_id: guardId // Guard's user_id is already available
                },
                include: {
                    host: {
                        select: {
                            name: true,
                            email: true,
                            phone_number: true
                        }
                    },
                    created_by_guard: {
                        select: {
                            name: true
                        }
                    }
                }
            });

                // Create notification with guard information
                await prisma.notification.create({
                    data: {
                        recipient: {
                            connect: { user_id: host.user_id }
                        },
                        visitor: {
                            connect: { visitor_id: visitor.visitor_id }
                        },
                        content: `Guard ${visitor.created_by_guard.name} created visitor entry for ${name}. Purpose: ${purpose_of_visit}`
                    }
                });
                return visitor;
        });
    }
}
