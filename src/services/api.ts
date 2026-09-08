import axios from 'axios';
import { authService } from './authService';

// Ensure API_BASE_URL always ends with /api
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (apiUrl && !apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.replace(/\/$/, '') + '/api'; // Remove trailing slash, then add /api
}
export const API_BASE_URL = apiUrl;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const freshToken = await authService.getIdToken();
        if (freshToken) {
            localStorage.setItem('firebaseToken', freshToken);
            config.headers.Authorization = `Bearer ${freshToken}`;
        } else {
            const cachedToken = localStorage.getItem('firebaseToken');
            if (cachedToken) {
                config.headers.Authorization = `Bearer ${cachedToken}`;
            } else {
                delete config.headers.Authorization;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            console.error('API Error:', error.response.data);

            if (error.response.status === 401) {
                // Unauthorized - clear token but DO NOT redirect
                // The component handling the request should handle the auth flow
                localStorage.removeItem('firebaseToken');
            }
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
