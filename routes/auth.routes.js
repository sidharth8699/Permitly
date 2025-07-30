import express from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * Auth Routes
 */
router.post('/register', authController.signUp);
router.post('/login', authController.signIn);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.signOut);

export default router;