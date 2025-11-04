<template>
    <PurchaseOrderDetailModal 
      :order-id="selectedOrderId"
      @close="selectedOrderId = null"
    />
  
    <div data-aos="fade-up">
      <div class="page-header d-flex justify-content-between align-items-center mb-4">
        <h2 class="page-title">Quản lý Nhập hàng</h2>
        <router-link to="/purchase-orders/new" class="btn btn-primary">
          <i class="bi bi-plus-lg me-2"></i> Tạo đơn nhập hàng
        </router-link>
      </div>
  
      <div class="card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <label class="form-label">Lọc theo trạng thái</label>
              <select class="form-select" v-model="statusFilter">
                <option value="">Tất cả</option>
                <option value="PENDING">Đang chờ (Pending)</option>
                <option value="COMPLETED">Hoàn thành (Completed)</option>
                <option value="CANCELLED">Đã huỷ (Cancelled)</option>
              </select>
            </div>
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
  
          <div v-else-if="data" class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nhà cung cấp</th>
                  <th scope="col">Người tạo</th>
                  <th scope="col">Ngày đặt</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" class="text-end">Tổng tiền</th>
                  <th scope="col" class="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredData" :key="order.id">
                  <td class="fw-bold">#{{ order.id }}</td>
                  <td>{{ order.supplierName }}</td>
                  <td>{{ order.userName }}</td>
                  <td>{{ new Date(order.orderDate).toLocaleDateString('vi-VN') }}</td>
                  <td>
                    <span class="badge" :class="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="text-end fw-bold">{{ formatMoney(order.totalAmount) }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-info" @click="selectedOrderId = order.id" title="Xem chi tiết">
                      <i class="bi bi-eye-fill"></i>
                    </button>
                    
                    <template v-if="order.status === 'PENDING'">
                      <button 
                        class="btn btn-sm btn-outline-success ms-2" 
                        @click="handleComplete(order)"
                        :disabled="completeMutation.isPending.value"
                        title="Hoàn thành đơn">
                        <i class="bi bi-check-lg"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-danger ms-2" 
                        @click="handleCancel(order)"
                        :disabled="cancelMutation.isPending.value"
                        title="Huỷ đơn">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </template>
                  </td>
                </tr>
                <tr v-if="filteredData.length === 0">
                  <td colspan="7" class="text-center text-muted">Không tìm thấy đơn hàng nào.</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="data && data.totalPages > 1" class="mt-4">
            <Pagination 
              :current-page="currentPage"
              :total-pages="data.totalPages"
              @page-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
  import { toast } from 'vue3-toastify'
  import { getPurchaseOrders, markOrderAsCompleted, cancelPurchaseOrder } from '@/api/purchaseOrderService'
  import Pagination from '@/components/Pagination.vue'
  import PurchaseOrderDetailModal from '@/components/PurchaseOrderDetailModal.vue'
  import { formatMoney } from '@/utils/formatMoney.js'
  
  const queryClient = useQueryClient()
  const currentPage = ref(1)
  const statusFilter = ref('')
  const selectedOrderId = ref(null)
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['purchaseOrders', currentPage],
    queryFn: () => getPurchaseOrders(currentPage.value - 1, 10),
    keepPreviousData: true,
  })
  
  const filteredData = computed(() => {
    if (!data.value?.content) return []
    if (!statusFilter.value) return data.value.content
    return data.value.content.filter(order => order.status === statusFilter.value)
  })
  
  const completeMutation = useMutation({
    mutationFn: markOrderAsCompleted,
    onSuccess: (data) => {
      toast.success(`Đơn hàng #${data.id} đã được hoàn thành.`)
      queryClient.invalidateQueries(['purchaseOrders'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
  })
  
  const cancelMutation = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: (data) => {
      toast.success(`Đơn hàng #${data.id} đã được huỷ.`)
      queryClient.invalidateQueries(['purchaseOrders'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
  })
  
  const handleComplete = (order) => {
    if (confirm(`Bạn có chắc muốn HOÀN THÀNH đơn hàng #${order.id}? Tồn kho sẽ được cập nhật.`)) {
      completeMutation.mutate(order.id)
    }
  }
  
  const handleCancel = (order) => {
    if (confirm(`Bạn có chắc muốn HUỶ đơn hàng #${order.id}?`)) {
      cancelMutation.mutate(order.id)
    }
  }
  
  const handlePageChange = (page) => {
    currentPage.value = page
  }
  
  const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'CANCELLED') return 'bg-danger'
    return 'bg-warning text-dark'
  }
  </script>
  ```eof
  
  ---
  
  ### 7. Tạo Trang Form (`src/pages/PurchaseOrderCreate.vue`)
  
  Đây là trang `/purchase-orders/new` (nested form) để tạo đơn hàng (API 41).
  
  ```vue:Tạo file: src/pages/PurchaseOrderCreate.vue
  <template>
    <div data-aos="fade-up">
      <div class="page-header d-flex align-items-center mb-4">
        <router-link to="/purchase-orders" class="btn btn-icon me-2">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <h2 class="page-title mb-0">Tạo Đơn nhập hàng mới</h2>
      </div>
  
      <Form @submit="handleSubmit" :validation-schema="schema" v-slot="{ errors, values }">
        <div class="row">
          <div class="col-lg-8">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Chi tiết Đơn hàng</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table align-middle">
                    <thead class="table-light">
                      <tr>
                        <th scope="col" style="width: 40%;">Nguyên liệu</th>
                        <th scope="col" style="width: 20%;">Số lượng</th>
                        <th scope="col" style="width: 25%;">Đơn giá (VND)</th>
                        <th scope="col" class="text-end">Thành tiền</th>
                        <th scope="col" class="text-end">Xoá</th>
                      </tr>
                    </thead>
                    <tbody>
                      <FieldArray name="items" v-slot="{ fields, push, remove }">
                        <tr v-for="(field, idx) in fields" :key="field.key">
                          <td>
                            <Field 
                              :name="`items[${idx}].ingredientId`" 
                              as="select" 
                              class="form-select" 
                              :class="{ 'is-invalid': errors[`items[${idx}].ingredientId`] }">
                              <option value="" disabled>Chọn nguyên liệu...</option>
                              <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                                {{ ing.name }} ({{ ing.unit }})
                              </option>
                            </Field>
                            <ErrorMessage :name="`items[${idx}].ingredientId`" class="invalid-feedback d-block" />
                          </td>
                          <td>
                            <Field 
                              :name="`items[${idx}].quantity`" 
                              type="number" 
                              step="0.01" 
                              class="form-control"
                              :class="{ 'is-invalid': errors[`items[${idx}].quantity`] }"
                            />
                            <ErrorMessage :name="`items[${idx}].quantity`" class="invalid-feedback d-block" />
                          </td>
                          <td>
                            <Field 
                              :name="`items[${idx}].unitPrice`" 
                              type="number" 
                              class="form-control"
                              :class="{ 'is-invalid': errors[`items[${idx}].unitPrice`] }"
                            />
                             <ErrorMessage :name="`items[${idx}].unitPrice`" class="invalid-feedback d-block" />
                          </td>
                          <td class="text-end fw-bold">
                            {{ formatMoney(calculateRowTotal(field.value)) }}
                          </td>
                          <td class="text-end">
                            <button type="button" class="btn btn-sm btn-outline-danger" @click="remove(idx)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                        
                        <tr v-if="fields.length === 0">
                          <td colspan="5" class="text-center text-muted">
                            Chưa có mặt hàng nào.
                          </td>
                        </tr>
                      </FieldArray>
                    </tbody>
                  </table>
                </div>
                <button type="button" class="btn btn-outline-primary" @click="() => push({ ingredientId: '', quantity: 1, unitPrice: 0 })">
                  <i class="bi bi-plus-lg me-2"></i> Thêm mặt hàng
                </button>
                 <ErrorMessage name="items" class="text-danger d-block mt-2" />
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Thông tin chung</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label fw-bold">Nhà cung cấp <span class="text-danger">*</span></label>
                  <Field 
                    name="supplierId" 
                    as="select" 
                    class="form-select" 
                    :class="{ 'is-invalid': errors.supplierId }">
                    <option value="" disabled>Chọn nhà cung cấp...</option>
                    <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                      {{ sup.name }}
                    </option>
                  </Field>
                  <ErrorMessage name="supplierId" class="invalid-feedback" />
                </div>
                
                <hr />
                
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Tổng cộng:</h5>
                  <h4 class="mb-0 fw-bold text-danger">{{ formatMoney(calculateTotalAmount(values.items)) }}</h4>
                </div>
                
                <div class="d-grid mt-4">
                  <button type="submit" class="btn btn-primary btn-lg" :disabled="createMutation.isPending.value">
                    <span v-if="createMutation.isPending.value" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Tạo Đơn hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
  import { Form, Field, FieldArray, ErrorMessage, useFieldArray } from 'vee-validate'
  import * as yup from 'yup'
  import { toast } from 'vue3-toastify'
  import { createPurchaseOrder } from '@/api/purchaseOrderService'
  import { getSuppliers } from '@/api/supplierService'
  import { getAllIngredients } from '@/api/ingredientService' 
  import { formatMoney } from '@/utils/formatMoney.js'
  
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const { data: suppliers } = useQuery({ 
    queryKey: ['allSuppliers'], 
    queryFn: getSuppliers 
  })
  const { data: ingredients } = useQuery({ 
    queryKey: ['allIngredients'], 
    queryFn: getAllIngredients // Hàm này đã được fix, lỗi sẽ hết
  })
  
  const schema = yup.object({
    supplierId: yup.number().required('Vui lòng chọn nhà cung cấp.'),
    items: yup.array()
      .of(
        yup.object({
          ingredientId: yup.number().required('Vui lòng chọn nguyên liệu.'),
          quantity: yup.number().required('Số lượng là bắt buộc').min(0.01, 'Số lượng phải lớn hơn 0'),
          unitPrice: yup.number().required('Đơn giá là bắt buộc').min(0, 'Đơn giá không thể âm'),
        })
      )
      .min(1, 'Đơn hàng phải có ít nhất 1 mặt hàng.')
      .required()
  })
  
  const calculateRowTotal = (item) => {
    return (item?.quantity || 0) * (item?.unitPrice || 0)
  }
  
  const calculateTotalAmount = (items) => {
    if (!items) return 0
    return items.reduce((total, item) => total + calculateRowTotal(item), 0)
  }
  
  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (data) => {
      toast.success(`Tạo đơn hàng #${data.id} thành công!`)
      queryClient.invalidateQueries(['purchaseOrders'])
      router.push('/purchase-orders')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
  })
  
  const handleSubmit = (values) => {
    const payload = {
      ...values,
      supplierId: Number(values.supplierId),
      items: values.items.map(item => ({
        ingredientId: Number(item.ingredientId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }))
    }
    createMutation.mutate(payload)
  }
  </script>
  ```eof
  
  ---
  
  ### 📋 Báo cáo và Bước tiếp theo
  
  Tôi đã cung cấp lại 7 tệp hoàn chỉnh cho Bước 8, bao gồm:
  1.  **Fix lỗi `["allIngredients"]`:** Bằng cách thêm hàm `getAllIngredients` vào `ingredientService.js`.
  2.  **Fix lỗi `(reading 'name')`:** Bằng cách thêm `v-if="data"` vào `PurchaseOrderDetailModal.vue` để ngăn template render khi dữ liệu chưa sẵn sàng.
  
  Sau khi bạn áp dụng các thay đổi này, toàn bộ chức năng của Bước 8 sẽ hoạt động chính xác.
  
  Bước tiếp theo, chúng ta sẽ làm:
  **"Xây dựng trang Quản lý Sản phẩm (Product Management) - API 7 đến 12."**
  
  Hãy xác nhận khi bạn đã sẵn sàng để chúng ta tiếp tục bước 9.