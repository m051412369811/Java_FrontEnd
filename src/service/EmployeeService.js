import { createEmployee, getDepartmentOptions, getEmployee, getEmployees, getManagerOptions, getTitleOptions, updateEmployee } from '@/api/index';

// 封裝所有與員工管理相關的 API 呼叫
export const EmployeeService = {
    // 獲取員工列表
    async getEmployeeList(departmentId = null) {
        const res = await getEmployees(departmentId);
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '獲取員工列表失敗');
    },
    // 新增員工
    async createNewEmployee(employeeData) {
        const res = await createEmployee(employeeData);
        if (res.success)
            return res.body; // 成功時回傳新員工的ID
        else throw new Error(res.errMsg || '新增員工失敗');
    },
    // 更新員工
    async updateExistingEmployee(employeeId, employeeData) {
        const res = await updateEmployee(employeeId, employeeData);
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '更新員工失敗');
    },

    // 獲取下拉選單資料
    async fetchDepartmentOptions() {
        const res = await getDepartmentOptions();
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '獲取部門選項失敗');
    },
    async fetchTitleOptions() {
        const res = await getTitleOptions();
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '獲取職稱選項失敗');
    },
    async fetchManagerOptions() {
        const res = await getManagerOptions();
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '獲取主管選項失敗');
    },

    async getEmployeeDetails(employeeId) {
        const res = await getEmployee(employeeId);
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '獲取員工詳細資料失敗');
    }
};
