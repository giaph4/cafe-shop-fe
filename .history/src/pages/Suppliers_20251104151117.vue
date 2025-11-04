<template>
    <div class="modal fade" id="supplierModal" tabindex="-1" ref="modalElement">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Cập nhật Nhà cung cấp' : 'Tạo mới Nhà cung cấp' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          
          <Form @submit="handleSubmit" :validation-schema="supplierSchema" v-slot="{ errors }">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Tên nhà cung cấp <span class="text-danger">*</span></label>
                  <Field name="name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }" v-model="formData.name" />
                  <ErrorMessage name="name" class="invalid-feedback" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Người liên hệ</label>
                  <Field name="contactPerson" type="text" class="form-control" v-model="formData.contactPerson" />
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Số điện thoại <span class="text-danger">*</span></label>
                  <Field name="phone" type="text" class="form-control" :class="{ 'is-invalid': errors.phone }" v-model="formData.phone" />
                  <ErrorMessage name="phone" class="invalid-feedback" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Email</label>
                  <Field name="email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }" v-model="formData.email" />
                  <ErrorMessage name="email" class="invalid-feedback" />
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label fw-bold">Địa chỉ</label>
                <Field name="address" as="textarea" rows="3" class="form-control" v-model="formData.address" />
              </div>
  
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Huỷ</button>
              <button type="submit" class="btn btn-primary" :disabled="createMutation.isPending.value || updateMutation.isPending.value">
                Lưu
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  
    <div data-aos="fade-up">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <h2 class="page-title">Quản lý Nhà cung cấp</h2>
        <button class="btn btn-primary" @click="openModal()">
          <i class="bi bi-plus-lg me-2"></i> Thêm mới
        </button>
      </div>
  
      <div class="card mb-4">
        <div class="card-body">
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Tìm kiếm theo tên, SĐT, email..."
              v-model="searchQuery"
            >
          </div>
        </div>
      </div>
  
      <div class="card">
        <div class="card-body">
          
          <div v-if="isLoading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
          <div v-else-if="isError" class="alert alert-danger">
            Không thể tải dữ liệu: {{ error.message }}
          </div>
  
          <div v-else-if="suppliers" class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col">Tên Nhà cung cấp</th>
                  <th scope="col">Người liên hệ</th>
                  <th scope="col">Điện thoại</th>
                  <th scope="col">Email</th>
                  <th scope="col">Địa chỉ</th>
                  <th scope="col" class="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="supplier in filteredSuppliers" :key="supplier.id">
                  <td class="fw-bold">{{ supplier.name }}</td>
                  <td>{{ supplier.contactPerson || 'N/A' }}</td>
                  <td>{{ supplier.phone }}</td>
                  <td>{{ supplier.email || 'N/A' }}</td>
                  <td>{{ supplier.address || 'N/A' }}</td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openModal(supplier)">
                      <i class="bi bi-pencil-fill"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(supplier)">
                      <i class="bi bi-trash-fill"></i> Xoá
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredSuppliers.length === 0">
                  <td colspan="6" class="text-center text-muted">Không tìm thấy nhà cung cấp nào.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
  import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
  import { Modal } from 'bootstrap'
  import { Form, Field, ErrorMessage } from 'vee-validate'
  import * as yup from 'yup'
  import { toast } from 'vue3-toastify'
  import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplierService'
  
  const queryClient = useQueryClient()
  const modalElement = ref(null)
  const bsModal = ref(null)
  const isEditing = ref(false)
  const searchQuery = ref('')
  
  const initialFormData = {
    id: null,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  }
  const formData = reactive({ ...initialFormData })
  
  const phoneRegex = /^(0\d{9})$/ // Regex đơn giản cho SĐT Việt Nam (10 số, bắt đầu bằng 0)
  const supplierSchema = yup.object({
    name: yup.string().required('Tên nhà cung cấp là bắt buộc'),
    contactPerson: yup.string().nullable(),
    phone: yup.string()
      .required('Số điện thoại là bắt buộc')
      .matches(phoneRegex, 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 0)'),
    email: yup.string().email('Email không hợp lệ').nullable(),
    address: yup.string().nullable(),
  })
  
  const { data: suppliers, isLoading, isError, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  })
  
  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      toast.success('Tạo nhà cung cấp thành công!')
      queryClient.invalidateQueries(['suppliers'])
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
  })
  
  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      toast.success('Cập nhật nhà cung cấp thành công!')
      queryClient.invalidateQueries(['suppliers'])
      closeModal()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success('Xoá nhà cung cấp thành công!')
      queryClient.invalidateQueries(['suppliers'])
    },
    onError: (err) => {
      // Bắt lỗi nghiệp vụ (API 34)
      toast.error(err.response?.data?.message || 'Không thể xoá nhà cung cấp này.')
    }
  })
  
  // Lọc/Tìm kiếm phía Client
  const filteredSuppliers = computed(() => {
    if (!suppliers.value) return []
    if (!searchQuery.value) return suppliers.value
    
    const lowerCaseQuery = searchQuery.value.toLowerCase()
    return suppliers.value.filter(
      supplier =>
        supplier.name.toLowerCase().includes(lowerCaseQuery) ||
        supplier.phone.toLowerCase().includes(lowerCaseQuery) ||
        (supplier.email && supplier.email.toLowerCase().includes(lowerCaseQuery)) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(lowerCaseQuery))
    )
  })
  
  onMounted(() => {
    if (modalElement.value) {
      bsModal.value = new Modal(modalElement.value)
    }
  })
  
  onUnmounted(() => {
    bsModal.value?.dispose()
  })
  
  const openModal = (supplier = null) => {
    if (supplier) {
      isEditing.value = true
      Object.assign(formData, supplier)
    } else {
      isEditing.value = false
      Object.assign(formData, initialFormData)
    }
    bsModal.value?.show()
  }
  
  const closeModal = () => {
    bsModal.value?.hide()
  }
  
  const handleSubmit = (values) => {
    const payload = { ...values }
    
    if (isEditing.value) {
      updateMutation.mutate({ id: formData.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }
  
  const handleDelete = (supplier) => {
    if (confirm(`Bạn có chắc chắn muốn xoá nhà cung cấp "${supplier.name}"?`)) {
      deleteMutation.mutate(supplier.id)
    }
  }
  </script>
  
  <style scoped>
  .page-title {
    color: #A36B4A;
  }
  .table-hover tbody tr:hover {
    background-color: #fdfaf7;
  }
  </style>