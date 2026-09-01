import api from './axios';

export const attendanceApi = {
  // Mark attendance (Teacher only)
  createAttendance: async (attendanceData) => {
    const response = await api.post('/attandances', attendanceData);
    return response.data;
  },

  // Get all attendance records (Admin only)
  getAllAttendance: async () => {
    const response = await api.get('/attandances');
    return response.data;
  },

  // Get teacher's attendance across all their courses (Teacher only)
  getTeacherAttendance: async () => {
    const response = await api.get('/attandances/teacher');
    return response.data;
  },

  // Get teacher's course + batch attendance (Teacher only)
  getTeacherBatchAttendance: async (courseId, batchId) => {
    const response = await api.get(`/attandances/teacher/${courseId}/${batchId}`);
    return response.data;
  },

  // Get student's own attendance records (Student only)
  getMyAttendance: async () => {
    const response = await api.get('/attandances/my');
    return response.data;
  },

  // Get single attendance record (Admin, Teacher, Student)
  getAttendanceById: async (id) => {
    const response = await api.get(`/attandances/${id}`);
    return response.data;
  },

  // Update attendance record (Teacher only)
  updateAttendance: async (id, attendanceData) => {
    const response = await api.patch(`/attandances/${id}`, attendanceData);
    return response.data;
  },

  // Delete attendance record (Admin only)
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attandances/${id}`);
    return response.data;
  },
};
