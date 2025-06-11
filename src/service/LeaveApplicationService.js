import { applyLeaveApplication, getAllLeaveType } from '@/api/index';

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

    


};