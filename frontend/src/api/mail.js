import api from './axios';

export const mailApi = {
  // Send email notice to students or batch (Admin, Teacher)
  sendNotice: async (noticeData) => {
    const response = await api.post('/email', noticeData);
    return response.data;
  },
};
