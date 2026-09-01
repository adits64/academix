import api from './axios';

export const enrollmentsApi = {
  // Create enrollment (Admin only)
  createEnrollment: async (enrollmentData) => {
    const response = await api.post('/enrollments', enrollmentData);
    return response.data;
  },

  // Get all enrollments (Admin only)
  getAllEnrollments: async () => {
    const response = await api.get('/enrollments');
    return response.data;
  },

  // Get enrollment by ID (Admin only)
  getEnrollmentById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  // Update enrollment (Admin only)
  updateEnrollment: async (id, enrollmentData) => {
    const response = await api.patch(`/enrollments/${id}`, enrollmentData);
    return response.data;
  },

  // Get student's enrolled courses and batches (Student only)
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my');
    return response.data;
  },

  // Delete enrollment (Admin only)
  deleteEnrollment: async (id) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },
};
