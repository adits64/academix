import axios from 'axios';

// When VITE_API_URL is empty, relative path uses Vite proxy (bypassing CORS)
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('academix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract clean error messages & handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';

    if (error.response) {
      if (error.response.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        message = error.response.data.errors.map((e) => e.message).join(', ');
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      } else if (error.response.data?.error) {
        message = error.response.data.error;
      } else if (error.response.status === 401) {
        message = 'Invalid credentials';
      } else {
        message = `Request failed with status ${error.response.status}`;
      }
    } else if (error.request) {
      message = 'Unable to connect to server. Please ensure the backend is running.';
    } else {
      message = error.message || 'An unexpected error occurred';
    }

    // Format error object for components/hooks
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.data = error.response?.data;

    // Handle token expiration or unauthorized access
    if (error.response?.status === 401) {
      // Clear token if unauthorized, except for login route
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest && typeof window !== 'undefined') {
        localStorage.removeItem('academix_token');
        localStorage.removeItem('academix_user');
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
