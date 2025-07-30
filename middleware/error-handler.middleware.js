/**
 * Global Error Handler Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * Unhandled Rejection Handler
 */
export const unhandledRejection = (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
    process.exit(1);
};

/**
 * Uncaught Exception Handler
 */
export const uncaughtException = (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    process.exit(1);
};
