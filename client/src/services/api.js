import axios from 'axios';

export const SESSION_EXPIRED_EVENT = 'examiq:session-expired';

const publicAuthRequest = (url = '') => /^\/auth\/(login|register|forgot-password|reset-password|magic-login|verify-phone|resend|phone\/(request-code|verify))(\/|\?|$)/.test(url);
const getStoredToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

export const getApiErrorMessage = (error, fallback = 'The request could not be completed. Please try again.') => {
  const responseData = error?.response?.data;
  const responseIsHtml = typeof responseData === 'string' && /^\s*</.test(responseData);
  const serverMessage = typeof responseData === 'string'
    ? responseIsHtml ? '' : responseData.trim()
    : responseData?.message;
  if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;
  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    const status = error.response?.status;
    return status ? `${responseData.error} (HTTP ${status}).` : responseData.error;
  }
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'The request timed out. Check your connection and refresh before trying again.';
  }
  if (!error?.response && error?.request) return 'Unable to reach the server. Check your connection and try again.';
  if (error?.response?.status) {
    return responseIsHtml
      ? `The server returned an unexpected response (HTTP ${error.response.status}).`
      : `The request failed (HTTP ${error.response.status}). Please try again.`;
  }
  return fallback;
};

const getBaseURL = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Token
API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !publicAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeCollege = localStorage.getItem('activeCollege');
    if (activeCollege && !publicAuthRequest(config.url)) {
      try {
        const parsed = JSON.parse(activeCollege);
        const collegeId = parsed?._id || parsed?.id;
        if (collegeId) config.headers['X-College-Id'] = collegeId;
      } catch (err) {
        localStorage.removeItem('activeCollege');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for API Error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = getStoredToken();
    // A late response from a previous session must not sign out a newly logged-in user.
    if (error.response?.status === 401 && token &&
        error.config?.headers?.Authorization === `Bearer ${token}` &&
        !publicAuthRequest(error.config?.url)) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeCollege');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export const aiAPI = {
  generateQuestions: (data) => API.post('/ai/generate-questions', data),
  analyzeCode: (data) => API.post('/ai/analyze-code', data),
};

export const plagiarismAPI = {
  getReport: (examId = 'all') => API.get(`/plagiarism/exam/${examId}`),
};

export const antiCheatAPI = {
  getAudit: (examId = 'all') => API.get(`/anti-cheat/exam/${examId}`),
};

export const examAssignmentAPI = {
  create: (data) => API.post('/exam-assignments', data),
  getFacultyAssignments: (params) => API.get('/exam-assignments/faculty', { params }),
  getStudentAssignments: () => API.get('/exam-assignments/student'),
  getById: (id) => API.get(`/exam-assignments/${id}`),
  update: (id, data) => API.put(`/exam-assignments/${id}`, data),
  delete: (id) => API.delete(`/exam-assignments/${id}`),
  publish: (id) => API.post(`/exam-assignments/${id}/publish`),
  getEligibleCount: (params) => API.get('/exam-assignments/eligible-count', { params }),
};

export const questionAPI = {
  getAll: async () => {
    const first = await API.get('/questions', { params: { page: 1, limit: 100 } });
    const questions = [...(first.data.questions || [])];
    for (let page = 2; page <= (first.data.totalPages || 1); page++) {
      const response = await API.get('/questions', { params: { page, limit: 100 } });
      questions.push(...(response.data.questions || []));
    }
    return { ...first, data: { ...first.data, questions } };
  },
  importJson: (formData) => API.post('/questions/import-json', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const resultAPI = {
  getResults: (params) => API.get('/results', { params }),
  exportExcel: (params) => API.get('/results/export/excel', { params, responseType: 'blob' }),
};

export default API;
