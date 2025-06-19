<script setup>
import { extraWorkDays, publicHolidays } from '@/data/Holidays';
import { LeaveApplicationService } from '@/service/LeaveApplicationService';
import { ProductService } from '@/service/ProductService';
import { formatDate } from '@/utilities/LeaveDayHelper';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

onMounted(async () => {
    ProductService.getProducts().then((data) => (products.value = data));
    //載入員工的請假申請列表
    leaveList.value = await LeaveApplicationService.getLeaveSummary();
});

const toast = useToast();
const dt = ref();
const products = ref();
const applicationRequest = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const leaveTypes = ref([]);
const loadingLeaveTypes = ref(false);
const submitting = ref(false);
const leaveList = ref([]);

// 表單資料
const form = ref({
    leaveTypeId: null,
    description: null,
    leaveDay: 0,
    leaveStart: null,
    leaveEnd: null,
    statusId: 3
});
const submitted = ref(false);

// 當 Dialog 打開時 (值從 false 變為 true)，才去載入假別資料
watch(applicationRequest, (newValue) => {
    if (newValue === true) {
        fetchLeaveTypes();
    }
});

const totalLeaveDays = computed(() => {
    const start = form.value.leaveStart;
    const end = form.value.leaveEnd;

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
    const current = new Date(form.value.leaveStart);
    current.setHours(0, 0, 0, 0);

    const endDate = new Date(form.value.leaveEnd);
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
    submitting.value = true;
    try {
        // 將計算好的總天數賦值給表單
        form.value.leaveDay = totalLeaveDays.value;
        await LeaveApplicationService.submitLeaveApplication(form.value);
        toast.add({ severity: 'success', summary: '成功', detail: '請假申請已送出', life: 3000 });
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
        leaveStart: null,
        leaveEnd: null,
        leaveDay: 0,
        statusId: 3
    };
    applicationRequest.value = true;
};

function formatCurrency(value) {
    if (value) return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return;
}

function openNew() {
    product.value = {};
    submitted.value = false;
    applicationRequest.value = true;
}

function hideDialog() {
    applicationRequest.value = false;
    submitted.value = false;
}

function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        if (product.value.id) {
            product.value.inventoryStatus = product.value.inventoryStatus.value ? product.value.inventoryStatus.value : product.value.inventoryStatus;
            products.value[findIndexById(product.value.id)] = product.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            product.value.id = createId();
            product.value.code = createId();
            product.value.image = 'product-placeholder.svg';
            product.value.inventoryStatus = product.value.inventoryStatus ? product.value.inventoryStatus.value : 'INSTOCK';
            products.value.push(product.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }

        applicationRequest.value = false;
        product.value = {};
    }
}

function editProduct(prod) {
    product.value = { ...prod };
    applicationRequest.value = true;
}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}

function deleteProduct() {
    products.value = products.value.filter((val) => val.id !== product.value.id);
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < products.value.length; i++) {
        if (products.value[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
    products.value = products.value.filter((val) => !selectedProducts.value.includes(val));
    deleteProductsDialog.value = false;
    selectedProducts.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNewApplication" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
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
                <Column field="leaveStart" header="開始日期" sortable>
                    <template #body="slotProps">
                        {{ slotProps.data.leaveStart }}
                    </template>
                </Column>
                <Column field="leaveEnd" header="結束日期" sortable>
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
                    <DatePicker id="leaveStartDate" v-model="form.leaveStart" dateFormat="yy-mm-dd" :showIcon="true" :maxDate="form.leaveEnd" :manualInput="false" placeholder="請選擇日期" class="w-full" />
                </div>
                <div>
                    <label for="leaveEndDate" class="block font-bold mb-3">結束日期</label>
                    <DatePicker id="leaveEndDate" v-model="form.leaveEnd" dateFormat="yy-mm-dd" :showIcon="true" :minDate="form.leaveStart" :manualInput="false" placeholder="請選擇日期" class="w-full" />
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

        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product"
                    >Are you sure you want to delete <b>{{ product.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
            </template>
        </Dialog>
    </div>
</template>
