import api from './axios';

export const notesApi = {
  
  createNote: async (noteData) => {
    const response = await api.post('/notes', noteData);
    return response.data;
  },

  
  getAllNotes: async () => {
    const response = await api.get('/notes');
    return response.data;
  },

  
  getTeacherNotes: async () => {
    const response = await api.get('/notes/teacher');
    return response.data;
  },

  
  getMyNotes: async () => {
    const response = await api.get('/notes/my');
    return response.data;
  },

  
  getNoteById: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  
  updateNote: async (id, noteData) => {
    const response = await api.patch(`/notes/${id}`, noteData);
    return response.data;
  },

  
  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  
  downloadNote: async (id) => {
    const response = await api.get(`/notes/${id}/download`, {
      responseType: 'blob',
    });

    const disposition = response.headers?.['content-disposition'] || response.headers?.get?.('content-disposition');
    let headerFileName = null;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?((['"]).*?\2|[^;\n]*)/i);
      if (match && match[1]) {
        headerFileName = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }

    return {
      blob: response.data,
      fileName: headerFileName,
    };
  },
};
