<script setup>
import { extraWorkDays, publicHolidays } from '@/data/Holidays';
import { LeaveApplicationService } from '@/service/LeaveApplicationService';
import { formatDate } from '@/utilities/LeaveDayHelper';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const dt = ref();
const applicationRequest = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const leaveTypes = ref([]);
const loadingLeaveTypes = ref(false);
const submitting = ref(false);
const leaveList = ref([]);
const loadingLeaveList = ref(true);

const fetchLeaveList = async () => {
    try {
        const summaryData = await LeaveApplicationService.getLeaveSummary();
        leaveList.value = summaryData;
    } catch (error) {
        // ✅ Service 中拋出的 Error 會在這裡被捕捉到，error.message 就是您定義的 errMsg。
        toast.add({
            severity: 'error',
            summary: '錯誤',
            detail: error.message,
            life: 3000
        });
        console.error('載入請假紀錄失敗:', error);
    } finally {
        loadingLeaveList.value = false;
    }
};

onMounted(async () => {
    //載入員工的請假申請列表
    fetchLeaveList();
});

// 表單資料
const form = ref({
    leaveTypeId: null,
    description: null,
    startDate: null,
    endDate: null
});
const submitted = ref(false);

// 當 Dialog 打開時 (值從 false 變為 true)，才去載入假別資料
watch(applicationRequest, (newValue) => {
    if (newValue === true) {
        fetchLeaveTypes();
    }
});

const totalLeaveDays = computed(() => {
    const start = form.value.startDate;
    const end = form.value.endDate;

    // 偵錯日誌 (1)：看看傳入的原始日期是什麼
    console.log('--- 計算開始 ---');
    console.log('傳入的開始日期:', start);
    console.log('傳入的結束日期:', end);

    if (!start || !end) {
        console.log('因日期不完整，回傳 0');
        return 0;
    }
    if (end < start) {
        console.log('因結束日早于開始日，回傳 0');
        return 0;
    }

    let count = 0;
    const current = new Date(form.value.startDate);
    current.setHours(0, 0, 0, 0);

    const endDate = new Date(form.value.endDate);
    endDate.setHours(0, 0, 0, 0);

    // --- 確保您的迴圈是這個版本 ---
    while (current <= endDate) {
        const dayOfWeek = current.getDay(); // 0=週日, 6=週六
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateString = formatDate(current);
        const isHoliday = publicHolidays.has(dateString);
        const isExtraWorkDay = extraWorkDays.has(dateString);

        // 判斷是否為工作日
        if (isExtraWorkDay) {
            // 條件1：如果是補班日，無論如何都算作工作日
            count++;
        } else if (!isWeekend && !isHoliday) {
            // 條件2：如果不是週末，也不是國定假日，才算作工作日
            count++;
        }
        // 如果是週末或國定假日(且不是補班日)，則 count 不會增加
        // 將日期向前推一天
        current.setDate(current.getDate() + 1);
    }
    // 偵錯日誌 (2)：看看最後計算出的結果是什麼
    console.log('計算出的最終天數:', count);
    console.log('--- 計算結束 ---');
    return count;
});

// 載入請假類型
const fetchLeaveTypes = async () => {
    loadingLeaveTypes.value = true;
    try {
        leaveTypes.value = await LeaveApplicationService.getLeaveTypes();
    } catch (err) {
        console.error('❌ 載入假別失敗:', err.message);
    } finally {
        loadingLeaveTypes.value = false;
    }
};

const submitLeave = async () => {
    // 步驟一：前端驗證 (來自我的建議)
    // 確保所有必填欄位都有值，才能繼續往下走
    if (!form.value.leaveTypeId || !form.value.startDate || !form.value.endDate) {
        toast.add({
            severity: 'warn',
            summary: '提醒',
            detail: '請假類型、開始和結束日期為必填欄位',
            life: 3000
        });
        return; // 中斷執行
    }

    submitting.value = true;
    try {
        // 步驟二：資料轉換 (使用您的 formatDate 函式)
        // 因為已經通過了驗證，所以這裡的 form.value.startDate 和 endDate 一定是有效的 Date 物件
        const transferedForm = {
            leaveTypeId: form.value.leaveTypeId,
            description: form.value.description,
            startDate: formatDate(form.value.startDate), // ✅ 使用您的函式，清晰又安全
            endDate: formatDate(form.value.endDate) // ✅ 使用您的函式
        };
        console.log(JSON.stringify(transferedForm));
        await LeaveApplicationService.submitLeaveApplication(transferedForm);
        toast.add({ severity: 'success', summary: '成功', detail: '請假申請已送出', life: 3000 });
        fetchLeaveList();
        hideDialog(); // 成功後關閉 Dialog
        // 可以在此刷新主列表資料
    } catch (err) {
        console.error('❌ 請假送出失敗:', err);
        toast.add({ severity: 'error', summary: '錯誤', detail: '送出失敗，請稍後再試', life: 3000 });
    } finally {
        submitting.value = false;
    }
};

// 4. 新增：開啟和關閉 Dialog 的方法
const openNewApplication = () => {
    // 重置表單
    form.value = {
        leaveTypeId: null,
        startDate: null,
        endDate: null,
        description: null
    };
    applicationRequest.value = true;
};

function openNew() {
    submitted.value = false;
    applicationRequest.value = true;
}

function hideDialog() {
    applicationRequest.value = false;
    submitted.value = false;
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNewApplication" />
                </template>
            </Toolbar>

            <DataTable :value="leaveList" :loading="loadingLeaveList" dataKey="id" :filters="filters" paginator :rows="10" :rowsPerPageOptions="[5, 10, 25]">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">請假申請查詢列表</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="搜尋..." />
                        </IconField>
                    </div>
                </template>
                <Column field="applyDate" header="申請日期" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.applyDate }}
                    </template>
                </Column>
                <Column field="leaveType" header="假別" sortable />
                <Column field="description" header="說明" />
                <Column field="startDate" header="開始日期" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.leaveStart }}
                    </template>
                </Column>
                <Column field="endDate" header="結束日期" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.leaveEnd }}
                    </template>
                </Column>
                <Column field="leaveDay" header="天數" sortable />
                <Column field="statusType" header="狀態" sortable />
            </DataTable>
        </div>

        <Dialog v-model:visible="applicationRequest" :style="{ width: '450px' }" header="請假申請" :modal="true">
            <div class="flex flex-col gap-6 pt-4">
                <div>
                    <label for="leaveTypeSelection" class="block font-bold mb-3">請假類型</label>
                    <Dropdown id="leaveTypeSelection" v-model="form.leaveTypeId" :options="leaveTypes" optionLabel="label" optionValue="value" placeholder="請選擇假別" :loading="loadingLeaveTypes" class="w-full" />
                </div>
                <div>
                    <label for="description" class="block font-bold mb-3">請假事由</label>
                    <Textarea id="description" v-model="form.description" rows="3" class="w-full" />
                </div>
                <div>
                    <label for="leaveStartDate" class="block font-bold mb-3">開始日期</label>
                    <DatePicker id="leaveStartDate" v-model="form.startDate" dateFormat="yy-mm-dd" :showIcon="true" :maxDate="form.endDate" :manualInput="false" placeholder="請選擇日期" class="w-full" />
                </div>
                <div>
                    <label for="leaveEndDate" class="block font-bold mb-3">結束日期</label>
                    <DatePicker id="leaveEndDate" v-model="form.endDate" dateFormat="yy-mm-dd" :showIcon="true" :minDate="form.startDate" :manualInput="false" placeholder="請選擇日期" class="w-full" />
                </div>
                <div class="col-span-6">
                    <label for="leaveDays" class="block font-bold mb-3">總請假天數</label>
                    <InputText :value="totalLeaveDays" disabled class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="取消" icon="pi pi-times" text @click="hideDialog" />
                <Button label="送出" icon="pi pi-check" @click="submitLeave" :loading="submitting" />
            </template>
        </Dialog>
    </div>
</template>
