import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const duration = Date.now() - response.config.metadata.startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Check if token expired
      if (error.response.data?.code === 'TOKEN_EXPIRED') {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
              refreshToken
            });
            
            const { token } = response.data;
            localStorage.setItem('token', token);
            
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
         } catch (refreshError) {
           // Refresh failed, logout user
           localStorage.removeItem('token');
           localStorage.removeItem('refreshToken');
           localStorage.removeItem('user');
           // Dispatch logout event for React app to handle
           window.dispatchEvent(new Event('auth-logout'));
           return Promise.reject(refreshError);
         }
      } else {
        // Token invalid, logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    let errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    // Handle 429 errors (rate limiting)
    if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: errorMessage
      });
    }

    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data
    });
  }
);

// API helper methods
export const apiGet = (url, params) => api.get(url, { params });
export const apiPost = (url, data) => api.post(url, data);
export const apiPut = (url, data) => api.put(url, data);
export const apiPatch = (url, data) => api.patch(url, data);
export const apiDelete = (url) => api.delete(url);

export default api;
