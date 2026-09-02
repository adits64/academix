import api from './axios';

export const enrollmentsApi = {
  
  createEnrollment: async (enrollmentData) => {
    const response = await api.post('/enrollments', enrollmentData);
    return response.data;
  },

  
  getAllEnrollments: async () => {
    const response = await api.get('/enrollments');
    return response.data;
  },

  
  getEnrollmentById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  
  updateEnrollment: async (id, enrollmentData) => {
    const response = await api.patch(`/enrollments/${id}`, enrollmentData);
    return response.data;
  },

  
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my');
    return response.data;
  },

  
  deleteEnrollment: async (id) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },
};
