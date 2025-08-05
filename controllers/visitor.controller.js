import { VisitorService } from '../services/visitor.service.js';
import { validateVisitorStatus } from '../utils/validators.js';

const visitorService = new VisitorService();

export class VisitorController {
    async getAllVisitors(req, res) {
        try {
            const visitors = await visitorService.getAllVisitors(
                req.query,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async deleteVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const deletedVisitor = await visitorService.deleteVisitor(
                visitorId,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                message: 'Visitor and associated passes deleted successfully',
                data: {
                    visitor: deletedVisitor
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('permission') ? 403 
                           : error.message.includes('not found') ? 404 
                           : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getVisitorsByHostId(req, res) {
        try {
            const { host_id } = req.params;
            if (!host_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Host ID is required'
                });
            }

            const visitors = await visitorService.getVisitorsByHostId(host_id);

            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('permission') ? 403 
                           : error.message.includes('not found') ? 404 
                           : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async approveVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'APPROVED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async rejectVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'REJECTED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async expireVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'EXPIRED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getVisitorById(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.getVisitorById(
                visitorId,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(error.message.includes('permission') ? 403 : 404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async createVisitor(req, res) {
        try {
            // Use the authenticated user's ID as the host_id
            const visitorData = {
                name: req.body.name,
                phone_number: req.body.phone_number,
                email: req.body.email,
                purpose_of_visit: req.body.purpose_of_visit,
                host_id: req.user.user_id, // Get host_id from authenticated user
                expiry_time: req.body.expiry_time // Add expiry_time for pass creation
            };

            // Validate expiry_time if provided
            if (visitorData.expiry_time) {
                const expiryDate = new Date(visitorData.expiry_time);
                if (isNaN(expiryDate.getTime())) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Invalid expiry time format'
                    });
                }
                if (expiryDate <= new Date()) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Expiry time must be in the future'
                    });
                }
            }

            const result = await visitorService.createVisitor(visitorData);

            res.status(201).json({
                status: 'success',
                data: result // This will include both visitor and pass if created
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
