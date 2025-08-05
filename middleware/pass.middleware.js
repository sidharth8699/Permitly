export const validatePassRequest = (req, res, next) => {
    const { visitorId } = req.params;
    const { expiryTime } = req.body;

    // Check if visitor ID is valid
    if (!visitorId || isNaN(parseInt(visitorId))) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid visitor ID. Must be a number.'
        });
    }

    // Check if expiry time is provided and valid
    if (!expiryTime) {
        return res.status(400).json({
            status: 'error',
            message: 'Expiry time is required'
        });
    }

    // Validate expiry time format and ensure it's in the future
    const expiryDate = new Date(expiryTime);
    if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid expiry time format. Must be a valid date string.'
        });
    }

    if (expiryDate <= new Date()) {
        return res.status(400).json({
            status: 'error',
            message: 'Expiry time must be in the future'
        });
    }

    next();
};
