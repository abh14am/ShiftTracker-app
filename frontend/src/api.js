import axios from 'axios';

// The /api route is proxied to the backend by Nginx OR Vite dev server
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to inject the JWT auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin Configuration
export const getTeamMembers = () => api.get('/members').then(res => res.data);
export const createTeamMember = (data) => api.post('/members', data).then(res => res.data);
export const deleteTeamMember = (id) => api.delete(`/members/${id}`).then(res => res.data);

export const getShiftTypes = () => api.get('/shift-types').then(res => res.data);
export const createShiftType = (data) => api.post('/shift-types', data).then(res => res.data);
export const updateShiftType = (id, data) => api.put(`/shift-types/${id}`, data).then(res => res.data);
export const deleteShiftType = (id) => api.delete(`/shift-types/${id}`).then(res => res.data);

// Shifts
export const getShifts = () => api.get('/shifts').then(res => res.data);
export const getShiftById = (id) => api.get(`/shifts/${id}`).then(res => res.data);
export const createShift = (data) => api.post('/shifts', data).then(res => res.data);
export const updateShift = (id, data) => api.put(`/shifts/${id}`, data).then(res => res.data);
export const deleteShift = (id) => api.delete(`/shifts/${id}`).then(res => res.data);

export default api;
