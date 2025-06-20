import { applyLeaveApplication, getAllLeaveType, getLeaveSummary } from '@/api/index';

export const LeaveApplicationService = {
    async getLeaveTypes() {
        const res = await getAllLeaveType();
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '取得請假類型失敗');
    },

    async submitLeaveApplication(data) {
        const res = await applyLeaveApplication(data);
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '申請失敗');
    },

    async getLeaveSummary() {
        const res = await getLeaveSummary();
        console.log('leave summary api 回傳：', res);
        if (res.success) return res.body;
        else throw new Error(res.errMsg || '取得請假申請紀錄失敗');
    }
};
