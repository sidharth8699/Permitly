import { PassService } from '../services/pass.service.js';

const passService = new PassService();

export class PassController {
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

    // async createPass(req, res) {
    //     try {
    //         const { expiry_time } = req.body;
    //         const visitor_id = req.params.visitorId; // Get visitor ID from URL params

    //         // Validate expiry time is provided
    //         if (!expiry_time) {
    //             return res.status(400).json({ 
    //                 error: 'Expiry time is required.' 
    //             });
    //         }

    //         // Validate expiry time is in the future
    //         if (new Date(expiry_time) <= new Date()) {
    //             return res.status(400).json({ 
    //                 error: 'Expiry time must be in the future' 
    //             });
    //         }

    //         const pass = await passService.createPass(visitor_id, expiry_time);
    //         res.status(201).json(pass);
    //     } catch (error) {
    //         console.error('Error creating pass:', error);
    //         res.status(500).json({ 
    //             error: 'Failed to create pass',
    //             details: error.message 
    //         });
    //     }
    // }
}
