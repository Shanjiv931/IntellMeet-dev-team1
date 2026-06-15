import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intellmeet-backend-5j5a.onrender.com/api';

// Self-healing runtime URL fix for misconfigured Vercel environment variables
if (API_BASE_URL.includes('intellmeet-backend.onrender.com') || API_BASE_URL.includes('intellmeet-api.onrender.com')) {
  API_BASE_URL = API_BASE_URL
    .replace('intellmeet-backend.onrender.com', 'intellmeet-backend-5j5a.onrender.com')
    .replace('intellmeet-api.onrender.com', 'intellmeet-backend-5j5a.onrender.com');
}


class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('intellmeet_access_token');
    this.refreshToken = localStorage.getItem('intellmeet_refresh_token');
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // Create custom Axios instance
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('intellmeet_access_token', accessToken);
    localStorage.setItem('intellmeet_refresh_token', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('intellmeet_access_token');
    localStorage.removeItem('intellmeet_refresh_token');
    localStorage.removeItem('intellmeet_user');
  }

  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  onRefreshed(token) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  setupInterceptors() {
    // Request Interceptor: Attach the current Access Token if present
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor: Catch errors and execute JWT token rotation logic
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Determine if unauthorized / token expired
        const isUnauthorized =
          error.response?.status === 401 ||
          (error.response?.status === 500 && error.response?.data?.message === 'jwt expired') ||
          (error.response?.data?.message && error.response.data.message.includes('expired'));

        // If unauthorized and we have a refresh token, try to rotate tokens
        if (isUnauthorized && this.refreshToken && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue this request until refresh is done
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((newAccessToken) => {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Call refresh token endpoint using a fresh axios instance to bypass interceptors
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: this.refreshToken,
            });

            if (response.data?.success && response.data?.data?.tokens) {
              const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data.tokens;
              
              this.setTokens(newAccess, newRefresh);
              this.isRefreshing = false;
              this.onRefreshed(newAccess);

              // Retry original request with new token
              originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
              return this.axiosInstance(originalRequest);
            } else {
              throw new Error('Refresh response format invalid');
            }
          } catch (refreshErr) {
            this.isRefreshing = false;
            this.clearTokens();
            // Stale storage state is now prevented. Force page refresh so App.jsx re-evaluates session
            window.location.reload();
            return Promise.reject(refreshErr);
          }
        }

        // If unauthorized and we DO NOT have a refresh token, sign out immediately
        if (isUnauthorized && !this.refreshToken) {
          this.clearTokens();
          window.location.reload();
        }

        return Promise.reject(error);
      }
    );
  }

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const headers = {
      ...options.headers,
    };

    const config = {
      url: endpoint,
      method: method,
      headers: headers,
    };

    if (options.body) {
      // Decode body if it's passed as a JSON string to keep compatibility with fetch options.body
      config.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    try {
      const response = await this.axiosInstance(config);
      return response.data;
    } catch (err) {
      // Extract the server's operation error message or default to Axios error message
      const serverMessage = err.response?.data?.message || err.message || 'Something went wrong';
      const parsedError = new Error(serverMessage);
      parsedError.status = err.response?.status;
      parsedError.response = err.response;
      console.error(`API request error on ${endpoint}:`, parsedError);
      throw parsedError;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
