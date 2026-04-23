import { PASSWORD_REQUIREMENTS, VALIDATION_ERRORS } from '../../constants/index.js';

/**
 * Check if password has minimum length
 * @param {string} password - Password to check
 * @returns {boolean}
 */
export const hasMinLength = (password) => {
    return password?.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH;
};

/**
 * Check if password has uppercase letter
 * @param {string} password - Password to check
 * @returns {boolean}
 */
export const hasUppercase = (password) => {
    return /[A-Z]/.test(password);
};

/**
 * Check if password has lowercase letter
 * @param {string} password - Password to check
 * @returns {boolean}
 */
export const hasLowercase = (password) => {
    return /[a-z]/.test(password);
};

/**
 * Check if password has number
 * @param {string} password - Password to check
 * @returns {boolean}
 */
export const hasNumber = (password) => {
    return /\d/.test(password);
};

/**
 * Check if password has special character
 * @param {string} password - Password to check
 * @returns {boolean}
 */
export const hasSpecialChar = (password) => {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
};

/**
 * Get password strength checks
 * Returns object with all checks and their status
 * @param {string} password - Password to check
 * @returns {object} - { minLength, uppercase, lowercase, number, special, isStrong }
 */
export const getPasswordChecks = (password) => {
    return {
        minLength: hasMinLength(password),
        uppercase: hasUppercase(password),
        lowercase: hasLowercase(password),
        number: hasNumber(password),
        special: hasSpecialChar(password),
        isStrong: isPasswordStrong(password),
    };
};

/**
 * Comprehensive password validation
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, error: string|null, checks: object }
 */
export const validatePassword = (password) => {
    if (!password) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_REQUIRED,
            checks: {},
        };
    }

    const checks = getPasswordChecks(password);

    if (!checks.minLength) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_TOO_SHORT,
            checks,
        };
    }

    if (PASSWORD_REQUIREMENTS.REQUIRES_UPPERCASE && !checks.uppercase) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_NO_UPPERCASE,
            checks,
        };
    }

    if (PASSWORD_REQUIREMENTS.REQUIRES_LOWERCASE && !checks.lowercase) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_NO_LOWERCASE,
            checks,
        };
    }

    if (PASSWORD_REQUIREMENTS.REQUIRES_NUMBER && !checks.number) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_NO_NUMBER,
            checks,
        };
    }

    if (PASSWORD_REQUIREMENTS.REQUIRES_SPECIAL && !checks.special) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_NO_SPECIAL,
            checks,
        };
    }

    return {
        isValid: true,
        error: null,
        checks,
    };
};

/**
 * Check if password meets all requirements
 * @param {string} password - Password to check
 * @returns {boolean} - True if password passes all requirements
 */
export const isPasswordStrong = (password) => {
    const validation = validatePassword(password);
    return validation.isValid;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            error: VALIDATION_ERRORS.PASSWORD_MISMATCH,
        };
    }

    return {
        isValid: true,
        error: null,
    };
};

/**
 * Get password strength level (0-4)
 * @param {string} password - Password to check
 * @returns {number} - Strength level: 0 = weak, 1 = fair, 2 = good, 3 = strong, 4 = very strong
 */
export const getPasswordStrength = (password) => {
    if (!password) return 0;

    const checks = getPasswordChecks(password);
    const fulfillmentCount = Object.values(checks)
        .filter((v) => v === true)
        .length - 1; // Exclude isStrong boolean

    return Math.min(fulfillmentCount, 4);
};

/**
 * Get password strength label
 * @param {string} password - Password to check
 * @returns {string} - Strength label
 */
export const getPasswordStrengthLabel = (password) => {
    const strength = getPasswordStrength(password);
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[strength] || 'Weak';
};
