import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { APP_CONFIG } from '@/constants/config';
import { useAuthStore } from '@/store/auth.store';

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let isRefreshing = false;
let queue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error?: unknown, token?: string) => {
  queue.forEach((item) => {
    if (error) item.reject(error);
    else if (token) item.resolve(token);
  });
  queue = [];
};

export const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: APP_CONFIG.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>;

    if (envelope && typeof envelope === 'object' && 'code' in envelope) {
      if (envelope.code >= 400) {
        return Promise.reject(new Error(envelope.message || 'Request failed'));
      }
      return {
        ...response,
        data: envelope.data,
      };
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, clearSession, setSession, user, accessToken } = useAuthStore.getState();

    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshClient = axios.create({
        baseURL: APP_CONFIG.API_BASE_URL,
        timeout: APP_CONFIG.API_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      const refreshResult = await refreshClient.post<ApiEnvelope<RefreshResponse>>('/auth/refresh', {
        refreshToken,
      });

      const refreshData = refreshResult.data.data;
      if (!refreshData?.accessToken) {
        throw new Error('Invalid refresh response');
      }

      setSession({
        accessToken: refreshData.accessToken,
        refreshToken: refreshData.refreshToken || refreshToken,
        user,
      });

      processQueue(undefined, refreshData.accessToken);

      originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      clearSession();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
