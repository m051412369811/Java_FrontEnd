import ApiRequest from '@/utilities/ApiRequest';


const apiPath = {
    login: '/api/login',
    logout: '/api/logout',
    userInfo: '/api/user',
    getAllLeaveType: '/api/leaveapplications/getallleavetype',
    applyLeaveApplication:'/api/leaveapplications/applyingleaveapplication'


    // 其他 API 例如
    // getProfile: '/api/profile',
    // updatePassword: '/api/updatePassword'
};

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

export function getAllLeaveType(){
    return ApiRequest.httpGet(apiPath.getAllLeaveType);
};

export function applyLeaveApplication(data) {
    return ApiRequest.httpPost(apiPath.applyLeaveApplication, data);
}




