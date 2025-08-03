export const validatePassRequest = (req, res, next) => {
    const { expiry_time } = req.body;
    const { visitorId } = req.params;

    // Check if visitor ID is valid
    if (!visitorId || isNaN(parseInt(visitorId))) {
        return res.status(400).json({
            error: 'Invalid visitor ID'
        });
    }

    // Check expiry time is provided
    if (!expiry_time) {
        return res.status(400).json({
            error: 'Expiry time is required'
        });
    }

    // Validate expiry time is in the future
    if (new Date(expiry_time) <= new Date()) {
        return res.status(400).json({
            error: 'Expiry time must be in the future'
        });
    }

    next();
};
