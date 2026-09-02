import api from './axios';

export const feesApi = {
  // Get all fees (Admin only)
  getAllFees: async () => {
    const response = await api.get('/fees');
    return response.data;
  },

  // Get current logged-in student's fees (Student only)
  getMyFees: async () => {
    const response = await api.get('/fees/my');
    return response.data;
  },

  // Get fee by ID
  getFeeById: async (id) => {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },

  // Create fee record (Admin only)
  createFee: async (feeData) => {
    const response = await api.post('/fees', feeData);
    return response.data;
  },

  // Update fee record (Admin only)
  updateFee: async (id, feeData) => {
    const response = await api.patch(`/fees/${id}`, feeData);
    return response.data;
  },

  // Record payment for a fee (Admin only)
  recordPayment: async (id, amount) => {
    const response = await api.patch(`/fees/${id}/payment`, { amount });
    return response.data;
  },

  // Delete fee record (Admin only)
  deleteFee: async (id) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },
};

export default feesApi;
