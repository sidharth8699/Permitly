import authService from '../services/auth.service.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

export const authController = {
    async signUp(req, res) {
        try {
            const userData = req.body;

            // Validate required fields
            if (!userData.name || !userData.email || !userData.password || !userData.role || !userData.phone_number) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Validate email format
            if (!validateEmail(userData.email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password strength
            if (!validatePassword(userData.password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                });
            }

            // Validate phone number format (basic validation)
            const phoneRegex = /^\+?[\d\s-]{10,}$/;  // Basic regex for phone numbers
            if (!phoneRegex.test(userData.phone_number)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number format'
                });
            }

            // Validate role
            if (!['admin', 'host', 'guard'].includes(userData.role)) { // in 3 ke alawa nhi rkh skte
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role'
                });
            }

            const result = await authService.signUp(userData);

            return res.status(201).json({
                success: true,
                data: result
            });

        } catch (error) {
            if (error.message === 'User already exists') {
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Registration error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async signIn(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Validate email format
            if (!validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            // Validate password format
            if (!validatePassword(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password format'
                });
            }

            const result = await authService.signIn(email, password);

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            if (authService.isTokenInvalidated(refreshToken)) {
                return res.status(401).json({
                    success: false,
                    message: 'Token has been invalidated'
                });
            }

            const tokens = await authService.refreshToken(refreshToken);

            return res.status(200).json({
                success: true,
                data: { tokens }
            });

        } catch (error) {
            if (error.message === 'Invalid refresh token' || error.message === 'User not found') {
                return res.status(401).json({
                    success: false,
                    message: error.message
                });
            }

            console.error('Token refresh error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async signOut(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            await authService.signOut(refreshToken);

            return res.status(200).json({
                success: true,
                message: 'Successfully signed out'
            });

        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
