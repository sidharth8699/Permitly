import { AdminService } from '../services/admin.service.js';

const adminService = new AdminService();

export class AdminController {
    /**
     * Get all users with filtering and pagination
     */
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10, sort = 'created_at:desc' } = req.query;
            const users = await adminService.getAllUsers({ 
                page: parseInt(page), 
                limit: parseInt(limit), 
                sort 
            });
            
            res.status(200).json({
                status: 'success',
                ...users
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(error.statusCode || 500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Get user by ID with detailed related entities
     */
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await adminService.getUserById(parseInt(userId));
            
            res.status(200).json({
                status: 'success',
                data: user
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(error.statusCode || 500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Update user details
     */
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            
            const updatedUser = await adminService.updateUser(parseInt(userId), updateData);
            
            res.status(200).json({
                status: 'success',
                data: updatedUser
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(error.statusCode || 500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    /**
     * Delete user and cleanup related entities
     */
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const result = await adminService.deleteUser(parseInt(userId));
            
            res.status(200).json({
                status: 'success',
                ...result
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(error.statusCode || 500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
