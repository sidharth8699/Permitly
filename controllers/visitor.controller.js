import { VisitorService } from '../services/visitor.service.js';

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

    async createVisitor(req, res) {
        try {
            const visitorData = {
                name: req.body.name,
                phone_number: req.body.phone_number,
                email: req.body.email,
                purpose_of_visit: req.body.purpose_of_visit,
                host_id: req.body.host_id
            };

            const visitor = await visitorService.createVisitor(visitorData);

            res.status(201).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
