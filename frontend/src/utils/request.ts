import axios from 'axios';
import Taro from '@tarojs/taro';

const request = axios.create({
  baseURL: 'http://localhost:3000/api', // TODO: Get from env
  timeout: 10000,
});

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
