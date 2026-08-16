import axios from 'axios';
import { toast } from 'react-toastify';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for API Error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'An unexpected network error occurred';

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
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
  importJson: (formData) => API.post('/questions/import-json', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const resultAPI = {
  getResults: (params) => API.get('/results', { params }),
  exportExcel: (params) => API.get('/results/export/excel', { params, responseType: 'blob' }),
};

export default API;
