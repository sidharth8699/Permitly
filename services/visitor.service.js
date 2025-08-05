import { PrismaClient } from '@prisma/client';
import { validateEmail, validatePhoneNumber } from '../utils/validators.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { uploadToS3 } from '../config/s3.js';
import { transporter } from '../config/nodemailer.js';

const prisma = new PrismaClient();

export class VisitorService {
    async getAllVisitors(queryParams, userId, userRole) {
        const { status, date_range, host_id, show_all } = queryParams;
        
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

            // If admin wants to see their own visitors OR if it's a regular host
            if ((!show_all && userRole === 'ADMIN') || userRole === 'HOST') {
                where.host_id = parseInt(userId);
            }
            // If admin with show_all=true and specific host_id provided, filter by that host
            else if (show_all && userRole === 'ADMIN' && host_id) {
                if (isNaN(parseInt(host_id))) {
                    throw new Error('Invalid host_id provided');
                }
                where.host_id = parseInt(host_id);
            }        // Get only visitor details
        const visitors = await prisma.visitor.findMany({
            where,
            select: {
                visitor_id: true,
                name: true,
                email: true,
                phone_number: true,
                purpose_of_visit: true,
                host_id: true,
                status: true,
                entry_time: true,
                exit_time: true,
                created_at: true,
                updated_at: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return visitors;
    }

    async updateVisitorStatus(visitorId, status) {
        // Validate status
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status. Must be one of: ' + validStatuses.join(', '));
        }

        // Get visitor with current details
        const visitor = await prisma.visitor.findUnique({
            where: { visitor_id: parseInt(visitorId) },
            include: {
                host: {
                    select: {
                        user_id: true,
                        email: true,
                        phone_number: true
                    }
                }
            }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        // Validate status transitions
        const currentStatus = visitor.status;
        const validTransitions = {
            'PENDING': ['APPROVED', 'REJECTED'],
            'APPROVED': ['EXPIRED']
        
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            throw new Error(`Cannot change status from ${currentStatus} to ${status}. Valid transitions are: ${validTransitions[currentStatus]?.join(', ')}`);
        }

        // Start a transaction
        return await prisma.$transaction(async (prisma) => {
            // Update visitor status
            const updatedVisitor = await prisma.visitor.update({
                where: { visitor_id: parseInt(visitorId) },
                data: {
                    status: status,
                    // Set entry time if status is being approved
                    ...(status === 'APPROVED' ? { entry_time: new Date() } : {}),
                    // Set exit time if status is being expired
                    ...(status === 'EXPIRED' ? { exit_time: new Date() } : {})
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

            // Create notification via email
            await prisma.notification.create({
                data: {
                    recipient: {
                        connect: { user_id: visitor.host.user_id }
                    },
                    visitor: {
                        connect: { visitor_id: visitor.visitor_id }
                    },
                    content: `Visitor ${visitor.name}'s status has been updated to ${status}`
                }
            });

            return updatedVisitor;
        });
    }

    async deleteVisitor(visitorId, userId, userRole) {
        // Get visitor with host and passes info
        const visitor = await prisma.visitor.findUnique({
            where: {
                visitor_id: parseInt(visitorId)
            },
            include: {
                host: true,
                passes: true
            }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        // Check permissions (admin, host, or the guard who created the visitor can delete)
        if (userRole !== 'ADMIN' && 
            visitor.host_id !== userId && 
            !(userRole === 'GUARD' && visitor.created_by_guard_id === userId)) {
            throw new Error('You do not have permission to delete this visitor');
        }

        // Use transaction to ensure all operations succeed or fail together
        return await prisma.$transaction(async (prisma) => {
            // Create notification for host first
            await prisma.notification.create({
                data: {
                    recipient_id: visitor.host_id,
                    content: `Visitor ${visitor.name} has been removed from the system.`
                }
            });

            // Delete associated passes first (due to foreign key constraints)
            await prisma.pass.deleteMany({
                where: {
                    visitor_id: parseInt(visitorId)
                }
            });

            // Delete the visitor last
            const deletedVisitor = await prisma.visitor.delete({
                where: {
                    visitor_id: parseInt(visitorId)
                }
            });

            return deletedVisitor;
        });
    }

    async getVisitorsByHostId(host_id) {
        // Simple check if host exists
        const host = await prisma.user.findUnique({
            where: { user_id: parseInt(host_id) }
        });

        if (!host) {
            throw new Error('Host not found');
        }

        // Get all visitors for this host
        const visitors = await prisma.visitor.findMany({
            where: {
                host_id: parseInt(host_id)
            },
            select: {
                visitor_id: true,
                name: true,
                email: true,
                phone_number: true,
                purpose_of_visit: true,
                status: true,
                entry_time: true,
                exit_time: true,
                created_at: true,
                updated_at: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return visitors;
    }

    async getVisitorById(visitorId, userId, userRole) {
        const visitor = await prisma.visitor.findUnique({
            where: {
                visitor_id: parseInt(visitorId)
            },
            include: {
                host: {
                    select: {
                        user_id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                        role: true
                    }
                },
                passes: {
                    select: {
                        pass_id: true,
                        created_at: true,
                        expiry_time: true,
                        approved_at: true,
                        approved_by: true,
                        qr_code_data: true,
                        approved_by_user: {
                            select: {
                                name: true,
                                role: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'desc'
                    }
                }
            }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        // Check if user has permission to view this visitor
        // Admin, host, or the guard who created the visitor can view details
        if (userRole !== 'ADMIN' && 
            visitor.host_id !== userId && 
            !(userRole === 'GUARD' && visitor.created_by_guard_id === userId)) {
            throw new Error('You do not have permission to view this visitor');
        }

        return visitor;
    }

    async createVisitor(visitorData) {
        const { name, phone_number, email, purpose_of_visit, host_id, expiry_time } = visitorData;
        
        // Validate expiry time if provided
       

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

        // Check for existing active visit by this visitor
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
            throw new Error('This visitor already has an active or pending visit. Cannot create multiple active visits.');
        }

        // Check if visitor has previous visits (for name consistency)
        const previousVisit = await prisma.visitor.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone_number: phone_number }
                ]
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // If name doesn't match previous visits, log it or notify
        if (previousVisit && previousVisit.name !== name) {
            console.log(`Warning: Visitor ${email} is using a different name. Previous: ${previousVisit.name}, Current: ${name}`);
        }

        // Check if host exists and has the correct role
        const host = await prisma.user.findUnique({
            where: { user_id: parseInt(host_id) }
        });

        if (!host) {
            throw new Error('Host not found');
        }
        // Check that only hosts, guards and admins can create visitor entries
        if (host.role !== 'HOST' && host.role !== 'ADMIN' && host.role !== 'GUARD') {
            throw new Error('Only hosts, guards and admins can create visitor entries');
        }

        // Use transaction to ensure both visitor and notification are created
        return await prisma.$transaction(async (prisma) => {
            // Create new visitor
            const visitor = await prisma.visitor.create({
                data: {
                    name,
                    phone_number,
                    email,
                    purpose_of_visit,
                    host_id: parseInt(host_id),
                    status: 'PENDING',
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

            console.log('Visitor created:', visitor);

            let pass = null;
            // Create pass if expiry time is provided
            if (expiry_time) {
                const passToken = crypto.randomBytes(32).toString('hex');
                pass = await prisma.pass.create({
                    data: {
                        visitor_id: visitor.visitor_id,
                        qr_code_data: passToken,
                        expiry_time: new Date(expiry_time),
                    }
                });

                // Generate QR code and upload to S3
                const verificationUrl = new URL(`/api/guard/scan/${pass.pass_id}`, process.env.BACKEND_URL).toString();
                const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
                    errorCorrectionLevel: 'H',
                    margin: 4,
                    width: 512,
                    quality: 1
                });

                const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(';base64,').pop(), 'base64');
                const fileName = `pass_${pass.pass_id}.png`;
                const qrCodeImageUrl = await uploadToS3(qrCodeBuffer, fileName);

                // Update pass with QR code URL
                pass = await prisma.pass.update({
                    where: { pass_id: pass.pass_id },
                    data: {
                        qr_code_data: verificationUrl,
                        qr_code_url: qrCodeImageUrl,
                    }
                });

                console.log('Pass created:', pass);

                // Send email with QR code
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: visitor.email,
                    subject: 'Your Visitor Pass',
                    html: `
                        <h2>Welcome ${visitor.name}!</h2>
                        <p>Here is your visitor pass QR code for your visit.</p>
                        <p>Pass ID: ${pass.pass_id}</p>
                        <p>Host: ${visitor.host.name}</p>
                        <p>Purpose: ${visitor.purpose_of_visit}</p>
                        <p>Expiry Time: ${new Date(expiry_time).toLocaleString()}</p>
                        <p><strong>How to use this QR code:</strong></p>
                        <ol>
                            <li>Show this QR code to the security guard at the entrance</li>
                            <li>The guard will scan it using their device</li>
                            <li>You can either show the QR code from your phone or bring a printed copy</li>
                        </ol>
                        <p>Direct link: <a href="${verificationUrl}">${verificationUrl}</a></p>
                        <p>Please note: This QR code will automatically expire after the specified expiry time.</p>
                        <p>Please ensure to arrive before the expiry time.</p>
                    `,
                    attachments: [{
                        filename: 'qr-code.png',
                        content: qrCodeBuffer,
                        encoding: 'base64'
                    }]
                };

                await transporter.sendMail(mailOptions);
                console.log('Email sent with QR code');
            }

            // Create notification for host
            const notificationContent = pass 
                ? `New visitor request from ${name} for purpose: ${purpose_of_visit}. Pass created with QR code.`
                : `New visitor request from ${name} for purpose: ${purpose_of_visit}`;

            const notification = await prisma.notification.create({
                data: {
                    recipient_id: parseInt(host_id),
                    visitor_id: visitor.visitor_id,
                    content: notificationContent
                }
            });

            console.log('Notification created:', notification);

            return {
                visitor,
                pass,
                message: pass ? 'Visitor and pass created successfully' : 'Visitor created successfully'
            };
        });

        return visitor;
    }
}
