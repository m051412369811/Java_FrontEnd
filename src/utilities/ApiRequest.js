// session-based login 不用管 token header，只要 withCredentials: true
import axios from 'axios';

// 可根據環境變數調整 API 位置
const API_BASE_URL = import.meta.env.VITE_API_HOST || "http://localhost:8080";

// 攔截器也不用加 token，錯誤攔截可保留
const request = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // 這是重點
    timeout: 10000
});

// 回應攔截器（如需全域處理錯誤可加，或只 return response.data 也可）
request.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
);

// 這裡統一 export axios 方法
const ApiRequest = {
    httpGet: request.get,
    httpPost: request.post,
    httpPut: request.put,
    httpDelete: request.delete
};

export default ApiRequest;