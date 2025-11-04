<template>
    <div>
        <h1 class="h3 mb-3">Quản lý Hoá đơn</h1>

        <div class="card shadow-sm mb-4">
            <div class="card-header">
                <i class="fas fa-filter me-1"></i>
                Bộ lọc
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label for="filterStatus" class="form-label">Trạng thái</label>
                        <select id="filterStatus" class="form-select" v-model="filters.status">
                            <option value="">Tất cả</option>
                            <option value="PENDING">Đang chờ</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="CANCELLED">Đã huỷ</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filterStartDate" class="form-label">Từ ngày</label>
                        <input type="date" id="filterStartDate" class="form-control" v-model="filters.startDate" />
                    </div>
                    <div class="col-md-3">
                        <label for="filterEndDate" class="form-label">Đến ngày</label>
                        <input type="date" id="filterEndDate" class="form-control" v-model="filters.endDate" />
                    </div>
                    <div class="col-md-3 d-flex align-items-end">
                        <button class="btn btn-primary w-100" @click="applyFilters">
                            <i class="fas fa-search me-1"></i>
                            Lọc
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                Danh sách hoá đơn
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

                <div v-else-if="orders.length > 0" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Bàn / Loại</th>
                                <th scope="col">Trạng thái</th>
                                <th scope="col">Giảm giá</th>
                                <th scope="col">Tổng tiền</th>
                                <th scope="col">Ngày tạo</th>
                                <th scope="col">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in orders" :key="order.id">
                                <th scope="row">#{{ order.id }}</th>
                                <td>{{ order.tableName || order.orderType }}</td>
                                <td>
                                    <span class="badge" :class="getStatusClass(order.status)">
                                        {{ getStatusText(order.status) }}
                                    </span>
                                </td>
                                <td>{{ formatMoney(order.discount) }}</td>
                                <td class="fw-bold">{{ formatMoney(order.totalAmount) }}</td>
                                <td>{{ new Date(order.createdAt).toLocaleString() }}</td>
                                <td>
                                    <button class="btn btn-sm btn-info me-1" title="Xem chi tiết"
                                        @click="viewOrderDetails(order.id)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button v-if="order.status === 'PENDING'" class="btn btn-sm btn-danger"
                                        title="Huỷ đơn" @click="handleCancelOrder(order.id)">
                                        <i class="fas fa-times-circle"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <Pagination :totalPages="pagination.totalPages" :currentPage="pagination.pageNumber + 1"
                        @pageChanged="handlePageChange" />

                </div>
                <div v-else class="text-center text-muted">
                    Không tìm thấy hoá đơn nào.
                </div>
            </div>
        </div>
    </div>

    <OrderDetailModal :order-id="selectedOrderId" @close="selectedOrderId = null" />

</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
// CẬP NHẬT: Import Modal
import OrderDetailModal from '@/components/OrderDetailModal.vue';
import { getOrders, cancelOrder } from '@/api/orderService.js';
import Pagination from '@/components/Pagination.vue';
import { formatMoney } from '@/utils/formatMoney.js';

// State (Giữ nguyên)
const orders = ref([]);
const pagination = reactive({
    pageNumber: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
});
const filters = reactive({
    status: '',
    startDate: '',
    endDate: '',
});
const isLoading = ref(false);
const error = ref(null);

// THÊM MỚI: State cho Modal
const selectedOrderId = ref(null);

// --- Functions (Giữ nguyên) ---

const fetchOrders = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        const params = {
            page: pagination.pageNumber,
            size: pagination.pageSize,
            status: filters.status || null,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
        };

        const data = await getOrders(params);

        orders.value = data.content;
        pagination.totalPages = data.totalPages;
        pagination.totalElements = data.totalElements;
        pagination.pageNumber = data.pageable.pageNumber;

    } catch (err) {
        console.error(err);
        error.value = err.message || 'Lỗi không xác định khi tải hoá đơn.';
    } finally {
        isLoading.value = false;
    }
};

// --- Handlers (Cập nhật 1) ---

const handlePageChange = (page) => {
    pagination.pageNumber = page - 1;
};

const applyFilters = () => {
    pagination.pageNumber = 0;
    fetchOrders();
};

const handleCancelOrder = async (orderId) => {
    if (!confirm(`Bạn có chắc muốn huỷ hoá đơn #${orderId}?`)) {
        return;
    }

    try {
        await cancelOrder(orderId);
        fetchOrders();
        alert(`Đã huỷ thành công hoá đơn #${orderId}.`);
    } catch (err) {
        console.error(err);
        alert(`Lỗi khi huỷ hoá đơn: ${err.message}`);
    }
};

// CẬP NHẬT: Hàm này giờ sẽ set ID để kích hoạt Modal
const viewOrderDetails = (orderId) => {
    selectedOrderId.value = orderId;
};

// --- Helpers (Styling) (Giữ nguyên) ---

const getStatusClass = (status) => {
    switch (status) {
        case 'PENDING': return 'bg-warning text-dark';
        case 'PAID': return 'bg-success';
        case 'CANCELLED': return 'bg-danger';
        default: return 'bg-secondary';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'PENDING': return 'Đang chờ';
        case 'PAID': return 'Đã thanh toán';
        case 'CANCELLED': return 'Đã huỷ';
        default: return status;
    }
};

// --- Lifecycle & Watchers (Giữ nguyên) ---

onMounted(() => {
    fetchOrders();
});

watch(() => pagination.pageNumber, fetchOrders);

</script>

<style scoped>
.table-responsive {
    min-height: 400px;
}

.form-label {
    font-weight: 500;
}
</style>