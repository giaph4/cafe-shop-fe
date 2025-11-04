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
                  <input type="date" id="filterStartDate" class="form-control" v-model="filters.startDate" />
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
  
                <Pagination
                  :totalPages="pagination.totalPages"
                  :currentPage="pagination.pageNumber + 1"
                  @page-changed="handlePageChange" 
                />
              </div>
              
              <div v-if="!isLoading && expenses.length === 0" class="text-center text-muted">
                Không tìm thấy chi phí nào.
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div class="modal fade" ref="expenseModalEle" tabindex="-1" aria-labelledby="expenseModalLabel" aria-hidden="true">
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
                  <input type="text" class="form-control" id="description" v-model="form.description" required />
                </div>
                <div class="mb-3">
                  <label for="amount" class="form-label">Số tiền</label>
                  <input type="number" class="form-control" id="amount" v-model.number="form.amount" required min="0.01" step="any" />
                </div>
                <div class="mb-3">
                  <label for="expenseDate" class="form-label">Ngày chi</label>
                  <input type="date" class="form-control" id="expenseDate" v-model="form.expenseDate" required />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="hideModal">Đóng</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, watch } from 'vue';
  import { Modal } from 'bootstrap';
  import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/expenseService.js';
  import Pagination from '@/components/Pagination.vue';
  import { formatMoney } from '@/utils/formatMoney.js';
  import { useToast } from '@/utils/toast.js'; // Đảm bảo bạn đã tạo file này
  
  // State
  const expenses = ref([]);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const { toast } = useToast(); 
  
  // Pagination
  const pagination = reactive({
    pageNumber: 0,
    pageSize: 10,
    totalPages: 0,
  });
  
  // Sorting
  const sort = reactive({
    sortBy: 'expenseDate',
    sortDir: 'desc',
  });
  
  // Filtering
  const filters = reactive({
    startDate: '',
    endDate: '',
  });
  
  // Modal State
  const expenseModalEle = ref(null);
  let expenseModalInstance = null;
  const isEditMode = ref(false);
  const form = reactive({
    id: null,
    description: '',
    amount: null, // Bắt đầu bằng null để validation dễ hơn
    expenseDate: new Date().toISOString().split('T')[0],
  });
  
  // --- API Functions ---
  const fetchExpenses = async () => {
    isLoading.value = true;
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
      toast.show(err.message, 'error');
    } finally {
      isLoading.value = false;
    }
  };
  
  // --- Handlers ---
  const applyFilters = () => {
    pagination.pageNumber = 0; 
    fetchExpenses();
  };
  
  /**
   * SỬA LỖI PHÂN TRANG:
   * 1. Cập nhật state (pagination.pageNumber)
   * 2. Gọi lại fetchExpenses() ngay lập tức
   */
  const handlePageChange = (page) => {
    pagination.pageNumber = page - 1; // Cập nhật state
    fetchExpenses(); // Gọi tải dữ liệu cho trang mới
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
    // SỬA LỖI 400 (Validation): Kiểm tra amount chặt chẽ
    if (!form.description || !form.amount || form.amount <= 0 || !form.expenseDate) {
      toast.show("Vui lòng điền đầy đủ thông tin. Số tiền phải lớn hơn 0.", 'error');
      return;
    }
    
    isSubmitting.value = true;
    try {
      const dataToSend = {
        description: form.description,
        amount: form.amount,
        // SỬA LỖI 400 (Date Timezone):
        // Luôn gửi ngày dưới dạng UTC, lúc 00:00:00Z
        expenseDate: `${form.expenseDate}T00:00:00Z`,
      };
  
      if (isEditMode.value) {
        await updateExpense(form.id, dataToSend); [cite_start]// API [cite: 449-451]
        toast.show('Cập nhật chi phí thành công!');
      } else {
        await createExpense(dataToSend); [cite_start]// API [cite: 395-397]
        toast.show('Tạo mới chi phí thành công!');
      }
      hideModal();
      fetchExpenses(); // Tải lại dữ liệu
    } catch (err) {
      console.error(err);
      toast.show(err.message, 'error');
    } finally {
      isSubmitting.value = false;
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm(`Bạn có chắc muốn xoá chi phí #${id}?`)) {
      return;
    }
    try {
      await deleteExpense(id); [cite_start]// API [cite: 471-473]
      toast.show(`Đã xoá chi phí #${id} thành công.`);
      fetchExpenses(); 
    } catch (err) {
      console.error(err);
      toast.show(err.message, 'error');
    }
  };
  
  // --- Modal Controls ---
  const showModal = (expense = null) => {
    if (expense) {
      // Chế độ Sửa
      isEditMode.value = true;
      form.id = expense.id;
      form.description = expense.description;
      form.amount = expense.amount;
      // SỬA LỖI 400 (Date): Đảm bảo chỉ lấy phần YYYY-MM-DD
      form.expenseDate = expense.expenseDate.split('T')[0]; 
    } else {
      // Chế độ Thêm mới
      isEditMode.value = false;
      form.id = null;
      form.description = '';
      form.amount = null; // Reset về null
      form.expenseDate = new Date().toISOString().split('T')[0];
    }
    expenseModalInstance.show();
  };
  
  const hideModal = () => {
    expenseModalInstance.hide();
  };
  
  onMounted(() => {
    fetchExpenses();
    if (expenseModalEle.value) {
      expenseModalInstance = new Modal(expenseModalEle.value);
    }
  });
  
  /**
   * SỬA LỖI PHÂN TRANG:
   * Bỏ hàm watch() đi, vì chúng ta đã gọi fetchExpenses()
   * trực tiếp bên trong handlePageChange().
   */
  // watch(() => pagination.pageNumber, fetchExpenses); // <- Xoá hoặc comment dòng này
  
  // --- Helpers ---
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