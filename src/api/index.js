import apiPath from '@/api/apiPath';
import ApiRequest from '@/utilities/ApiRequest';


// 登入（Spring Boot 設計是 form-urlencoded）
export function login(empId, password) {
    const params = new URLSearchParams();
    params.append('empId', empId);
    params.append('password', password);
    return ApiRequest.httpPost(apiPath.login, params);
}

// 查詢當前登入者
export function userInfo() {
    return ApiRequest.httpGet(apiPath.userInfo);
}

// 登出
export function logout() {
    return ApiRequest.httpPost(apiPath.logout);
}
