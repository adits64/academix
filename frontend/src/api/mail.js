import api from './axios';

export const mailApi = {
  
  sendNotice: async (noticeData) => {
    const response = await api.post('/email', noticeData);
    return response.data;
  },
};
