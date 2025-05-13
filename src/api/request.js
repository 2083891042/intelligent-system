// request.js
import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
    baseURL: 'http://localhost:8080', // 替换为你的后端 API 地址
    timeout: 5000, // 请求超时时间
});

const getToken = () => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    return token
  }

// 请求拦截器
service.interceptors.request.use(
    config => {
        const token = getToken()
        config.headers['Authorization'] = 'Bearer ' + getToken();
        return config;
    },
    error => {
        // 对请求错误做些什么
        console.error(error);
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    response => {
        // 对响应数据做点什么
        return response.data;
    },
    error => {
        // 对响应错误做点什么
        console.error(error);
        return Promise.reject(error);
    }
);

export default service;
