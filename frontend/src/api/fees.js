import api from './axios';

// Note: Fees endpoints are defined in backend model (models/fee.js) but routes are not currently registered in backend handlers/index.js.
export const feesApi = {
  getFees: async () => {
    // Placeholder - see BACKEND_REQUIREMENTS.md
    throw new Error('Fees API routes are not yet exposed by the backend');
  },
};
