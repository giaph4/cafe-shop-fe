<template>
    <div>
        <h1 class="h3 mb-3">Quản lý Chi phí</h1>

        <div class="row">
            <div class="col-md-12">
                <div class="card shadow-sm mb-4">
                    <div class="card-header">
                        <i class="fas fa-filter me-1"></i>
                        Bộ lọc
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label for="filterStartDate" class="form-label">Từ ngày</label>
                                <input type="date" id="filterStartDate" class="form-control"
                                    v-model="filters.startDate" />
                            </div>
                            <div class="col-md-4">
                                <label for="filterEndDate" class="form-label">Đến ngày</label>
                                <input type="date" id="filterEndDate" class="form-control" v-model="filters.endDate" />
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button class="btn btn-primary w-100" @click="applyFilters">
                                    <i class="fas fa-search me-1"></i>
                                    Lọc theo ngày
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-12">
                <div class="card shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        Danh sách chi phí
                        <button class="btn btn-success" @click="showModal(null)">
                            <i class="fas fa-plus me-1"></i>
                            Thêm mới
                        </button>
                    </div>
                    <div class="card-body">
                        <div v-if="isLoading" class="text-center my-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div v-else-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>

                        <div v-else-if="expenses.length > 0" class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th scope="col" @click="setSort('description')" class="sortable">
                                            Mô tả
                                            <i :class="getSortIcon('description')"></i>
                                        </th>
                                        <th scope="col" @click="setSort('amount')" class="sortable">
                                            Số tiền
                                            <i :class="getSortIcon('amount')"></i>
                                        </th>
                                        <th scope="col" @click="setSort('expenseDate')" class="sortable">
                                            Ngày chi
                                            <i :class="getSortIcon('expenseDate')"></i>
                                        </th>
                                        <th scope="col">Người tạo</th>
                                        <th scope="col">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="expense in expenses" :key="expense.id">
                                        <td>{{ expense.description }}</td>
                                        <td class="fw-bold">{{ formatMoney(expense.amount) }}</td>
                                        <td>{{ new Date(expense.expenseDate).toLocaleDateString() }}</td>
                                        <td>{{ expense.createdBy }}</td>
                                        <td>
                                            <button class="btn btn-sm btn-primary me-1" @click="showModal(expense)">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" @click="handleDelete(expense.id)">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <Pagination :totalPages="pagination.totalPages" :currentPage="pagination.pageNumber + 1"
                                @pageChanged="handlePageChange" />
                        </div>
                        <div v-else class="text-center text-muted">
                            Không tìm thấy chi phí nào.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" ref="expenseModalEle" tabindex="-1" aria-labelledby="expenseModalLabel"
            aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form @submit.prevent="handleSubmit">
                        <div class="modal-header">
                            <h5 class="modal-title" id="expenseModalLabel">
                                {{ isEditMode ? 'Cập nhật Chi phí' : 'Tạo mới Chi phí' }}
                            </h5>
                            <button type="button" class="btn-close" @click="hideModal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="description" class="form-label">Mô tả</label>
                                <input type="text" class="form-control" id="description" v-model="form.description"
                                    required />
                            </div>
                            <div class="mb-3">
                                <label for="amount" class="form-label">Số tiền</label>
                                <input type="number" class="form-control" id="amount" v-model.number="form.amount"
                                    required min="0" />
                            </div>
                            <div class="mb-3">
                                <label for="expenseDate" class="form-label">Ngày chi</label>
                                <input type="date" class="form-control" id="expenseDate" v-model="form.expenseDate"
                                    required />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="hideModal">Đóng</button>
                            <button type="submit" class="btn btn-primary">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import toast from 'vue3-toastify';
import { Modal } from 'bootstrap';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService.js';
import Pagination from '@/components/Pagination.vue';
import { formatMoney } from '@/utils/formatMoney.js';


const expenses = ref([]);
const isLoading = ref(false);
const error = ref(null);

const pagination = reactive({
    pageNumber: 0,
    pageSize: 10,
    totalPages: 0,
});


const sort = reactive({
    sortBy: 'expenseDate', 
    sortDir: 'desc',
});

const filters = reactive({
    startDate: '',
    endDate: '',
});

const expenseModalEle = ref(null);
let expenseModalInstance = null;
const isEditMode = ref(false);
const form = reactive({
    id: null,
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().split('T')[0],
});

const fetchExpenses = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        const params = {
            page: pagination.pageNumber,
            size: pagination.pageSize,
            sort: `${sort.sortBy},${sort.sortDir}`,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
        };
        const data = await getExpenses(params);
        expenses.value = data.content;
        pagination.totalPages = data.totalPages;
        pagination.pageNumber = data.pageable.pageNumber;
    } catch (err) {
        console.error(err);
        error.value = err.message || 'Lỗi không xác định.';
    } finally {
        isLoading.value = false;
    }
};

const applyFilters = () => {
    pagination.pageNumber = 0;
    fetchExpenses();
};

const handlePageChange = (page) => {
    pagination.pageNumber = page - 1;
};

const setSort = (field) => {
    if (sort.sortBy === field) {
        sort.sortDir = sort.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        sort.sortBy = field;
        sort.sortDir = 'asc';
    }
    fetchExpenses();
};

const handleSubmit = async () => {
    try {
        const dataToSend = {
            description: form.description,
            amount: form.amount,
            expenseDate: new Date(form.expenseDate).toISOString(),
        };

        if (isEditMode.value) {
            await updateExpense(form.id, dataToSend);
        } else {
            await createExpense(dataToSend);
        }
        hideModal();
        fetchExpenses();
    } catch (err) {
        console.error(err);
        alert(`Lỗi: ${err.message}`);
    }
};

const handleDelete = async (id) => {
    if (!confirm(`Bạn có chắc muốn xoá chi phí #${id}?`)) {
        return;
    }
    try {
        await deleteExpense(id);
        fetchExpenses(); 
    } catch (err) {
        console.error(err);
        alert(`Lỗi khi xoá: ${err.message}`);
    }
    toast.success('Xoá chi phí thành công!');
};

const showModal = (expense = null) => {
    if (expense) {
        isEditMode.value = true;
        form.id = expense.id;
        form.description = expense.description;
        form.amount = expense.amount;
        form.expenseDate = expense.expenseDate.split('T')[0];
    } else {
        isEditMode.value = false;
        form.id = null;
        form.description = '';
        form.amount = 0;
        form.expenseDate = new Date().toISOString().split('T')[0];
    }
    expenseModalInstance.show();
};

const hideModal = () => {
    expenseModalInstance.hide();
};

onMounted(() => {
    fetchExpenses();
    expenseModalInstance = new Modal(expenseModalEle.value);
});


watch(() => pagination.pageNumber, fetchExpenses);

const getSortIcon = (field) => {
    if (sort.sortBy !== field) return 'fas fa-sort';
    if (sort.sortDir === 'asc') return 'fas fa-sort-up';
    return 'fas fa-sort-down';
};

</script>

<style scoped>
.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    background-color: #f8f9fa;
}

.form-label {
    font-weight: 500;
}
</style>