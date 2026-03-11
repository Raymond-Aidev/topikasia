import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const examApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

examApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('examToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

examApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('examToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
