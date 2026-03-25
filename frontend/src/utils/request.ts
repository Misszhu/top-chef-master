import axios from 'axios';
import Taro from '@tarojs/taro';
import MpAdapter, { defaultTransformRequest } from '@taro-platform/axios-taro-adapter';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 为小程序等非 H5 环境设置适配器
if (process.env.TARO_ENV !== 'h5') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (request.defaults as any).adapter = MpAdapter as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (request.defaults as any).transformRequest = defaultTransformRequest as any;
}

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const token = Taro.getStorageSync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      Taro.removeStorageSync('token');
      Taro.removeStorageSync('userInfo');
      // Optional: Redirect to login or show message
    }
    return Promise.reject(error);
  }
);

export default request;
