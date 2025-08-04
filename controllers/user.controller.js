import userService from '../services/user.service.js';
import { validateEmail, validatePassword, validatePhoneNumber } from '../utils/validators.js';

export const userController = {
    /**
     * Get user profile with related counts
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const userProfile = await userService.getUserProfile(userId);

            res.status(200).json({
                success: true,
                data: userProfile
            });
        } catch (error) {
            console.error('Error getting user profile:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const updateData = req.body;

            // Validate phone number if provided
            if (updateData.phone_number) {
                if (!validatePhoneNumber(updateData.phone_number)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid phone number format'
                    });
                }
            }

            // Validate new email if provided
            if (updateData.email) {
                if (!validateEmail(updateData.email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid email format'
                    });
                }
            }

            // Validate new password if provided
            if (updateData.new_password) {
                if (!validatePassword(updateData.new_password)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                    });
                }
            }
            
            const updatedProfile = await userService.updateUserProfile(userId, updateData);

            res.status(200).json({
                success: true,
                data: updatedProfile
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },

    /**
     * Get recent visitors
     */
    async getRecentVisitors(req, res) {
        try {
            const userId = req.user.user_id;
            const recentVisitors = await userService.getRecentVisitors(userId);

            res.status(200).json({
                success: true,
                data: recentVisitors
            });
        } catch (error) {
            console.error('Error getting recent visitors:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
};
