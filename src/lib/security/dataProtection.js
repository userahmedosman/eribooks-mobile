/**
 * Data protection utilities for EriBooks Mobile
 * Ported from web frontend — replaces localStorage/sessionStorage with expo-secure-store
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Sensitive field patterns that should never be logged or exposed
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credit/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /social/i,
  /paypal.*token/i,
  /paypal.*secret/i,
  /payment.*token/i,
  /payment.*secret/i,
  /payment.*id/i,
  /billing/i,
  /account/i,
  /pin/i,
  /otp/i,
  /verification/i,
];

// Specific sensitive field names
const SENSITIVE_FIELDS = new Set([
  'password',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'authToken',
  'apiKey',
  'secretKey',
  'privateKey',
  'creditCardNumber',
  'cardNumber',
  'cvv',
  'cvc',
  'expiryDate',
  'paypalToken',
  'paypalSecret',
  'payerEmail',
  'payerName',
  'transactionId',
  'paymentId',
  'subscriptionId',
  'customerId',
  'billingAddress',
]);

/**
 * Check if a field name indicates sensitive data
 */
export const isSensitiveField = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') return false;
  if (SENSITIVE_FIELDS.has(fieldName.toLowerCase())) return true;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName));
};

/**
 * Sanitize an object by removing or masking sensitive fields
 */
export const sanitizeData = (data, options = {}) => {
  const { mask = true, maskValue = '[REDACTED]', maxDepth = 10 } = options;

  const sanitize = (obj, depth = 0) => {
    if (depth > maxDepth) return '[MAX_DEPTH_EXCEEDED]';
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (isSensitiveField(key)) {
          if (mask) sanitized[key] = maskValue;
        } else {
          sanitized[key] = sanitize(value, depth + 1);
        }
      }
      return sanitized;
    }

    return obj;
  };

  return sanitize(data);
};

/**
 * Safe console logger that automatically sanitizes sensitive data
 */
export const safeLog = (level, message, data = null) => {
  if (__DEV__ === false) {
    // In production, only log errors and warnings
    if (level !== 'error' && level !== 'warn') return;
  }

  const sanitizedData = data ? sanitizeData(data) : null;

  if (console[level]) {
    if (sanitizedData) {
      console[level](`[SAFE_LOG] ${message}`, sanitizedData);
    } else {
      console[level](`[SAFE_LOG] ${message}`);
    }
  }
};

/**
 * Platform-aware secure styling storage
 * Uses expo-secure-store on native, falls back to localStorage on web
 */
export const secureStorage = {
  async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      safeLog('error', 'Failed to secure store data', { key: '[REDACTED]', error: error.message });
    }
  },

  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      safeLog('error', 'Failed to retrieve data from secure storage', { key: '[REDACTED]', error: error.message });
      return null;
    }
  },

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      safeLog('error', 'Failed to remove data from secure storage', { key: '[REDACTED]', error: error.message });
    }
  },

  async clear() {
    // SecureStore doesn't have a clear-all method; clear known keys
    const knownKeys = ['isLoggedIn', 'cachedUser', 'accessToken', 'refreshToken'];
    for (const key of knownKeys) {
      await this.removeItem(key);
    }
  },
};

/**
 * Input sanitization utilities
 */
export const inputSanitizer = {
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  },

  sanitizeEmail(email) {
    if (typeof email !== 'string') return email;
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.\-]/g, '');
  },

  sanitizeNumber(input) {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  },
};

/**
 * Request validation utilities
 */
export const requestValidator = {
  validatePurchaseRequest(data) {
    const errors = [];
    if (!data.customerId || typeof data.customerId !== 'number') errors.push('Invalid customer ID');
    if (!data.subscriptionPlanId || typeof data.subscriptionPlanId !== 'number') errors.push('Invalid subscription plan ID');
    if (!data.returnUrl || typeof data.returnUrl !== 'string') errors.push('Invalid return URL');
    if (!data.cancelUrl || typeof data.cancelUrl !== 'string') errors.push('Invalid cancel URL');
    return { isValid: errors.length === 0, errors };
  },

  validateCancellationRequest(data) {
    const errors = [];
    if (data.reason && typeof data.reason !== 'string') errors.push('Invalid cancellation reason');
    if (data.reason && data.reason.length > 500) errors.push('Cancellation reason too long');
    return { isValid: errors.length === 0, errors };
  },
};

export default {
  isSensitiveField,
  sanitizeData,
  safeLog,
  secureStorage,
  inputSanitizer,
  requestValidator,
};
