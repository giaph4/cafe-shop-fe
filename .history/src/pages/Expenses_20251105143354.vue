<template>
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Danh sách chi phí</h3>
        <button class="btn btn-primary" @click="openAddModal">+ Thêm chi phí</button>
      </div>
  
      <div class="card shadow-sm">
        <div class="card-body p-0">
          <table class="table table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width: 60px;">#</th>
                <th>Tên chi phí</th>
                <th class="text-end">Số tiền</th>
                <th class="text-center">Ngày chi</th>
                <th class="text-center" style="width: 150px;">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageData || pageData.content.length === 0">
                <td colspan="5" class="text-center py-3">Không có dữ liệu</td>
              </tr>
              <tr v-for="(item, index) in pageData?.content" :key="item.id">
                <td class="text-center">
                  {{ (filters.page - 1) * filters.limit + index + 1 }}
                </td>
                <td>{{ item.tenChiPhi }}</td>
                <td class="text-end">{{ formatCurrency(item.soTien) }}</td>
                <td class="text-center">{{ item.ngayChi }}</td>
                <td class="text-center">
                  <button class="btn btn-sm btn-outline-warning me-2" @click="openEditModal(item)">
                    Sửa
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteExpense(item.id)">
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- Pagination -->
      <Pagination
        v-if="pageData"
        :current-page="filters.page"
        :total-pages="pageData.totalPages"
        @page-change="onPageChange"
      />
  
      <!-- Modal thêm/sửa -->
      <div class="modal fade" id="expenseModal" tabindex="-1" aria-hidden="true" ref="modalRef">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Cập nhật chi phí' : 'Thêm chi phí' }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveExpense">
                <div class="mb-3">
                  <label class="form-label">Tên chi phí</label>
                  <input v-model="form.tenChiPhi" type="text" class="form-control" required />
                </div>
  
                <div class="mb-3">
                  <label class="form-label">Số tiền</label>
                  <input v-model.number="form.soTien" type="number" class="form-control" required />
                </div>
  
                <div class="mb-3">
                  <label class="form-label">Ngày chi</label>
                  <input v-model="form.ngayChi" type="date" class="form-control" required />
                </div>
  
                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">
                    Hủy
                  </button>
                  <button type="submit" class="btn btn-primary">
                    {{ isEditing ? 'Lưu thay đổi' : 'Thêm mới' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import Pagination from '@/components/Pagination.vue'
  import axios from 'axios'
  import { Modal } from 'bootstrap'
  
  const filters = ref({
    page: 1,
    limit: 5,
  })
  
  const pageData = ref(null)
  const modalRef = ref(null)
  let modalInstance = null
  
  const form = ref({
    id: null,
    tenChiPhi: '',
    soTien: '',
    ngayChi: '',
  })
  
  const isEditing = ref(false)
  
  // Gọi API
  const fetchData = async () => {
    const res = await axios.get('http://localhost:8080/api/chi-phi', {
      params: {
        page: filters.value.page - 1,
        size: filters.value.limit,
      },
    })
    pageData.value = res.data
  }
  
  // Thêm hoặc sửa chi phí
  const saveExpense = async () => {
    if (isEditing.value) {
      await axios.put(`http://localhost:8080/api/chi-phi/${form.value.id}`, form.value)
    } else {
      await axios.post('http://localhost:8080/api/chi-phi', form.value)
    }
    modalInstance.hide()
    fetchData()
  }
  
  // Xóa chi phí
  const deleteExpense = async (id) => {
    if (confirm('Bạn có chắc muốn xóa chi phí này không?')) {
      await axios.delete(`http://localhost:8080/api/chi-phi/${id}`)
      fetchData()
    }
  }
  
  // Mở modal thêm mới
  const openAddModal = () => {
    form.value = { id: null, tenChiPhi: '', soTien: '', ngayChi: '' }
    isEditing.value = false
    modalInstance.show()
  }
  
  // Mở modal chỉnh sửa
  const openEditModal = (item) => {
    form.value = { ...item }
    isEditing.value = true
    modalInstance.show()
  }
  
  // Khi đổi trang
  const onPageChange = (page) => {
    filters.value.page = page
    fetchData()
  }
  
  // Định dạng tiền
  const formatCurrency = (val) => {
    return val.toLocaleString('vi-VN') + ' đ'
  }
  
  onMounted(() => {
    fetchData()
    modalInstance = new Modal(modalRef.value)
  })
  </script>
  
  <style scoped>
  .table th,
  .table td {
    vertical-align: middle;
  }
  
  .btn {
    min-width: 80px;
  }
  </style>
  