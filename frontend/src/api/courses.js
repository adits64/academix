import api from './axios';

export const coursesApi = {
  // Create course (Admin only)
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  // Get all courses (Admin, Teacher, Student)
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data; // { courses: [...] }
  },

  // Get teacher's courses (Teacher only)
  getMyCourses: async () => {
    const response = await api.get('/courses/my');
    return response.data; // Array of courses
  },

  // Get course by ID (Admin, Teacher, Student)
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data; // { course: {...} }
  },

  // Update course (Admin only)
  updateCourse: async (id, courseData) => {
    const response = await api.patch(`/courses/${id}`, courseData);
    return response.data; // { course: {...} }
  },

  // Delete course (Admin only)
  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  // Get students in a teacher's specific course batch (Teacher only)
  getBatchStudents: async (courseId, batchId) => {
    const response = await api.get(`/courses/${courseId}/batches/${batchId}/students`);
    return response.data;
  },
};
