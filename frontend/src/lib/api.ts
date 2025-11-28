import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('[API] Request interceptor - URL:', config.url);

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const clientId = localStorage.getItem('current_client_id');

      console.log('[API] Request interceptor - Auth state:', {
        hasToken: !!token,
        hasClientId: !!clientId,
        url: config.url
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add client ID header if available
      if (clientId) {
        config.headers['X-Client-ID'] = clientId;
      }
    } else {
      console.log('[API] Request interceptor - Running on server (no window)');
    }

    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response success:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  async (error) => {
    console.error('[API] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[API] Attempting token refresh...');

      if (typeof window !== 'undefined') {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            console.log('[API] Refresh token found, refreshing...');
            const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
              refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem('access_token', access);
            console.log('[API] Token refresh successful');

            originalRequest.headers.Authorization = `Bearer ${access}`;
            return api(originalRequest);
          } else {
            console.log('[API] No refresh token found');
          }
        } catch (refreshError) {
          // Refresh token failed, redirect to login
          console.error('[API] Token refresh failed:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper function for file uploads
export const uploadFile = async (
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    const clientId = localStorage.getItem('current_client_id');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (clientId) {
      headers['X-Client-ID'] = clientId;
    }
  }

  return axios.post(`${API_URL}/api${url}`, formData, {
    ...config,
    headers: {
      ...headers,
      ...config?.headers,
    },
  });
};
