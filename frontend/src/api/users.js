import api from './axios';

export const usersApi = {
  // Create user (Admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Get all users (Admin only)
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data; // { users: [...] }
  },

  // Get user by ID (Admin, Teacher)
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data; // { user: {...} }
  },

  // Update user by ID (Admin)
  updateUser: async (id, userData) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data; // { user: {...} }
  },

  // Delete user by ID (Admin)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
