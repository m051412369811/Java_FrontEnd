import { getPendingApprovals, submitApprovalAction } from '@/api/index'; // ✅ 從您的 api 管理檔案中引入方法

export const ApprovalService = {
    /**
     * 獲取當前登入主管的待審核列表
     * @returns {Promise<Array>} 成功時回傳待審核的 DTO 列表
     * @throws {Error} 失敗時拋出帶有後端訊息的錯誤
     */
    async getPendingApprovals() {
        // 呼叫 index.js 中的 getPendingApprovals 方法
        const res = await getPendingApprovals();

        // 檢查後端回傳的 BaseApiResponse
        if (res.success) {
            return res.body; // 成功，回傳核心資料
        } else {
            // 失敗，拋出錯誤，讓 Vue 元件的 catch 區塊可以捕捉到
            throw new Error(res.errMsg || '獲取待審核列表失敗');
        }
    },

    /**
     * 主管提交審核操作（批准或駁回）
     * @param {number} stepId - 要操作的審核步驟 ID
     * @param {string} action - 操作類型，'approve' 或 'reject'
     * @param {string | null} comments - 審核意見 (可選)
     * @returns {Promise<any>} 成功時回傳後端的成功訊息
     * @throws {Error} 失敗時拋出帶有後端訊息的錯誤
     */
    async submitApprovalAction(stepId, action, comments) {
        // 呼叫 index.js 中的 submitApprovalAction 方法，並傳入所有必要參數
        const res = await submitApprovalAction(stepId, action, comments);

        // 同樣的模式：檢查成功或失敗
        if (res.success) {
            return res.body;
        } else {
            throw new Error(res.errMsg || '審核操作失敗');
        }
    }
};
