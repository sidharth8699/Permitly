import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } from '../config/env.js';

const prisma = new PrismaClient();

class AuthService { // we create an object from this later as you see in last export new authservice
    constructor() {
        this.invalidatedTokens = new Set(); // keep track of logout tokens across function calls inside the same instance
    }

    /**
     * Password related methods
     */
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    /**
     * Token related methods
     */
    generateTokens(userId, role) {
        const accessToken = jwt.sign(
            { userId, role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN }
        );

        return { accessToken, refreshToken };
    }

    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * User related methods
     */
    async findUserByEmail(email) {
        return prisma.User.findUnique({ where: { email } });
    }

    async findUserById(userId) {
        return prisma.User.findUnique({ where: { user_id: userId } });
    }

    formatUserResponse(user) {
        return {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone_number: user.phone_number
        };
    }

    /**
     * Authentication methods
     */
    async signUp(userData) {
        const existingUser = await this.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await this.hashPassword(userData.password);
        
        const user = await prisma.User.create({
            data: {
                name: userData.name,
                email: userData.email,
                password_hash: hashedPassword,
                role: userData.role,
                phone_number: userData.phone_number
            }
        });

        const tokens = this.generateTokens(user.user_id, user.role);
        return {
            user: this.formatUserResponse(user),
            tokens
        };
    }

    async signIn(email, password) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await this.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const tokens = this.generateTokens(user.user_id, user.role);
        return {
            user: this.formatUserResponse(user),
            tokens
        };
    }

    async refreshToken(refreshToken) {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }

        const user = await this.findUserById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        return this.generateTokens(user.user_id, user.role);
    }

    async signOut(refreshToken) {
        this.invalidatedTokens.add(refreshToken);
    }

    isTokenInvalidated(token) {
        return this.invalidatedTokens.has(token);
    }
}

export default new AuthService();
