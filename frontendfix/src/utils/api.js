import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/signin';
    }
    
    // Extract error message
    const message = error.response?.data?.message || error.message || 'Network error';
    
    return Promise.reject(new Error(message));
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Room API calls
export const roomAPI = {
  createRoom: (roomData) => api.post('/rooms', roomData),
  getRoomByCode: (roomCode) => api.get(`/rooms/code/${roomCode}`),
  joinRoom: (roomCode) => api.post(`/rooms/join/${roomCode}`),
  leaveRoom: (roomId) => api.post(`/rooms/leave/${roomId}`),
  getRoomParticipants: (roomId) => api.get(`/rooms/${roomId}/participants`),
  getUserRooms: () => api.get('/rooms/my-rooms'),
  updateRoomStatus: (roomId, status) => api.put(`/rooms/${roomId}/status`, status),
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
