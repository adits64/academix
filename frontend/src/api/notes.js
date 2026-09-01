import api from './axios';

export const notesApi = {
  // Create / upload note (Teacher only)
  createNote: async (noteData) => {
    const response = await api.post('/notes', noteData);
    return response.data;
  },

  // Get all notes (Admin only)
  getAllNotes: async () => {
    const response = await api.get('/notes');
    return response.data;
  },

  // Get teacher's created notes (Teacher only)
  getTeacherNotes: async () => {
    const response = await api.get('/notes/teacher');
    return response.data;
  },

  // Get student's enrolled course notes (Student only)
  getMyNotes: async () => {
    const response = await api.get('/notes/my');
    return response.data;
  },

  // Get single note (Admin, Teacher, Student)
  getNoteById: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Update note (Teacher only)
  updateNote: async (id, noteData) => {
    const response = await api.patch(`/notes/${id}`, noteData);
    return response.data;
  },

  // Delete note (Admin, Teacher)
  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  // Download note file (Admin, Teacher, Student)
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
