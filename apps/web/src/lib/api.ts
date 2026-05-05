import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Returns an absolute base URL for direct browser links (PDFs, photos, etc.)
 * - If NEXT_PUBLIC_API_URL is set (e.g. separate API domain) → use it
 * - Otherwise fall back to the current origin (same-domain deploy on Vercel)
 */
export function getApiBaseUrl(): string {
  if (API_URL) return API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');

        if (refreshToken && userId) {
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
            userId,
            refreshToken,
          });

          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, redirect to login
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
