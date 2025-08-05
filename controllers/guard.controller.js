import { GuardService } from '../services/guard.service.js';

const guardService = new GuardService();

export class GuardController {
    /**
     * Process QR code scan for pass approval/expiration
     */
    async processPassScan(req, res) {
        try {
            const { passId } = req.params;
            const result = await guardService.processPassScan(passId, req.user.user_id);

            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 
                : error.message.includes('expired') ? 400 
                : error.message.includes('already processed') ? 400
                : error.message.includes('already approved') ? 400 
                : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get all pending visitors created by the guard
     */
    async getPendingVisitors(req, res) {
        try {
            const visitors = await guardService.getPendingVisitors(req.user.user_id);
            
            res.status(200).json({
                status: 'success',
                data: {
                    visitors
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get today's pending visitors
     */
    async getTodaysPendingVisitors(req, res) {
        try {
            const visitors = await guardService.getTodaysPendingVisitors();
            
            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get today's approved visitors
     */
    async getApprovedVisitors(req, res) {
        try {
            const visitors = await guardService.getApprovedVisitors();
            
            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get guard's daily statistics
     */
    async getDailyStats(req, res) {
        try {
            const stats = await guardService.getDailyStats();
            
            res.status(200).json({
                status: 'success',
                data: {
                    stats: {
                        approvedVisitors: stats.approvedVisitors,
                        pendingVisitors: stats.pendingVisitors,
                        expiredVisitors: stats.expiredVisitors,
                        rejectedVisitors: stats.rejectedVisitors,
                        totalVisitors: stats.totalVisitors,
                        date: stats.date
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Create a visitor entry manually by guard
     */
    async createVisitorEntry(req, res) {
        try {
            const visitorData = {
                name: req.body.name,
                phone_number: req.body.phone_number,
                email: req.body.email,
                purpose_of_visit: req.body.purpose_of_visit,
                host_id: req.body.host_id
            };

            const visitor = await guardService.createVisitorEntry(
                visitorData,
                req.user.user_id // Pass guard's ID
            );

            res.status(201).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('Invalid') || error.message.includes('Missing') 
                ? 400 
                : error.message.includes('not found') 
                    ? 404 
                    : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get approved visitors by host ID
     */
    async getApprovedVisitorsByHostId(req, res) {
        try {
            const { hostId } = req.params;
            const visitors = await guardService.getApprovedVisitorsByHostId(parseInt(hostId));
            
            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
