import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false
});

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

let isRefreshing = false;
let refreshPromise = null;
let logoutHandler = () => {};

export const setAuthLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const clearStoredTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

api.interceptors.request.use((config) => {
  if (config?.skipAuthRefresh) {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status === 401 && originalRequest && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      const refresh = getRefreshToken();
      if (!refresh) {
        logoutHandler();
        return Promise.reject(error);
      }

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = axios.post(
            `${API_BASE_URL}/api/auth/token/refresh/`,
            { refresh },
            { skipAuthRefresh: true }
          );
        }

        const { data } = await refreshPromise;
        const newAccess = data?.access;

        if (newAccess) {
          localStorage.setItem('access_token', newAccess);
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }

        logoutHandler();
        return Promise.reject(error);
      } catch (refreshError) {
        logoutHandler();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
