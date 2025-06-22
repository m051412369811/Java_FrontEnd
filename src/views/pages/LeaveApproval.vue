<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ApprovalService } from '@/service/ApprovalService'; // 引入我們建立的 Service

// --- 狀態管理 (State) ---

const toast = useToast();
const pendingList = ref([]); // 存放待審核列表的資料
const isLoading = ref(true); // 控制 DataTable 的載入中動畫

// Dialog 相關的狀態
const approvalDialog = ref(false); // 控制 Dialog 是否顯示
const selectedApproval = ref(null); // 存放當前正在操作的那一筆假單資料
const comments = ref(''); // 綁定 Textarea 的評論內容
const currentAction = ref(''); // 記錄當前是 'approve' 還是 'reject'
const isSubmitting = ref(false); // 控制 Dialog 中確認按鈕的 loading 狀態
const processingStepId = ref(null);

// --- 生命週期鉤子 (Lifecycle Hook) ---

onMounted(() => {
    fetchPendingList(); // 元件一載入，就去獲取待審核列表
});

// --- 方法 (Methods) ---

/**
 * 從後端 API 獲取待審核列表
 */
const fetchPendingList = async () => {
    isLoading.value = true;
    try {
        pendingList.value = await ApprovalService.getPendingApprovals();
    } catch (error) {
        toast.add({ severity: 'error', summary: '載入失敗', detail: error.message, life: 3000 });
    } finally {
        isLoading.value = false;
    }
};

/**
 * 當主管點擊「批准」或「駁回」按鈕時，打開確認對話框
 * @param {object} item - 該列的假單資料
 * @param {string} action - 'approve' 或 'reject'
 */
const openApprovalDialog = (item, action) => {
    selectedApproval.value = item;
    currentAction.value = action;
    comments.value = ''; // 每次打開都清空評論
    approvalDialog.value = true;
};

/**
 * 關閉確認對話框
 */
const hideApprovalDialog = () => {
    approvalDialog.value = false;
    selectedApproval.value = null;
};

/**
 * 在對話框中，當主管按下最終的「確認」按鈕時執行
 */
const confirmApprovalAction = async () => {
    if (!selectedApproval.value) return;

    isSubmitting.value = true;
    processingStepId.value = selectedApproval.value.approvalStepId; // ✅ 記錄下正在處理的 ID
    try {
        const { approvalStepId } = selectedApproval.value;
        const action = currentAction.value;

        const successMessage = await ApprovalService.submitApprovalAction(approvalStepId, action, comments.value);

        toast.add({ severity: 'success', summary: '操作成功', detail: successMessage || '審核已完成', life: 3000 });

        hideApprovalDialog();
        await fetchPendingList(); // ✅ 核心步驟：成功後自動重新整理列表
    } catch (error) {
        toast.add({ severity: 'error', summary: '操作失敗', detail: error.message, life: 3000 });
    } finally {
        isSubmitting.value = false;
        processingStepId.value = null; // ✅ 操作結束後，清空 ID
    }
};

// --- 計算屬性 (Computed) ---

/**
 * 動態產生 Dialog 的標題
 */
const dialogTitle = computed(() => {
    if (!selectedApproval.value) return '審核操作';
    const actionText = currentAction.value === 'approve' ? '批准' : '駁回';
    return `${actionText} ${selectedApproval.value.applicantName} 的請假申請`;
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>待審核的假單</h5>
                <p>以下是需要您進行審核的請假申請列表。</p>

                <DataTable :value="pendingList" :loading="isLoading" responsiveLayout="scroll" class="mt-4">
                    <template #empty>
                        <div class="p-4 text-center">目前沒有待審核的項目，辛苦了！</div>
                    </template>

                    <Column field="applyDate" header="申請日期" sortable style="min-width: 8rem" />
                    <Column field="applicantName" header="申請人" sortable style="min-width: 8rem" />
                    <Column field="leaveTypeName" header="假別" />
                    <Column field="leaveDays" header="天數" sortable />
                    <Column field="startDate" header="開始日期" />
                    <Column field="endDate" header="結束日期" />
                    <Column field="description" header="事由" style="min-width: 15rem" />
                    <Column header="操作" style="width: 10rem; text-align: center">
                        <template #body="slotProps">
                            <Button
                                icon="pi pi-check"
                                class="p-button-rounded p-button-success mr-2"
                                v-tooltip.top="'批准'"
                                @click="openApprovalDialog(slotProps.data, 'approve')"
                                :disabled="isLoading || processingStepId === slotProps.data.approvalStepId"
                            />
                            <Button
                                icon="pi pi-times"
                                class="p-button-rounded p-button-danger"
                                v-tooltip.top="'駁回'"
                                @click="openApprovalDialog(slotProps.data, 'reject')"
                                :disabled="isLoading || processingStepId === slotProps.data.approvalStepId"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="approvalDialog" :style="{ width: '450px' }" :header="dialogTitle" :modal="true">
        <div class="flex flex-col gap-4 pt-4">
            <div v-if="selectedApproval">
                <p>
                    您正在對 <strong>{{ selectedApproval.applicantName }}</strong> 的請假申請進行操作。
                </p>
                <ul class="list-none p-0 m-0">
                    <li><strong>假別：</strong> {{ selectedApproval.leaveTypeName }}</li>
                    <li><strong>期間：</strong> {{ selectedApproval.startDate }} 至 {{ selectedApproval.endDate }} (共 {{ selectedApproval.leaveDays }} 天)</li>
                </ul>
            </div>
            <div class="mt-4">
                <label for="comments" class="block font-bold mb-2">審核意見 (選填)</label>
                <Textarea id="comments" v-model="comments" rows="4" class="w-full" placeholder="可在此輸入批准或駁回的理由..." />
            </div>
        </div>
        <template #footer>
            <Button label="取消" icon="pi pi-times" text @click="hideApprovalDialog" />
            <Button :label="currentAction === 'approve' ? '確認批准' : '確認駁回'" icon="pi pi-check" @click="confirmApprovalAction" :loading="isSubmitting" :class="{ 'p-button-danger': currentAction === 'reject' }" />
        </template>
    </Dialog>
</template>

<style scoped>
/* 可選：增加一些樣式來讓列表更美觀 */
.list-none li {
    padding: 0.25rem 0;
}
</style>
