import { PassService } from '../services/pass.service.js';

const passService = new PassService();

export class PassController {
    /**
     * Delete a pass and its associated QR code (Admin only)
     */
    async deletePass(req, res) {
        try {
            const { passId } = req.params;
            const result = await passService.deletePass(passId, req.user.user_id, req.user.role);
            
            res.status(200).json({
                status: 'success',
                ...result
            });
        } catch (error) {
            console.error('Error deleting pass:', error);
            const statusCode = error.message.includes('Only administrators') ? 403 
                : error.message.includes('not found') ? 404 
                : 500;
            
            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }
    /**
     * Create a new pass for a visitor
     */
    // async createPass(req, res) {
    //     try {
    //         const { expiryTime } = req.body;
    //         const { visitorId } = req.params;

    //         // Validate required fields
    //         if (!expiryTime) {
    //             return res.status(400).json({
    //                 status: 'error',
    //                 message: 'Expiry time is required'
    //             });
    //         }

    //         if (!visitorId) {
    //             return res.status(400).json({
    //                 status: 'error',
    //                 message: 'Visitor ID is required'
    //             });
    //         }

    //         const pass = await passService.createPass(
    //             visitorId,
    //             expiryTime
    //         );

    //         res.status(201).json({
    //             status: 'success',
    //             data: {
    //                 pass,
    //                 message: 'Pass created successfully'
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error creating pass:', error);
            
    //         const statusCode = 
    //             error.message.includes('not found') ? 404 :
    //             error.message.includes('already has') ? 409 :
    //             error.message.includes('Invalid') || error.message.includes('must be') ? 400 :
    //             500;

    //         res.status(statusCode).json({
    //             status: 'error',
    //             message: error.message
    //         });
    //     }
    // }

    /**
     * Process a pass scan
     */
    // async processPassScan(req, res) {
    //     try {
    //         const result = await passService.processPassScan(
    //             req.params.passId,
    //             req.user.user_id
    //         );
    //         res.json(result);
    //     } catch (error) {
    //         res.status(400).json({ error: error.message });
    //     }
    // }

    /**
     * Get all passes with filtering
     */
    async getAllPasses(req, res) {
        try {
            const passes = await passService.getAllPasses(
                req.query,          // Query parameters (visitor_id, date_range, show_all)
                req.user.user_id,   // Current user's ID
                req.user.role       // Current user's role
            );
            
            res.json(passes);
        } catch (error) {
            console.error('Error fetching passes:', error);
            res.status(500).json({ 
                error: 'Failed to fetch passes',
                details: error.message 
            });
        }
    }
    async getPassById(req, res) {
        try {
            const { passId } = req.params;
            const pass = await passService.getPassById(
                passId,
                req.user.user_id,
                req.user.role
            );
            
            res.json(pass);
        } catch (error) {
            console.error('Error fetching pass:', error);
            if (error.message === 'Pass not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('permission')) {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to fetch pass details',
                    details: error.message 
                });
            }
        }
    }

}
