import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

const request = axios.create({
  // 开发走 Vite 代理 /api;生产由 VITE_API_BASE 指向后端(如 https://xxx.onrender.com/api)
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
});

// 请求拦截:带上 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('yl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截:直接返回业务数据;401 跳登录;其它弹错误提示
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const raw = error.response?.data?.message || error.message || '请求失败';
    const msg = Array.isArray(raw) ? raw[0] : raw;
    if (status === 401) {
      localStorage.removeItem('yl_token');
      localStorage.removeItem('yl_user');
      if (router.currentRoute.value.path !== '/login') {
        ElMessage.error('登录已过期,请重新登录');
        router.replace('/login');
      }
    } else {
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  },
);

export default request;
