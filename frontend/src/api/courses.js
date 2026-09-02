import api from './axios';

export const coursesApi = {
  
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data; 
  },

  
  getMyCourses: async () => {
    const response = await api.get('/courses/my');
    return response.data; 
  },

  
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data; 
  },

  
  updateCourse: async (id, courseData) => {
    const response = await api.patch(`/courses/${id}`, courseData);
    return response.data; 
  },

  
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  
  getBatchStudents: async (courseId, batchId) => {
    const response = await api.get(`/courses/${courseId}/batches/${batchId}/students`);
    return response.data;
  },
};
