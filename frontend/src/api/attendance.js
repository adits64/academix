import api from './axios';

export const attendanceApi = {
  
  createAttendance: async (attendanceData) => {
    const response = await api.post('/attandances', attendanceData);
    return response.data;
  },

  
  getAllAttendance: async () => {
    const response = await api.get('/attandances');
    return response.data;
  },

  
  getTeacherAttendance: async () => {
    const response = await api.get('/attandances/teacher');
    return response.data;
  },

  
  getTeacherBatchAttendance: async (courseId, batchId) => {
    const response = await api.get(`/attandances/teacher/${courseId}/${batchId}`);
    return response.data;
  },

  
  getMyAttendance: async () => {
    const response = await api.get('/attandances/my');
    return response.data;
  },

  
  getAttendanceById: async (id) => {
    const response = await api.get(`/attandances/${id}`);
    return response.data;
  },

  
  updateAttendance: async (id, attendanceData) => {
    const response = await api.patch(`/attandances/${id}`, attendanceData);
    return response.data;
  },

  
  deleteAttendance: async (id) => {
    const response = await api.delete(`/attandances/${id}`);
    return response.data;
  },
};
