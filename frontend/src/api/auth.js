import api from './axios';

export const authApi = {
  /**
   * Log in user
   * @param {Object} credentials { email, password }
   * @returns {Promise<string|Object>} JWT token string or token object
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};
