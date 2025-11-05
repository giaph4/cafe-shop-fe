<template>
    <div class="card">
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar: Chứa các nút chức năng và bộ lọc -->
        <Toolbar class="mb-4">
            <template #start>
                <div class="flex flex-wrap gap-2">
                    <Button label="Thêm mới" icon="pi pi-plus" severity="success" @click="openNew" />
                </div>
            </template>

            <template #end>
                <div class="flex flex-wrap gap-2 align-items-center">
                    <!-- Bộ lọc theo ngày -->
                    <Calendar v-model="dateFilters.startDate" placeholder="Từ ngày" dateFormat="dd/mm/yy" showIcon
                        class="mr-2" />
                    <Calendar v-model="dateFilters.endDate" placeholder="Đến ngày" dateFormat="dd/mm/yy" showIcon
                        class="mr-2" />
                    <Button label="Lọc" icon="pi pi-filter" @click="onFilter" />
                    <Button label="Xóa lọc" icon="pi pi-filter-slash" outlined severity="secondary"
                        @click="clearFilters" class="ml-2" />
                </div>
            </template>
        </Toolbar>

        <!-- Bảng dữ liệu (DataTable) -->
        <DataTable ref="dt" :value="expenses" dataKey="id" :paginator="true" :rows="lazyParams.rows"
            :rowsPerPageOptions="[10, 15, 20, 50]" :totalRecords="totalRecords" :loading="loading" :lazy="true"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi" v-model:filters="filters"
            filterDisplay="row" :globalFilterFields="['category', 'description', 'username']" @page="onPage($event)"
            @sort="onSort($event)">
            <template #header>
                <div class="flex justify-content-between align-items-center">
                    <h5 class="m-0">Quản lý Chi phí</h5>
                    <!-- Bộ lọc global (tìm kiếm client-side) -->
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value"
                            placeholder="Tìm kiếm theo hạng mục, mô tả, người tạo..." />
                    </span>
                </div>
            </template>

            <Column field="id" header="ID" sortable style="width: 5%"></Column>
            <Column field="category" header="Hạng mục" sortable filterField="category" style="width: 15%">
                <!-- Filter cho cột Hạng mục (client-side) -->
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter"
                        placeholder="Lọc theo hạng mục" />
                </template>
            </Column>
            <Column field="amount" header="Số tiền" sortable style="width: 15%">
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.amount) }}
                </template>
            </Column>
            <Column field="expenseDate" header="Ngày chi" sortable style="width: 15%">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.expenseDate) }}
                </template>
            </Column>
            <Column field="username" header="Người tạo" sortable filterField="username" style="width: 15%">
                <!-- Filter cho cột Người tạo (client-side) -->
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter"
                        placeholder="Lọc theo người tạo" />
                </template>
            </Column>
            <Column field="description" header="Mô tả" style="width: 25%"></Column>

            <!-- Cột Hành động -->
            <Column :exportable="false" style="width: 10%">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2"
                        @click="editExpense(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger"
                        @click="confirmDeleteExpense(slotProps.data)" />
                </template>
            </Column>

            <template #empty>
                <div class="text-center">Không tìm thấy chi phí nào.</div>
            </template>
        </DataTable>

        <!-- Dialog (Modal) cho Thêm mới/Chỉnh sửa Chi phí -->
        <Dialog v-model:visible="expenseDialog" :style="{ width: '450px' }" :header="dialogHeader" :modal="true"
            class="p-fluid">

            <!-- Hạng mục -->
            <div class="field">
                <label for="category">Hạng mục chi phí</label>
                <InputText id="category" v-model.trim="expense.category" required="true" autofocus
                    :class="{ 'p-invalid': submitted && !expense.category }" />
                <small class="p-error" v-if="submitted && !expense.category">Hạng mục là bắt buộc.</small>
            </div>

            <!-- Số tiền -->
            <div class="field">
                <label for="amount">Số tiền</label>
                <InputNumber id="amount" v-model="expense.amount" mode="currency" currency="VND" locale="vi-VN"
                    required="true" :class="{ 'p-invalid': submitted && (!expense.amount || expense.amount <= 0) }" />
                <small class="p-error" v-if="submitted && (!expense.amount || expense.amount <= 0)">Số tiền là bắt buộc
                    và phải
                    lớn hơn 0.</small>
            </div>

            <!-- Ngày chi -->
            <div class="field">
                <label for="expenseDate">Ngày chi</label>
                <Calendar id="expenseDate" v-model="expense.expenseDate" dateFormat="dd/mm/yy" showIcon required="true"
                    :class="{ 'p-invalid': submitted && !expense.expenseDate }" />
                <small class="p-error" v-if="submitted && !expense.expenseDate">Ngày chi là bắt buộc.</small>
            </div>

            <!-- Mô tả -->
            <div class="field">
                <label for="description">Mô tả</label>
                <Textarea id="description" v-model="expense.description" rows="3" cols="20" />
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveExpense" />
            </template>
        </Dialog>

        <!-- Dialog Xác nhận Xóa -->
        <Dialog v-model:visible="deleteExpenseDialog" :style="{ width: '450px' }" header="Xác nhận" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="expense">Bạn có chắc chắn muốn xóa chi phí <b>{{ expense.category }}</b> ({{
                    formatCurrency(expense.amount) }}) không?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteExpenseDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteConfirmed" />
            </template>
        </Dialog>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { Form, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { expenseService } from '../api/expenseService';
import { formatMoney } from '../utils/formatMoney';



// --- State cho Dữ liệu Bảng ---
const expenses = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const dt = ref(); // Template ref cho DataTable

// --- State cho Phân trang & Sắp xếp (Lazy Loading) ---
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0,
    sortField: 'expenseDate', // Sắp xếp mặc định
    sortOrder: -1, // -1 là DESC, 1 là ASC
});

// --- State cho Lọc (Filters) ---
const dateFilters = ref({
    startDate: null,
    endDate: null,
});
// Bộ lọc client-side
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.CONTAINS },
    username: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// --- State cho Dialog (Modal) ---
const expenseDialog = ref(false);
const deleteExpenseDialog = ref(false);
const expense = ref({});
const submitted = ref(false);
const dialogHeader = computed(() => (expense.value.id ? 'Sửa Chi phí' : 'Thêm mới Chi phí'));

// --- Hàm xử lý Dữ liệu ---

/**
 * Tải dữ liệu theo các tham số lazy (page, sort, filter)
 */
const loadLazyData = async () => {
    loading.value = true;
    try {
        // Chuẩn bị params cho API
        const params = {
            page: lazyParams.value.page,
            size: lazyParams.value.rows,
            // Backend dùng "field,direction"
            sort: `${lazyParams.value.sortField},${lazyParams.value.sortOrder === 1 ? 'asc' : 'desc'}`,
            startDate: dateFilters.value.startDate ? formatDateForAPI(dateFilters.value.startDate) : null,
            endDate: dateFilters.value.endDate ? formatDateForAPI(dateFilters.value.endDate) : null,
        };

        // Loại bỏ các param null
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        const response = await expenseService.getAll(params);

        expenses.value = response.data.content;
        totalRecords.value = response.data.totalElements;

    } catch (error) {
        console.error("Lỗi khi tải danh sách chi phí:", error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách chi phí', life: 3000 });
    } finally {
        loading.value = false;
    }
};

/**
 * Xử lý sự kiện chuyển trang
 */
const onPage = (event) => {
    lazyParams.value.page = event.page;
    lazyParams.value.rows = event.rows;
    loadLazyData();
};

/**
 * Xử lý sự kiện sắp xếp
 */
const onSort = (event) => {
    lazyParams.value.sortField = event.sortField;
    lazyParams.value.sortOrder = event.sortOrder;
    loadLazyData();
};

/**
 * Xử lý sự kiện lọc (khi nhấn nút Lọc theo ngày)
 */
const onFilter = () => {
    // Reset về trang đầu tiên khi lọc
    lazyParams.value.page = 0;
    lazyParams.value.first = 0;
    loadLazyData();
};

/**
 * Xóa bộ lọc ngày và tải lại
 */
const clearFilters = () => {
    dateFilters.value.startDate = null;
    dateFilters.value.endDate = null;
    onFilter(); // Tải lại dữ liệu
}

// --- Hàm xử lý Dialog (Modal) ---

/**
 * Mở dialog thêm mới
 */
const openNew = () => {
    expense.value = {
        expenseDate: new Date() // Mặc định là ngày hôm nay
    };
    submitted.value = false;
    expenseDialog.value = true;
};

/**
 * Mở dialog chỉnh sửa
 */
const editExpense = (prod) => {
    expense.value = {
        ...prod,
        // Chuyển đổi chuỗi ngày (YYYY-MM-DD) về đối tượng Date cho Calendar
        expenseDate: new Date(prod.expenseDate)
    };
    expenseDialog.value = true;
};

/**
 * Đóng dialog
 */
const hideDialog = () => {
    expenseDialog.value = false;
    submitted.value = false;
};

/**
 * Lưu (Tạo mới hoặc Cập nhật)
 */
const saveExpense = async () => {
    submitted.value = true;

    // --- Validation ---
    if (!expense.value.category || !expense.value.amount || expense.value.amount <= 0 || !expense.value.expenseDate) {
        toast.add({ severity: 'warn', summary: 'Chưa hợp lệ', detail: 'Vui lòng điền đầy đủ thông tin bắt buộc', life: 3000 });
        return;
    }

    try {
        // Chuẩn bị DTO để gửi đi
        const payload = {
            id: expense.value.id || null,
            category: expense.value.category,
            amount: expense.value.amount,
            description: expense.value.description,
            // Chuyển đổi Date object sang chuỗi YYYY-MM-DD cho backend
            expenseDate: formatDateForAPI(expense.value.expenseDate)
        };

        if (expense.value.id) {
            // Cập nhật
            const updatedExpense = await expenseService.update(expense.value.id, payload);
            // Cập nhật lại bản ghi trong mảng `expenses`
            const index = expenses.value.findIndex(e => e.id === updatedExpense.data.id);
            if (index !== -1) {
                expenses.value[index] = updatedExpense.data;
            }
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật chi phí', life: 3000 });
        } else {
            // Tạo mới
            await expenseService.create(payload);
            toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo mới chi phí', life: 3000 });
            // Tải lại toàn bộ dữ liệu (vì có thể ảnh hưởng đến phân trang)
            await loadLazyData();
        }

        expenseDialog.value = false;
        expense.value = {};

    } catch (error) {
        console.error("Lỗi khi lưu chi phí:", error);
        toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể lưu chi phí', life: 3000 });
    }
};


// --- Hàm xử lý Xóa ---

/**
 * Mở dialog xác nhận xóa
 */
const confirmDeleteExpense = (prod) => {
    expense.value = prod;
    deleteExpenseDialog.value = true;
};

/**
 * Xác nhận xóa
 */
const deleteConfirmed = async () => {
    try {
        await expenseService.deleteExpense(expense.value.id);

        // Tải lại dữ liệu
        await loadLazyData();

        deleteExpenseDialog.value = false;
        expense.value = {};
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa chi phí', life: 3000 });
    } catch (error) {
        console.error("Lỗi khi xóa chi phí:", error);
        // Kiểm tra nếu lỗi 403 (Forbidden) - do BE chỉ cho ADMIN xóa
        if (error.response && error.response.status === 403) {
            toast.add({ severity: 'error', summary: 'Từ chối', detail: 'Bạn không có quyền xóa chi phí này.', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa chi phí', life: 3000 });
        }
        deleteExpenseDialog.value = false;
    }
};

// --- Helpers ---

/**
 * Định dạng ngày (YYYY-MM-DD) sang (DD/MM/YYYY)
 */
const formatDate = (value) => {
    if (!value) return '';
    try {
        const date = new Date(value);
        // Kiểm tra nếu ngày hợp lệ
        if (isNaN(date.getTime())) {
            return value; // Trả về giá trị gốc nếu không phải ngày
        }
        return date.toLocaleDateString('vi-VN');
    } catch (e) {
        return value; // Trả về giá trị gốc nếu lỗi
    }
};

/**
 * Định dạng Date object hoặc chuỗi ngày sang 'YYYY-MM-DD' cho API
 */
const formatDateForAPI = (date) => {
    if (!date) return null;
    let d;
    if (typeof date === 'string') {
        d = new Date(date);
    } else {
        d = date; // Giả sử là Date object
    }

    if (isNaN(d.getTime())) {
        return null;
    }

    // Lấy thông tin ngày tháng năm theo giờ địa phương
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Wrapper cho hàm formatMoney đã import
 */
const formatCurrency = (value) => {
    return formatMoney(value);
};


// --- Lifecycle Hooks ---
onMounted(() => {
    // Lần tải đầu tiên
    lazyParams.value.first = 0;
    lazyParams.value.page = 0;
    loadLazyData();
});
</script>

<style lang="scss" scoped>
/* Thêm một số style nhỏ để đồng bộ giao diện */
.p-toolbar-group-end .p-button,
.p-toolbar-group-end .p-calendar {
    margin-left: 0.5rem;
}

/* Đảm bảo filter của datatable hiển thị đẹp */
.p-fluid .p-column-filter {
    width: 100%;
}
</style>
