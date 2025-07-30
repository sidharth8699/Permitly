import express from 'express';
import { PORT } from './config/env.js';
import userRoutes from './routes/users.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import visitorRoutes from './routes/visitors.routes.js';
import passRoutes from './routes/passes.routes.js';
import guardRoutes from './routes/guard.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import { globalErrorHandler, unhandledRejection, uncaughtException } from './middleware/error-handler.middleware.js';
import AppError from './middleware/error.middleware.js';

// Handle uncaught exceptions
process.on('uncaughtException', uncaughtException);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Welcome route
app.get('/', (_req, res) => {
  res.send('Welcome to Permitly Backend!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/notifications', notificationRoutes);


// Handle 404 errors
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', unhandledRejection);

import { connectToDatabase } from './database/database.service.js';

const startServer = async () => {
    try {
        // First check if port is in use
        const isPortAvailable = await new Promise((resolve) => {
            const testServer = express()
                .listen(PORT)
                .on('listening', () => {
                    testServer.close(() => resolve(true));
                })
                .on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        resolve(false);
                    }
                });
        });

        if (!isPortAvailable) {
            console.error(`❌ Port ${PORT} is already in use. Try these solutions:`);
            console.log('1. Kill the process using the port:');
            console.log(`   > taskkill /F /PID $(netstat -ano | findstr :${PORT})`);
            console.log('2. Or change the port in .env file');
            process.exit(1);
        }

        // Connect to database
        await connectToDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

export default app;
// This is the main entry point for the Permitly backend application.
//knknlk
