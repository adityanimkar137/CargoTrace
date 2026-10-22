/**
 * CargoTrace Centralized API Client
 * Single consistent communication layer between React frontend and Express backend.
 */

// Resolves base API URL from environment variable or defaults to current origin /api/v1
const API_BASE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api/v1'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, code = 'NETWORK_ERROR', details = null, requestId = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 15000,
      signal: externalSignal,
      ...customConfig
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Chain external abort signal if supplied
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }

    const defaultHeaders = {
      Accept: 'application/json'
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isFormData && body && typeof body === 'object') {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...defaultHeaders,
          ...headers
        },
        body: isFormData ? body : (body && typeof body === 'object' ? JSON.stringify(body) : body),
        signal: controller.signal,
        credentials: 'include',
        ...customConfig
      });

      clearTimeout(timeoutId);

      // Extract JSON response or fallback to text
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => null);
        data = text ? { raw: text } : null;
      }

      if (!response.ok) {
        const errorData = data?.error || {};
        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData.code || `HTTP_${response.status}`,
          errorData.details || null,
          errorData.requestId || response.headers.get('x-request-id')
        );
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out or was cancelled by user', 408, 'REQUEST_TIMEOUT');
      }

      if (err instanceof ApiError) {
        throw err;
      }

      throw new ApiError(
        err.message || 'Unable to communicate with the CargoTrace backend server',
        0,
        'NETWORK_FAILURE'
      );
    }
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  upload(endpoint, formData, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: formData });
  }

  // Phase 1 Health check
  async checkHealth() {
    const startTime = Date.now();
    try {
      const data = await this.get('/health');
      const latencyMs = Date.now() - startTime;
      return {
        reachable: true,
        latencyMs,
        data,
        error: null
      };
    } catch (err) {
      return {
        reachable: false,
        latencyMs: Date.now() - startTime,
        data: null,
        error: err
      };
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }
}

export const apiClient = new ApiClient();
