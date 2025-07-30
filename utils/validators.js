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
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phoneNumber);
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
    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
        return false;
    }

    // Additional validations
    const [localPart, domain] = email.split('@');

    // Check local part length (before @)
    if (localPart.length > 64) {
        return false;
    }

    // Check domain length (after @)
    if (domain.length > 255) {
        return false;
    }

    // Check for consecutive dots
    if (email.includes('..')) {
        return false;
    }

    // Check for common invalid patterns
    const invalidPatterns = [
        /[<>()[\]\\,;:\s@"]/,  // No special characters
        /^[.-]/,               // Can't start with dot or hyphen
        /[.-]$/,              // Can't end with dot or hyphen
        /^[0-9]/,             // Shouldn't start with number (recommended)
    ];

    return !invalidPatterns.some(pattern => pattern.test(email));
};
