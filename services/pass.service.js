import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { transporter } from '../config/nodemailer.js';
import { uploadToS3, deleteFromS3 } from '../config/s3.js';

const prisma = new PrismaClient();

export class PassService {
    /**
     * Delete a pass and its associated QR code (Admin only)
     */
    async deletePass(passId, userId, userRole) {
        // Only admin can delete passes
        if (userRole !== 'ADMIN') {
            throw new Error('Only administrators can delete passes');
        }

        const pass = await prisma.pass.findUnique({
            where: { pass_id: parseInt(passId) },
            include: {
                visitor: true
            }
        });

        if (!pass) {
            throw new Error('Pass not found');
        }

        try {
            await prisma.$transaction(async (prisma) => {
                // Delete QR code from S3
                const fileName = `pass_${pass.pass_id}.png`;
                await deleteFromS3(fileName);

                // Delete the pass from database
                // await prisma.pass.delete({
                //     where: { pass_id: parseInt(passId) }
                // });

                // Create notification for the visitor's host
                await prisma.notification.create({
                    data: {
                        recipient_id: pass.visitor.host_id,
                        visitor_id: pass.visitor_id,
                        content: `Pass #${pass.pass_id} has been deleted by an administrator.`
                    }
                });
            });

            return { message: 'QR code deleted successfully' };
        } catch (error) {
            console.error('Error deleting pass:', error);
            throw new Error(`Failed to delete pass: ${error.message}`);
        }
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
    //     // Validate visitor ID
    //     if (!visitorId) {
    //         throw new Error('Visitor ID is required');
    //     }

    //     // Get visitor details and validate
    //     const visitor = await prisma.visitor.findUnique({
    //         where: { visitor_id: parseInt(visitorId) },
    //         include: {
    //             host: true,
    //             passes: {
    //                 where: {
    //                     AND: [
    //                         {
    //                             expiry_time: { gt: new Date() }  // Not expired
    //                         },
    //                         {
    //                             OR: [
    //                                 { approved_at: null },  // Pending approval
    //                                 { approved_at: { not: null } }  // Already approved
    //                             ]
    //                         }
    //                     ]
    //                 }
    //             }
    //         }
    //     });

    //     if (!visitor) {
    //         throw new Error('Visitor not found');
    //     }

    //     // Check for existing active or pending passes
    //     if (visitor.passes.length > 0) {
    //         throw new Error('Visitor already has an active or pending pass');
    //     }

    //     // Validate expiry time
    //     const expiryDate = new Date(expiryTime);
    //     if (isNaN(expiryDate.getTime())) {
    //         throw new Error('Invalid expiry time format');
    //     }
    //     if (expiryDate <= new Date()) {
    //         throw new Error('Expiry time must be in the future');
    //     }

    //     const passToken = crypto.randomBytes(32).toString('hex');

    //     try {
    //         return await prisma.$transaction(
    //             async (prisma) => {
    //             // Create the pass first to get the pass_id
    //             const pass = await prisma.pass.create({
    //                 data: {
    //                     visitor_id: parseInt(visitorId),
    //                     qr_code_data: passToken,      // Store verification token initially
    //                     expiry_time: new Date(expiryTime),
    //                 },
    //                 include: {
    //                     visitor: {
    //                         include: {
    //                             host: true
    //                         }
    //                     }
    //                 }
    //             });

    //             // Generate verification URL with pass_id
    //             const verificationUrl = `${process.env.BACKEND_URL}/api/guard/scan/${pass.pass_id}`;
                
    //             // Generate QR code with the verification URL
    //             const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    //                 errorCorrectionLevel: 'H',
    //                 margin: 2,
    //                 width: 400,
    //                 color: {
    //                     dark: '#000000',
    //                     light: '#ffffff'
    //                 }
    //             });

    //             // Save QR code image with pass_id in filename
    //             const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(';base64,').pop(), 'base64');
                
    //             // Upload QR code to S3
    //             const fileName = `pass_${pass.pass_id}.png`;
    //             const qrCodeImageUrl = await uploadToS3(qrCodeBuffer, fileName);

    //             // Update pass with the final QR code URL
    //             const updatedPass = await prisma.pass.update({
    //                 where: { pass_id: pass.pass_id },
    //                 data: {
    //                     qr_code_data: verificationUrl,  // Store complete verification URL
    //                     qr_code_url: qrCodeImageUrl,    // Store public URL for QR image
    //                 },
    //                 include: {
    //                     visitor: {
    //                         include: {
    //                             host: true
    //                         }
    //                     }
    //                 }
    //             });

    //             // Send email with QR code
    //             const mailOptions = {
    //                 from: process.env.EMAIL_USER,
    //                 to: updatedPass.visitor.email,
    //                 subject: 'Your Visitor Pass',
    //                 html: `
    //                     <h2>Welcome ${updatedPass.visitor.name}!</h2>
    //                     <p>Here is your visitor pass QR code for your visit.</p>
    //                     <p>Pass ID: ${updatedPass.pass_id}</p>
    //                     <p>Host: ${updatedPass.visitor.host.name}</p>
    //                     <p>Expiry Time: ${new Date(expiryTime).toLocaleString()}</p>
    //                     <p>Please note: This QR code will automatically expire after the specified expiry time.</p>
    //                     <p>Please ensure to arrive before the expiry time.</p>
    //                 `,
    //                 attachments: [{
    //                     filename: 'qr-code.png',
    //                     content: qrCodeBuffer,
    //                     encoding: 'base64'
    //                 }]
    //             };

    //             await transporter.sendMail(mailOptions);

    //             // Create notification for host
    //             await prisma.notification.create({
    //                 data: {
    //                     recipient_id: updatedPass.visitor.host_id,
    //                     visitor_id: updatedPass.visitor_id,
    //                     content: `Pass #${updatedPass.pass_id} created for visitor ${updatedPass.visitor.name}. View QR code here: ${qrCodeImageUrl}`
    //                 }
    //             });

    //             return updatedPass;
    //         },
    //         {
    //             timeout: 10000 // Increase timeout to 10 seconds to accommodate S3 upload
    //         }
    //     );
    //     } catch (error) {
    //         throw new Error(`Failed to create pass: ${error.message}`);
    //     }
    // }
}
