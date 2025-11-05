<template>
    <div class="card">
        <Toast />
        <ConfirmDialog />

        <!-- Thanh công cụ -->
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" @click="openNew" />
            </template>

            <template #end>
                <div class="flex flex-wrap gap-2 align-items-center">
                    <Calendar v-model="dateFilters.startDate" placeholder="Từ ngày" dateFormat="dd/mm/yy" showIcon
                        class="mr-2" />
                    <Calendar v-model="dateFilters.endDate" placeholder="Đến ngày" dateFormat="dd/mm/yy" showIcon
                        class="mr-2" />
                    <Button label="Lọc" icon="pi pi-filter" @click="onFilter" />
                    <Button label="Xóa lọc" icon="pi pi-filter-slash" outlined severity="secondary"
                        @click="clearFilters" />
                </div>
            </template>
        </Toolbar>

        <!-- Bảng dữ liệu -->
        <DataTable ref="dt" :value="expenses" dataKey="id" :paginator="true" :rows="lazyParams.rows"
            :rowsPerPageOptions="[10, 15, 20, 50]" :totalRecords="totalRecords" :loading="loading" :lazy="true"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi" v-model:filters="filters"
            filterDisplay="row" :globalFilterFields="['category', 'description', 'username']" @page="onPage"
            @sort="onSort">
            <template #header>
                <div class="flex justify-content-between align-items-center">
                    <h5 class="m-0">Quản lý Chi phí</h5>
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Tìm kiếm..." />
                    </span>
                </div>
            </template>

            <Column field="id" header="ID" style="width: 5%" sortable />
            <Column field="category" header="Hạng mục" style="width: 15%" sortable filterField="category">
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Lọc theo hạng mục" />
                </template>
            </Column>
            <Column field="amount" header="Số tiền" style="width: 15%" sortable>
                <template #body="slotProps">{{ formatCurrency(slotProps.data.amount) }}</template>
            </Column>
            <Column field="expenseDate" header="Ngày chi" style="width: 15%" sortable>
                <template #body="slotProps">{{ formatDate(slotProps.data.expenseDate) }}</template>
            </Column>
            <Column field="username" header="Người tạo" style="width: 15%" sortable filterField="username">
                <template #filter="{ filterModel, filterCallback }">
                    <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Lọc theo người tạo" />
                </template>
            </Column>
            <Column field="description" header="Mô tả" style="width: 25%" />

            <Column :exportable="false" style="width: 10%">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" rounded outlined severity="info" class="mr-2"
                        @click="editExpense(slotProps.data)" />
                    <Button icon="pi pi-trash" rounded outlined severity="danger"
                        @click="confirmDeleteExpense(slotProps.data)" />
                </template>
            </Column>

            <template #empty>
                <div class="text-center">Không tìm thấy chi phí nào.</div>
            </template>
        </DataTable>

        <!-- Dialog thêm/sửa -->
        <Dialog v-model:visible="expenseDialog" :header="dialogHeader" :modal="true" :style="{ width: '450px' }">
            <div class="field">
                <label for="category">Hạng mục</label>
                <InputText id="category" v-model.trim="expense.category"
                    :class="{ 'p-invalid': submitted && !expense.category }" />
                <small v-if="submitted && !expense.category" class="p-error">Hạng mục là bắt buộc.</small>
            </div>

            <div class="field">
                <label for="amount">Số tiền</label>
                <InputNumber id="amount" v-model="expense.amount" mode="currency" currency="VND" locale="vi-VN"
                    :class="{ 'p-invalid': submitted && (!expense.amount || expense.amount <= 0) }" />
                <small v-if="submitted && (!expense.amount || expense.amount <= 0)" class="p-error">Số tiền không hợp
                    lệ.</small>
            </div>

            <div class="field">
                <label for="expenseDate">Ngày chi</label>
                <Calendar id="expenseDate" v-model="expense.expenseDate" showIcon dateFormat="dd/mm/yy"
                    :class="{ 'p-invalid': submitted && !expense.expenseDate }" />
                <small v-if="submitted && !expense.expenseDate" class="p-error">Ngày chi là bắt buộc.</small>
            </div>

            <div class="field">
                <label for="description">Mô tả</label>
                <Textarea id="description" v-model="expense.description" rows="3" />
            </div>

            <template #footer>
                <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Lưu" icon="pi pi-check" @click="saveExpense" />
            </template>
        </Dialog>

        <!-- Dialog xác nhận xóa -->
        <Dialog v-model:visible="deleteExpenseDialog" header="Xác nhận" :modal="true" :style="{ width: '450px' }">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="expense">Bạn có chắc muốn xóa <b>{{ expense.category }}</b> ({{
                    formatCurrency(expense.amount)
                    }})?</span>
            </div>
            <template #footer>
                <Button label="Không" icon="pi pi-times" text @click="deleteExpenseDialog = false" />
                <Button label="Có" icon="pi pi-check" @click="deleteConfirmed" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { toast } from 'vue3-toastify'
// import { FilterMatchMode } from 'primevue/api'
import { expenseService } from '../api/expenseService'
import { formatMoney } from '../utils/formatMoney'

// Dữ liệu bảng
const expenses = ref([])
const totalRecords = ref(0)
const loading = ref(false)

// Phân trang & sắp xếp
const lazyParams = ref({
    first: 0,
    rows: 15,
    page: 0,
    sortField: 'expenseDate',
    sortOrder: -1
})

// Bộ lọc
const dateFilters = ref({ startDate: null, endDate: null })
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.CONTAINS },
    username: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Dialog
const expenseDialog = ref(false)
const deleteExpenseDialog = ref(false)
const expense = ref({})
const submitted = ref(false)
const dialogHeader = computed(() => (expense.value.id ? 'Sửa Chi phí' : 'Thêm Chi phí'))

// Hàm load dữ liệu
const loadLazyData = async () => {
    loading.value = true
    try {
        const params = {
            page: lazyParams.value.page,
            size: lazyParams.value.rows,
            sort: `${lazyParams.value.sortField},${lazyParams.value.sortOrder === 1 ? 'asc' : 'desc'}`,
            startDate: formatDateForAPI(dateFilters.value.startDate),
            endDate: formatDateForAPI(dateFilters.value.endDate)
        }
        const response = await expenseService.getAll(params)
        expenses.value = response.data.content
        totalRecords.value = response.data.totalElements
    } catch (error) {
        toast.error('Không thể tải danh sách chi phí')
    } finally {
        loading.value = false
    }
}

const onPage = (e) => {
    lazyParams.value.page = e.page
    lazyParams.value.rows = e.rows
    loadLazyData()
}

const onSort = (e) => {
    lazyParams.value.sortField = e.sortField
    lazyParams.value.sortOrder = e.sortOrder
    loadLazyData()
}

const onFilter = () => {
    lazyParams.value.page = 0
    loadLazyData()
}

const clearFilters = () => {
    dateFilters.value.startDate = null
    dateFilters.value.endDate = null
    onFilter()
}

// Dialog
const openNew = () => {
    expense.value = { expenseDate: new Date() }
    submitted.value = false
    expenseDialog.value = true
}

const editExpense = (data) => {
    expense.value = { ...data, expenseDate: new Date(data.expenseDate) }
    expenseDialog.value = true
}

const hideDialog = () => {
    expenseDialog.value = false
    submitted.value = false
}

// Lưu
const saveExpense = async () => {
    submitted.value = true
    if (!expense.value.category || !expense.value.amount || expense.value.amount <= 0 || !expense.value.expenseDate) {
        toast.warning('Vui lòng nhập đủ thông tin hợp lệ')
        return
    }

    try {
        const payload = {
            id: expense.value.id || null,
            category: expense.value.category,
            amount: expense.value.amount,
            description: expense.value.description,
            expenseDate: formatDateForAPI(expense.value.expenseDate)
        }

        if (expense.value.id) {
            await expenseService.update(expense.value.id, payload)
            toast.success('Cập nhật thành công')
        } else {
            await expenseService.create(payload)
            toast.success('Thêm mới thành công')
        }

        expenseDialog.value = false
        loadLazyData()
    } catch (error) {
        toast.error('Không thể lưu chi phí')
    }
}

// Xóa
const confirmDeleteExpense = (data) => {
    expense.value = data
    deleteExpenseDialog.value = true
}

const deleteConfirmed = async () => {
    try {
        await expenseService.deleteExpense(expense.value.id)
        toast.success('Xóa thành công')
        loadLazyData()
    } catch (error) {
        toast.error('Không thể xóa chi phí')
    } finally {
        deleteExpenseDialog.value = false
    }
}

// Format
const formatDate = (val) => {
    if (!val) return ''
    const d = new Date(val)
    return d.toLocaleDateString('vi-VN')
}

const formatDateForAPI = (date) => {
    if (!date) return null
    const d = new Date(date)
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const formatCurrency = (val) => formatMoney(val)

onMounted(loadLazyData)
</script>

<style scoped>
.p-toolbar-group-end .p-button,
.p-toolbar-group-end .p-calendar {
    margin-left: 0.5rem;
}

.p-fluid .p-column-filter {
    width: 100%;
}
</style>