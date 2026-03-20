/**
 * EriBooks Mobile API Layer
 * Ported from web frontend — calls backend directly (no Next.js proxy)
 * Uses expo-secure-store for token management instead of HttpOnly cookies
 */
import { safeLog, sanitizeData, secureStorage, requestValidator } from './security/dataProtection';
import NetInfo from '@react-native-community/netinfo';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://artiest-uncompellable-larita.ngrok-free.dev';

// Token management for retry queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Get the stored access token
 */
const getAccessToken = async () => {
  return await secureStorage.getItem('accessToken');
};

/**
 * Request interceptor to add security headers and auth token
 */
const secureRequestInterceptor = async (url, options = {}) => {
  const secureOptions = { ...options };

  // Get stored access token
  const accessToken = await getAccessToken();
  if (accessToken) {
    console.log('[API] Using Access Token for:', url);
  } else {
    console.warn('[API] No Access Token for:', url);
  }
  if (accessToken) {
    safeLog('info', 'Using Access Token', { token: '[REDACTED]' });
  } else {
    safeLog('warn', 'No Access Token found for request', { url });
  }

  secureOptions.headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'ngrok-skip-browser-warning': 'true',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  // Sanitize request body if present
  if (secureOptions.body && typeof secureOptions.body === 'string') {
    try {
      const parsedBody = JSON.parse(secureOptions.body);
      const sanitizedBody = sanitizeData(parsedBody, { mask: false });
      secureOptions.body = JSON.stringify(sanitizedBody);
    } catch (error) {
      safeLog('warn', 'Failed to sanitize request body', { url, error: error.message });
    }
  }

  // Add request timestamp for replay attack prevention
  if (secureOptions.method && secureOptions.method !== 'GET') {
    secureOptions.headers['X-Request-Timestamp'] = Date.now().toString();
  }

  return secureOptions;
};

const customFetch = async (url, options = {}) => {
  // Check network connectivity
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  // Apply security interceptor (async — gets token from SecureStore)
  const secureOptions = await secureRequestInterceptor(url, options);

  const config = { ...secureOptions };

  safeLog('info', 'API Request', {
    url: url.replace(API_URL, ''),
    method: config.method || 'GET',
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized — attempt to refresh token
    if (response.status === 401 && !url.includes('/auth/refresh')) {
      const isLoggedIn = await secureStorage.getItem('isLoggedIn');

      if (!isLoggedIn) {
        safeLog('info', '401 - User not logged in, skipping refresh');
        return response;
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(async () => {
          // Re-apply interceptor to get new token
          const retryOptions = await secureRequestInterceptor(url, options);
          return fetch(url, retryOptions);
        });
      }

      isRefreshing = true;

      try {
        safeLog('info', 'Attempting token refresh');
        const refreshToken = await secureStorage.getItem('refreshToken');

        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'ngrok-skip-browser-warning': 'true',
            ...(refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}),
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          // Store new tokens (handle both top-level and .data nesting)
          const tokens = refreshData.data || refreshData;
          if (tokens.accessToken) {
            await secureStorage.setItem('accessToken', tokens.accessToken);
          }
          if (tokens.refreshToken) {
            await secureStorage.setItem('refreshToken', tokens.refreshToken);
          }

          safeLog('info', 'Token refresh successful');
          processQueue(null);

          // Retry the original request with new token
          const retryOptions = await secureRequestInterceptor(url, options);
          return fetch(url, retryOptions);
        } else {
          safeLog('warn', 'Token refresh failed');
          await secureStorage.removeItem('isLoggedIn');
          await secureStorage.removeItem('cachedUser');
          await secureStorage.removeItem('accessToken');
          await secureStorage.removeItem('refreshToken');
          processQueue(new Error('Failed to refresh token'));
          return response;
        }
      } catch (err) {
        safeLog('error', 'Token refresh error', { error: err.message });
        processQueue(err);
        return response;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let error;
    try {
      error = await response.text();
    } catch (e) {
      error = 'Network error occurred';
    }

    safeLog('warn', 'API Error Response', {
      status: response.status,
      statusText: response.statusText,
      url: response.url?.replace(API_URL, '') || 'unknown',
    });

    if (response.status === 429) throw new Error('Too many requests. Please wait a moment and try again.');
    if (response.status >= 500) throw new Error('Server error. Please try again later.');
    if (response.status === 404) throw new Error('The requested resource was not found.');

    try {
      const jsonError = JSON.parse(error);
      const sanitizedError = sanitizeData(jsonError);
      const errorMsg = sanitizedError.errorMessage || sanitizedError.message || sanitizedError.title || 'API Error';
      const details = sanitizedError.details ? ` (${sanitizedError.details})` : '';
      throw new Error(`${errorMsg}${details}`);
    } catch (e) {
      if (e.message !== 'API Error' && !e.message.includes('Too many') && !e.message.includes('Server error')) {
        throw new Error(e.message || error || response.statusText || 'An unexpected error occurred');
      }
      throw e;
    }
  }

  try {
    const responseData = await response.json();
    safeLog('info', 'API Response Success', {
      status: response.status,
      url: response.url?.replace(API_URL, '') || 'unknown',
    });
    return responseData;
  } catch (e) {
    return null;
  }
};

export const api = {
  auth: {
    getCurrentUser: () => customFetch(`${API_URL}/api/customers/me`).then(handleResponse),
    register: (data) => {
      const sanitizedData = sanitizeData(data, { mask: false });
      return customFetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
      }).then(handleResponse);
    },
    login: async (data) => {
      const sanitizedData = sanitizeData(data, { mask: false });
      const response = await customFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
      }).then(handleResponse);

      // Store tokens from response (handle both top-level and .data nesting)
      if (response) {
        const tokens = response.data || response;
        if (tokens.accessToken) await secureStorage.setItem('accessToken', tokens.accessToken);
        if (tokens.refreshToken) await secureStorage.setItem('refreshToken', tokens.refreshToken);
        await secureStorage.setItem('isLoggedIn', 'true');
      }

      return response;
    },
    logout: async () => {
      // Optimistically clear target device tokens before network request
      await secureStorage.clear();
      try {
        // Only return if it succeeds on time without awaiting it as blocking
        customFetch(`${API_URL}/api/auth/logout`, { method: 'POST' })
          .then(handleResponse)
          .catch(e => console.warn('[API] Background logout failed', e.message));
        return { success: true, message: 'Local state cleared' };
      } catch (error) {
        return { success: true, message: 'Local state cleared' };
      }
    },
    refreshToken: () =>
      customFetch(`${API_URL}/api/auth/refresh`, { method: 'POST' }).then(handleResponse),
    loginWithGoogle: (data) =>
      customFetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(handleResponse),
    updateProfile: (data) =>
      customFetch(`${API_URL}/api/customers/update`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(handleResponse),
    deleteAccount: () =>
      customFetch(`${API_URL}/api/customers`, { method: 'DELETE' }).then(handleResponse),
  },
  books: {
    getAll: () => customFetch(`${API_URL}/api/books`).then(handleResponse),
    getById: (id) => customFetch(`${API_URL}/api/books/${id}`).then(handleResponse),
  },
  products: {
    getAll: (options = {}) => {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pageSize) params.append('pageSize', options.pageSize);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortDirection) params.append('sortDirection', options.sortDirection);
      const queryString = params.toString();
      return customFetch(`${API_URL}/api/products/published${queryString ? `?${queryString}` : ''}`).then(handleResponse);
    },
    search: (options = {}) => {
      const params = new URLSearchParams();
      if (options.searchTerm) params.append('searchTerm', options.searchTerm);
      if (options.page) params.append('page', options.page);
      if (options.pageSize) params.append('pageSize', options.pageSize);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortDirection) params.append('sortDirection', options.sortDirection);
      const queryString = params.toString();
      return customFetch(`${API_URL}/api/products/search${queryString ? `?${queryString}` : ''}`).then(handleResponse);
    },
    getById: (id) =>
      customFetch(`${API_URL}/api/products/${id}?include=book,book.authors,book.reviews,rating`).then(handleResponse),
    checkAccess: (id) =>
      customFetch(`${API_URL}/api/products/${id}/access`).then(handleResponse),
    getContent: (id) =>
      customFetch(`${API_URL}/api/products/${id}/content`).then(handleResponse),
  },
  orders: {
    create: (data) =>
      customFetch(`${API_URL}/api/orders`, { method: 'POST', body: JSON.stringify(data) }).then(handleResponse),
    getById: (id) => customFetch(`${API_URL}/api/orders/${id}`).then(handleResponse),
    getMyOrders: () => customFetch(`${API_URL}/api/orders/my-orders`).then(handleResponse),
    getMyPurchases: () => customFetch(`${API_URL}/api/orders/my-purchases`).then(handleResponse),
  },
  subscriptions: {
    getPlans: () => customFetch(`${API_URL}/api/subscription-plans`).then(handleResponse),
    getPlan: (id) => customFetch(`${API_URL}/api/subscription-plans/${id}`).then(handleResponse),
    getUserSubscriptions: (customerId) =>
      customFetch(`${API_URL}/api/subscriptions/${customerId}`).then(handleResponse),
    purchase: (data) => {
      const validation = requestValidator.validatePurchaseRequest(data);
      if (!validation.isValid) throw new Error(`Invalid purchase request: ${validation.errors.join(', ')}`);
      return customFetch(`${API_URL}/api/subscriptions/purchase`, {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(handleResponse);
    },
    confirmPayment: (subscriptionId, data = {}) => {
      const idStr = String(subscriptionId).trim();
      const isPayPalId = idStr.startsWith('I-');
      const url = isPayPalId
        ? `${API_URL}/api/subscriptions/confirm-payment/${idStr}`
        : `${API_URL}/api/subscriptions/${idStr}/confirm-payment`;
      return customFetch(url, {
        method: 'POST',
        body: isPayPalId ? null : JSON.stringify(data),
      }).then(handleResponse);
    },
    cancel: (subscriptionId, reason) =>
      customFetch(`${API_URL}/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then(handleResponse),
  },
  reviews: {
    getPublished: () => customFetch(`${API_URL}/api/reviews/published`).then(handleResponse),
    create: (data) =>
      customFetch(`${API_URL}/api/reviews`, { method: 'POST', body: JSON.stringify(data) }).then(handleResponse),
  },
  authors: {
    getById: (id) => customFetch(`${API_URL}/api/authors/${id}`).then(handleResponse),
    getByName: (name) =>
      customFetch(`${API_URL}/api/authors/by-name/${encodeURIComponent(name)}`).then(handleResponse),
  },
  articles: {
    getAll: () => customFetch(`${API_URL}/api/articles`).then(handleResponse),
    getById: (id) => customFetch(`${API_URL}/api/articles/${id}`).then(handleResponse),
  },
};
