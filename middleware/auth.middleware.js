import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import AppError from './error.middleware.js';
import prisma from '../database/database.service.js';

/**
 * Protect routes - Authentication middleware
 */
export const protect = async (req, res, next) => {
    try {
        // 1) Check if token exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        const token = authHeader.split(' ')[1];

        // 2) Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await prisma.User.findUnique({
            where: { user_id: decoded.userId }
        });

        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        // 4) Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        next(new AppError('Invalid token! Please log in again.', 401));
    }
};

/**
 * Restrict to certain roles
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
