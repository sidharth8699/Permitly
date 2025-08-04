import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class PassService {
    /**
     * Create a new pass for a visitor
     */
    async createPass(visitorId, userId) {
        // Get visitor details
        const visitor = await prisma.visitor.findUnique({
            where: { visitor_id: parseInt(visitorId) },
            include: {
                host: true
            }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        // Check if visitor already has an active pass
        const existingPass = await prisma.pass.findFirst({
            where: {
                visitor_id: parseInt(visitorId),
                expiry_time: {
                    gt: new Date()
                },
                approved_at: null
            }
        });

        if (existingPass) {
            throw new Error('Visitor already has an active pass');
        }

        // Generate QR code data (unique string)
        const qrCodeData = crypto.randomBytes(32).toString('hex');

        // Set expiry time (24 hours from now)
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);

        // Create pass with transaction to ensure all operations succeed
        return await prisma.$transaction(async (prisma) => {
            // Create the pass
            const pass = await prisma.pass.create({
                data: {
                    visitor_id: parseInt(visitorId),
                    qr_code_data: qrCodeData,
                    expiry_time: expiryTime
                },
                include: {
                    visitor: {
                        include: {
                            host: true
                        }
                    }
                }
            });

            // Create notification for the host
            await prisma.notification.create({
                data: {
                    recipient: {
                        connect: {
                            user_id: visitor.host.user_id
                        }
                    },
                    visitor: {
                        connect: {
                            visitor_id: visitor.visitor_id
                        }
                    },
                    content: `New pass created for visitor ${visitor.name}. Valid until ${expiryTime.toLocaleString()}`
                }
            });

            return pass;
        });
    }

    
    async getAllPasses(queryParams, userId, userRole) {
        const { visitor_id, date_range } = queryParams;

        // Build base filter conditions
        let where = {};
        
        // If user is a host, only show passes for their visitors
        if (userRole === 'HOST') {
            where.visitor = {
                host_id: parseInt(userId)
            };
        }
        // Admin can see all passes by default
        
        // Filter by specific visitor if provided
        if (visitor_id) {
            where.visitor_id = parseInt(visitor_id);
        }

        // Filter by date range if provided
        if (date_range) {
            const [startDate, endDate] = date_range.split(',').map(date => new Date(date));
            where.created_at = {
                gte: startDate,
                lte: endDate || new Date()
            };
        }

        // Get passes with their visitor and approver information
        const passes = await prisma.pass.findMany({
            where,
            include: {
                visitor: {
                    include: {
                        host: {
                            select: {
                                name: true,
                                email: true,
                                phone_number: true
                            }
                        }
                    }
                },
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
        });

        return passes;
    }
    async getPassById(passId, userId, userRole) {
        // Find the pass with all related details
        const pass = await prisma.pass.findUnique({
            where: {
                pass_id: parseInt(passId)
            },
            include: {
                visitor: {
                    include: {
                        host: {
                            select: {
                                user_id: true,
                                name: true,
                                email: true,
                                phone_number: true,
                                role: true
                            }
                        }
                    }
                },
                approved_by_user: {
                    select: {
                        name: true,
                        role: true
                    }
                }
            }
        });

        if (!pass) {
            throw new Error('Pass not found');
        }

        // Check permissions - only admin or the visitor's host can view the pass
        if (userRole !== 'ADMIN' && pass.visitor.host.user_id !== userId) {
            throw new Error('You do not have permission to view this pass');
        }

        return pass;
    }

    // async createPass(visitorId, expiryTime) {
    //     // Generate a unique token for the pass
    //     const passToken = crypto.randomBytes(32).toString('hex');
        
    //     try {
    //         // Start a transaction
    //         return await prisma.$transaction(async (prisma) => {
    //             // Create the pass
    //             const pass = await prisma.pass.create({
    //                 data: {
    //                     visitor_id: parseInt(visitorId),
    //                     status: 'PENDING',
    //                     expiry_time: new Date(expiryTime),
    //                     qr_code_data: passToken, // Store just the token
    //                     created_at: new Date()
    //                 },
    //                 include: {
    //                     visitor: {
    //                         include: {
    //                             host: true
    //                         }
    //                     }
    //                 }
    //             });

    //             // Generate the verification URL that the QR code will contain
    //             const verificationUrl = `${process.env.BACKEND_URL}/passes/qr/${passToken}`;
                
    //             // Create QR code containing the verification URL
    //             const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    //                 errorCorrectionLevel: 'H', // High error correction for better scanning
    //                 margin: 2,
    //                 width: 400, // Larger size for better visibility
    //                 color: {
    //                     dark: '#000000',  // QR code color
    //                     light: '#ffffff'  // Background color
    //                 }
    //             });

    //             // Set up email transporter
    //             const transporter = nodemailer.createTransport({
    //                 host: process.env.SMTP_HOST,
    //                 port: process.env.SMTP_PORT,//////////////////////////////////////////////////
    //                 secure: true,
    //                 auth: {
    //                     user: process.env.SMTP_USER,
    //                     pass: process.env.SMTP_PASSWORD
    //                 }
    //             });

    //             // Create email content with QR code
    //             const mailOptions = {
    //                 from: process.env.SMTP_FROM,//////////////////////////////////////////////
    //                 to: pass.visitor.email,
    //                 subject: 'Your Visitor Pass',
    //                 html: `
    //                     <h2>Welcome ${pass.visitor.name}!</h2>
    //                     <p>Here is your visitor pass QR code for your visit.</p>
    //                     <p>Host: ${pass.visitor.host.name}</p>
    //                     <p>Expiry Time: ${new Date(expiryTime).toLocaleString()}</p>
    //                     <p>Please note: This QR code will automatically expire after the specified expiry time.</p>
    //                     <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 200px; height: 200px;"/>
    //                     <p>Please ensure to arrive before the expiry time.</p>
    //                 `,
    //                 attachments: [{
    //                     filename: 'qr-code.png',
    //                     content: qrCodeDataUrl.split(';base64,').pop(),
    //                     encoding: 'base64'
    //                 }]
    //             };

    //             // Send email
    //             await transporter.sendMail(mailOptions);

    //             // Create notification for the host
    //             await prisma.notification.create({
    //                 data: {
    //                     recipient_id: pass.visitor.host_id,
    //                     type: 'email',
    //                     content: `Pass created for visitor ${pass.visitor.name}. Shareable link: ${shareableLink}`,
    //                     status: 'sent'
    //                 }
    //             });

    //             // Return pass with shareable link
    //             return {
    //                 ...pass,
    //                 shareableLink
    //             };
    //         });
    //     } catch (error) {
    //         throw new Error(`Failed to create pass: ${error.message}`);
    //     }
    // }
}
