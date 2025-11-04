<template>
    <PurchaseOrderDetailModal :order-id="selectedOrderId" @close="selectedOrderId = null" />

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
                                    <button class="btn btn-sm btn-outline-info" @click="selectedOrderId = order.id">
                                        <i class="bi bi-eye-fill"></i>
                                    </button>

                                    <template v-if="order.status === 'PENDING'">
                                        <button class="btn btn-sm btn-outline-success ms-2"
                                            @click="handleComplete(order)" :disabled="completeMutation.isPending.value">
                                            <i class="bi bi-check-lg"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger ms-2" @click="handleCancel(order)"
                                            :disabled="cancelMutation.isPending.value">
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
                    <Pagination :current-page="currentPage" :total-pages="data.totalPages"
                        @page-change="handlePageChange" />
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
const statusFilter = ref('') // Lọc client-side
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
    return 'bg-warning'
}
</script>