import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
// import nodemailer from 'nodemailer';
// import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class PassService {
    async getAllPasses(queryParams, userId, userRole) {
        const { visitor_id, date_range, show_all } = queryParams; // Add this parameter for admins to toggle view show_all

        // Build base filter conditions
        let where = {};
        
        // Handle filtering based on role and query params

        // If admin wants to see their own passes OR if it's a regular host
        if ((!show_all && userRole === 'admin') || userRole === 'host') {
            where.visitor = {
                host_id: parseInt(userId) // Filter by current user's visitors
            };
        }
        // If admin wants to see all passes, where remains empty {}

        // Additional filters (apply to both admin and regular users)
        
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
        if (userRole !== 'admin' && pass.visitor.host.user_id !== userId) {
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
    //                     status: 'pending',
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
