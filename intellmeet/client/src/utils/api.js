const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intellmeet-backend-5j5a.onrender.com/api';

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('intellmeet_access_token');
    this.refreshToken = localStorage.getItem('intellmeet_refresh_token');
    this.isRefreshing = false;
    this.refreshSubscribers = [];
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

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      let response = await fetch(url, config);

      // Handle 401 Unauthorized -> try token rotation
      if (response.status === 401 && this.refreshToken && !this.isRefreshing) {
        this.isRefreshing = true;
        
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const { accessToken: newAccess, refreshToken: newRefresh } = refreshData.data.tokens;
            
            this.setTokens(newAccess, newRefresh);
            this.isRefreshing = false;
            this.onRefreshed(newAccess);

            // Re-fire original request with the fresh token
            headers['Authorization'] = `Bearer ${newAccess}`;
            response = await fetch(url, { ...options, headers });
          } else {
            // Refresh token expired or invalid -> sign out
            this.isRefreshing = false;
            this.clearTokens();
            window.location.reload();
            throw new Error('Session expired. Please log in again.');
          }
        } catch (refreshErr) {
          this.isRefreshing = false;
          this.clearTokens();
          throw refreshErr;
        }
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Something went wrong');
      }

      return responseData;
    } catch (err) {
      console.error(`API request error on ${endpoint}:`, err);
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
