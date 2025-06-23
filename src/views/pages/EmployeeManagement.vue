<script setup>
import { EmployeeService } from '@/service/EmployeeService'; // 假設您的 Service 在此
import { formatDate } from '@/utilities/LeaveDayHelper'; // 引入我們需要的日期格式化工具
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// --- 狀態管理 (State) ---
const toast = useToast();
const employeeList = ref([]); // 存放 DataTable 的員工列表
const isLoading = ref(true); // 控制 DataTable 的載入中動畫
const isSubmitting = ref(false); // 控制 Dialog 中儲存按鈕的 loading 狀態

// 部門篩選相關
const departmentOptions = ref([]); // 存放部門下拉選單的選項
const selectedDepartment = ref(null); // 綁定使用者選擇的部門 ID

// Dialog 相關
const dialogVisible = ref(false); // 控制 Dialog 是否顯示
const dialogMode = ref('new'); // 'new' 或 'edit'
const employeeForm = ref({}); // 綁定 Dialog 中表單的資料

// Dialog 內的下拉選單選項
const titleOptions = ref([]);
const managerOptions = ref([]);
const roleOptions = ref([
    { label: '一般員工', value: 'EMPLOYEE' },
    { label: '主管', value: 'MANAGER' },
    { label: '人資', value: 'HR' },
    { label: '系統管理員', value: 'ADMIN' }
]);

// --- 生命週期與監聽 ---

onMounted(() => {
    // 頁面一載入，就去獲取部門列表，用於篩選
    fetchDepartmentOptions();
});

// 監聽 selectedDepartment 的變化，一旦使用者選擇了新部門，就重新載入員工列表
watch(
    selectedDepartment,
    (newDeptId) => {
        fetchEmployeeList(newDeptId);
    },
    { immediate: true }
); // immediate: true 讓頁面一載入就立刻執行一次，獲取初始的員工列表

// --- 方法 (Methods) ---

// 獲取員工列表
async function fetchEmployeeList(departmentId) {
    isLoading.value = true;
    try {
        employeeList.value = await EmployeeService.getEmployeeList(departmentId);
    } catch (error) {
        toast.add({ severity: 'error', summary: '錯誤', detail: `無法載入員工列表: ${error.message}`, life: 3000 });
    } finally {
        isLoading.value = false;
    }
}

// 獲取所有用於下拉選單的選項
async function fetchDialogOptions() {
    try {
        const [titles, managers] = await Promise.all([EmployeeService.fetchTitleOptions(), EmployeeService.fetchManagerOptions()]);
        titleOptions.value = titles;
        managerOptions.value = managers;
    } catch (error) {
        toast.add({ severity: 'error', summary: '錯誤', detail: '無法載入表單選項', life: 3000 });
    }
}

async function fetchDepartmentOptions() {
    try {
        departmentOptions.value = await EmployeeService.fetchDepartmentOptions();
    } catch (error) {
        toast.add({ severity: 'error', summary: '錯誤', detail: '無法載入部門列表', life: 3000 });
    }
}

// 開啟「新增員工」的 Dialog
async function openNewDialog() {
    dialogMode.value = 'new';
    employeeForm.value = { role: 'EMPLOYEE', hireDate: new Date() }; // 提供預設值
    await fetchDialogOptions();
    dialogVisible.value = true;
}

// // 開啟「編輯員工」的 Dialog
// async function openEditDialog(employee) {
//     // 將來您可以擴充此功能，例如先 call API 獲取更詳細的員工資料
//     dialogMode.value = 'edit';
//     employeeForm.value = { ...employee }; // 簡化處理，直接複製列表資料
//     await fetchDialogOptions();
//     dialogVisible.value = true;
// }

// 儲存（新增或修改）
async function saveEmployee() {
    isSubmitting.value = true;
    try {
        // ✅ 關鍵修改：在所有 API 呼叫之前，先建立格式化後的 payload
        const payload = {
            // 使用展開運算子，先複製表單中除了日期以外的欄位
            // (例如: lastName, firstName, departmentId 等)
            ...employeeForm.value,

            // 明確地覆寫並格式化日期欄位
            birthDate: formatDate(employeeForm.value.birthDate),
            hireDate: formatDate(employeeForm.value.hireDate)
        };

        // 您可以用這個日誌來確認格式化後的結果是否正確
        console.log('格式化後，準備發送的最終 Payload:', payload);

        if (dialogMode.value === 'new') {
            // 現在傳送的是乾淨的 payload
            await EmployeeService.createNewEmployee(payload);
            toast.add({ severity: 'success', summary: '成功', detail: '新員工已建立', life: 3000 });
        } else {
            // ✅ 更新邏輯現在也使用同一個乾淨的 payload
            await EmployeeService.updateExistingEmployee(employeeForm.value.id, payload);
            toast.add({ severity: 'success', summary: '成功', detail: '員工資料已更新', life: 3000 });
        }

        dialogVisible.value = false;
        await fetchEmployeeList(selectedDepartment.value);
    } catch (error) {
        const errorMsg = error.response?.data?.errMsg || error.message || '儲存失敗，請檢查資料';
        toast.add({ severity: 'error', summary: '儲存失敗', detail: errorMsg, life: 3000 });
    } finally {
        isSubmitting.value = false;
    }
}

async function openEditDialog(employeeSummary) {
    console.log(`開始編輯員工，ID: ${employeeSummary.id}`);
    dialogMode.value = 'edit';

    try {
        // ---【第一步：索取資料】---
        // 呼叫 Service，去跟後端要這名員工的完整詳細資料
        const detailedData = await EmployeeService.getEmployeeDetails(employeeSummary.id);

        // ---【第二步：填充表單】---
        // 將後端回傳的完整資料，設定給 employeeForm 這個 ref
        // 它的欄位（firstName, lastName, departmentId...）會自動對應到 Dialog 中的各個輸入框
        employeeForm.value = {
            id: employeeSummary.id, // 把 ID 也存起來，儲存時才知道要更新哪一筆
            ...detailedData
        };

        // 載入 Dialog 中需要的下拉選單選項
        await fetchDialogOptions();

        // ---【第三步：打開 Dialog】---
        dialogVisible.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: '錯誤', detail: `無法獲取員工資料: ${error.message}`, life: 3000 });
    }
}

// --- 計算屬性 (Computed) ---
const dialogTitle = computed(() => (dialogMode.value === 'new' ? '新增員工' : '編輯員工資料'));
</script>

<template>
    <div class="card">
        <Toast />
        <Toolbar class="mb-4">
            <template #start>
                <Button label="新增員工" icon="pi pi-plus" class="p-button-secondary" @click="openNewDialog" />
            </template>
        </Toolbar>

        <div class="mb-4 flex justify-content-end">
            <Dropdown v-model="selectedDepartment" :options="departmentOptions" optionLabel="label" optionValue="value" placeholder="依部門篩選" :showClear="true" style="width: 18rem" />
        </div>

        <DataTable :value="employeeList" :loading="isLoading" responsiveLayout="scroll" paginator :rows="10">
            <template #header>
                <div class="text-xl font-bold">員工管理列表</div>
            </template>
            <template #empty> 沒有找到員工資料 </template>

            <Column field="id" header="ID" sortable />
            <Column field="fullName" header="姓名" sortable />
            <Column field="departmentName" header="部門" sortable />
            <Column field="titleName" header="職稱" sortable />
            <Column field="hireDate" header="到職日" sortable />
            <Column header="操作" style="width: 8rem; text-align: center">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success" @click="openEditDialog(slotProps.data)" />
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" :style="{ width: '450px' }" :header="dialogTitle" :modal="true" class="p-fluid">
        <div class="field">
            <label for="lastName">姓氏</label>
            <InputText id="lastName" v-model.trim="employeeForm.lastName" required="true" />
        </div>
        <div class="field">
            <label for="firstName">名字</label>
            <InputText id="firstName" v-model.trim="employeeForm.firstName" required="true" />
        </div>
        <div class="field">
            <label for="birthDate">生日 (將作為預設密碼)</label>
            <Calendar id="birthDate" v-model="employeeForm.birthDate" dateFormat="yy-mm-dd" required="true" showIcon />
        </div>
        <div class="field">
            <label for="hireDate">到職日</label>
            <Calendar id="hireDate" v-model="employeeForm.hireDate" dateFormat="yy-mm-dd" required="true" showIcon />
        </div>
        <div class="field">
            <label for="department">部門</label>
            <Dropdown id="department" v-model="employeeForm.departmentId" :options="departmentOptions" optionLabel="label" optionValue="value" placeholder="請選擇部門" required="true" />
        </div>
        <div class="field">
            <label for="title">職稱</label>
            <Dropdown id="title" v-model="employeeForm.titleId" :options="titleOptions" optionLabel="label" optionValue="value" placeholder="請選擇職稱" required="true" />
        </div>
        <div class="field">
            <label for="manager">直屬主管</label>
            <Dropdown id="manager" v-model="employeeForm.managerId" :options="managerOptions" optionLabel="label" optionValue="value" placeholder="選擇主管 (可選)" :showClear="true" />
        </div>
        <div class="field">
            <label for="role">系統角色</label>
            <Dropdown id="role" v-model="employeeForm.role" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="請選擇角色" required="true" />
        </div>

        <template #footer>
            <Button label="取消" icon="pi pi-times" text @click="dialogVisible = false" />
            <Button label="儲存" icon="pi pi-check" @click="saveEmployee" :loading="isSubmitting" />
        </template>
    </Dialog>
</template>

<style scoped>
/* 讓 Dialog 內的欄位間距更舒適 */
.p-fluid .field {
    margin-bottom: 1rem;
}
</style>
