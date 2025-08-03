/**
 * Validates password strength requirements
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements
 */
/**
 * Validates role type
 * @param {string} role - The role to validate
 * @returns {boolean} - True if role is valid
 */
export const validateRole = (role) => {
    const validRoles = ['admin', 'host', 'guard'];
    return validRoles.includes(role);
};

/**
 * Validates phone number format
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if phone number is valid
 */
export const validatePhoneNumber = (phoneNumber) => {
    // Remove all spaces, hyphens, and plus sign to count actual digits
    const digitsOnly = phoneNumber.replace(/[\s\-+]/g, '');
    
    // Check if we have exactly 10 digits
    if (digitsOnly.length !== 10) {
        return false;
    }

    // Validate format: optional +, followed by digits, spaces, and hyphens
    const phoneRegex = /^\+?[\d\s-]+$/;
    return phoneRegex.test(phoneNumber);
};

export const validateVisitorStatus = (status) => {
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'];
    return validStatuses.includes(status);
};

export const validatePassword = (password) => {
    // Password must be at least 8 characters long
    if (password.length < 8) {
        return false;
    }

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return false;
    }

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return false;
    }

    // Must contain at least one number
    if (!/\d/.test(password)) {
        return false;
    }

    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
    }

    return true;
};

/**
 * Validates email format and common patterns
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid
 */
export const validateEmail = (email) => {
    // Simple email validation for format like: test@example.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
