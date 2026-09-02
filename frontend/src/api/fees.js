import api from './axios';

export const feesApi = {
  
  getAllFees: async () => {
    const response = await api.get('/fees');
    return response.data;
  },

  
  getMyFees: async () => {
    const response = await api.get('/fees/my');
    return response.data;
  },

  
  getFeeById: async (id) => {
    const response = await api.get(`/fees/${id}`);
    return response.data;
  },

  
  createFee: async (feeData) => {
    const response = await api.post('/fees', feeData);
    return response.data;
  },

  
  updateFee: async (id, feeData) => {
    const response = await api.patch(`/fees/${id}`, feeData);
    return response.data;
  },

  
  recordPayment: async (id, amount) => {
    const response = await api.patch(`/fees/${id}/payment`, { amount });
    return response.data;
  },

  
  deleteFee: async (id) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },
};

export default feesApi;
