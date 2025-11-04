<template>
    <div class="page-container">
        <div class="page-header">
            <h1>Quản lý Phiếu Nhập Hàng</h1>
            <router-link :to="{ name: 'PurchaseOrderCreate' }" class="btn btn-primary">
                <i class="fas fa-plus"></i> Tạo Phiếu Nhập
            </router-link>
        </div>

        <div class="filter-card card">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label for="search" class="form-label">Tìm kiếm</label>
                        <input type="text" id="search" class="form-control" placeholder="Nhập mã phiếu, tên NCC..."
                            v-model="filters.search" />
                    </div>

                    <div class="col-md-3">
                        <label for="status" class="form-label">Trạng thái</label>
                        <select id="status" class="form-select" v-model="filters.status">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Đang chờ (Pending)</option>
                            <option value="COMPLETED">Hoàn thành (Completed)</option>
                            <option value="CANCELLED">Đã hủy (Cancelled)</option>
                        </select>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Ngày tạo</label>
                        <div class="input-group">
                            <input type="date" class="form-control" v-model="filters.startDate" />
                            <span class="input-group-text">đến</span>
                            <input type="date" class="form-control" v-model="filters.endDate" />
                        </div>
                    </div>

                    <div class="col-md-2">
                        <label class="form-label">Tổng tiền (Từ)</label>
                        <input type="number" class="form-control" placeholder="Từ" v-model.number="filters.minTotal" />
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Tổng tiền (Đến)</label>
                        <input type="number" class="form-control" placeholder="Đến" v-model.number="filters.maxTotal" />
                    </div>

                    <div class="col-md-3 d-flex align-items-end">
                        <button class="btn btn-primary me-2" @click="applyFilters">
                            <i class="fas fa-filter"></i> Lọc
                        </button>
                        <button class="btn btn-outline-secondary" @click="clearFilters">
                            <i class="fas fa-times"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="data-table-card card mt-4">
            <div class="card-body">
                <div v-if="isLoading" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div v-else-if="purchaseOrders.length === 0" class="text-center text-muted">
                    Không tìm thấy dữ liệu.
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Mã Phiếu</th>
                                <th>Nhà Cung Cấp</th>
                                <th @click="handleSort('createdAt')" class="sortable">
                                    Ngày Tạo
                                    <i v-if="sort.sortBy === 'createdAt'" :class="sortIconClass"></i>
                                </th>
                                <th>Trạng Thái</th>
                                <th @click="handleSort('totalAmount')" class="sortable text-end">
                                    Tổng Tiền
                                    <i v-if="sort.sortBy === 'totalAmount'" :class="sortIconClass"></i>
                                </th>
                                <th class="text-center">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in purchaseOrders" :key="order.id">
                                <td>{{ order.id }}</td>
                                <td>{{ order.supplierName || 'N/A' }}</td>
                                <td>{{ new Date(order.createdAt).toLocaleDateString() }}</td>
                                <td>
                                    <span :class="getStatusClass(order.status)">
                                        {{ getStatusText(order.status) }}
                                    </span>
                                </td>
                                <td class="text-end fw-bold">{{ formatMoney(order.totalAmount) }}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-info me-1" @click="openDetailModal(order.id)">
                                        <i class="fas fa-eye"></i> Xem
                                    </button>
                                    <template v-if="order.status === 'PENDING'">
                                        <button class="btn btn-sm btn-success me-1"
                                            @click="handleChangeStatus(order.id, 'COMPLETED')">
                                            <i class="fas fa-check"></i> Hoàn thành
                                        </button>
                                        <button class="btn btn-sm btn-warning me-1"
                                            @click="handleChangeStatus(order.id, 'CANCELLED')">
                                            <i class="fas fa-ban"></i> Hủy
                                        </button>
                                    </template>
                                    <button class="btn btn-sm btn-danger" @click="handleDelete(order.id)">
                                        <i class="fas fa-trash"></i> Xóa
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card-footer d-flex justify-content-end" v-if="!isLoading && pagination.totalPages > 1">
                <Pagination :totalPages="pagination.totalPages" :currentPage="pagination.page"
                    @page-changed="handlePageChange" />
            </div>
        </div>

        <PurchaseOrderDetailModal :orderId="selectedOrderId" v-if="isModalVisible" @close="isModalVisible = false" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { getPurchaseOrders, updatePurchaseOrderStatus, deletePurchaseOrder } from '@/api/purchaseOrderService';
import Pagination from '@/components/Pagination.vue'; // Tái sử dụng component
import PurchaseOrderDetailModal from '@/components/PurchaseOrderDetailModal.vue'; // Tái sử dụng component
import { formatMoney } from '@/utils/formatMoney'; // Tái sử dụng tiện ích
// import { useToast } from 'vue-toastification'; // Giả định dùng vue-toastification
// import debounce from 'lodash/debounce';

const toast = useToast();

// --- STATE (TRẠNG THÁI) ---

const purchaseOrders = ref([]);
const isLoading = ref(true);
const isModalVisible = ref(false);
const selectedOrderId = ref(null);

// State cho Phân trang
const pagination = reactive({
    page: 1,
    size: 10,
    totalElements: 0,
    totalPages: 1,
});

// State cho Lọc (Quản lý toàn bộ giá trị filter)
const filters = reactive({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    minTotal: null,
    maxTotal: null,
});

// State cho Sắp xếp (Backend-driven sorting)
const sort = reactive({
    sortBy: 'createdAt', // Cột mặc định
    sortDir: 'DESC',    // Hướng mặc định
});

// --- CORE FUNCTIONS (HÀM CHÍNH) ---

// Hàm gọi API lấy dữ liệu
const fetchData = async () => {
    isLoading.value = true;
    try {
        // 1. Chuẩn bị params gửi lên API
        const params = {
            page: pagination.page - 1, // API (Spring) thường đếm page từ 0
            size: pagination.size,
            search: filters.search || null,
            status: filters.status || null,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
            minTotal: filters.minTotal || null,
            maxTotal: filters.maxTotal || null,
            sortBy: sort.sortBy,
            sortDir: sort.sortDir,
        };

        // 2. Gọi API
        const response = await getPurchaseOrders(params);

        // 3. Cập nhật state
        purchaseOrders.value = response.data.content;
        pagination.totalPages = response.data.totalPages;
        pagination.totalElements = response.data.totalElements;
        pagination.page = response.data.number + 1; // Cập nhật lại page hiện tại từ response

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu phiếu nhập:', error);
        toast.error('Không thể tải danh sách phiếu nhập. Vui lòng thử lại.');
    } finally {
        isLoading.value = false;
    }
};

// --- HANDLERS (HÀM XỬ LÝ SỰ KIỆN) ---

// a. Lọc
const applyFilters = () => {
    pagination.page = 1; // Reset về trang 1 khi lọc
    fetchData();
};

const clearFilters = () => {
    filters.search = '';
    filters.status = '';
    filters.startDate = '';
    filters.endDate = '';
    filters.minTotal = null;
    filters.maxTotal = null;
    pagination.page = 1;
    fetchData();
};

// b. Sắp xếp (Sort)
const handleSort = (column) => {
    if (sort.sortBy === column) {
        // Đảo chiều sắp xếp nếu click lại cột cũ
        sort.sortDir = sort.sortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
        // Sắp xếp cột mới (mặc định DESC)
        sort.sortBy = column;
        sort.sortDir = 'DESC';
    }
    pagination.page = 1; // Reset về trang 1
    fetchData();
};

// c. Hành động (Actions)
const openDetailModal = (id) => {
    selectedOrderId.value = id;
    isModalVisible.value = true;
};

const handleChangeStatus = async (id, newStatus) => {
    const actionText = newStatus === 'COMPLETED' ? 'hoàn thành' : 'hủy';
    if (!confirm(`Bạn có chắc muốn ${actionText} phiếu nhập ${id} không?`)) {
        return;
    }

    try {
        await updatePurchaseOrderStatus(id, newStatus);
        toast.success(`Đã ${actionText} phiếu nhập thành công!`);
        fetchData(); // Tải lại dữ liệu
    } catch (error) {
        console.error(`Lỗi khi ${actionText} phiếu nhập:`, error);
        toast.error('Cập nhật trạng thái thất bại.');
    }
};

const handleDelete = async (id) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA phiếu nhập ${id} không? Hành động này không thể hoàn tác.`)) {
        return;
    }

    try {
        await deletePurchaseOrder(id);
        toast.success('Xóa phiếu nhập thành công!');
        fetchData(); // Tải lại dữ liệu
    } catch (error) {
        console.error('Lỗi khi xóa phiếu nhập:', error);
        toast.error('Xóa phiếu nhập thất bại.');
    }
};

// d. Phân trang
const handlePageChange = (newPage) => {
    pagination.page = newPage;
    fetchData();
};

// --- WATCHERS (THEO DÕI THAY ĐỔI) ---

// Triển khai Debounce (trì hoãn) cho ô tìm kiếm
// Chỉ gọi API 500ms sau khi người dùng ngừng gõ
watch(() => filters.search, debounce(() => {
    pagination.page = 1;
    fetchData();
}, 500)
);

// --- LIFECYCLE ---

// Tải dữ liệu lần đầu khi component được mount
onMounted(() => {
    fetchData();
});

// --- COMPUTED (DỮ LIỆU TÍNH TOÁN - Hỗ trợ UI) ---

// Tính toán class icon cho sắp xếp
const sortIconClass = computed(() => {
    return sort.sortDir === 'ASC' ? 'fas fa-sort-up' : 'fas fa-sort-down';
});

// Hàm hỗ trợ hiển thị Tag màu cho Trạng thái
const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'badge bg-success';
    if (status === 'CANCELLED') return 'badge bg-danger';
    if (status === 'PENDING') return 'badge bg-warning text-dark';
    return 'badge bg-secondary';
};

// Hàm hỗ trợ hiển thị Text cho Trạng thái
const getStatusText = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành';
    if (status === 'CANCELLED') return 'Đã hủy';
    if (status === 'PENDING') return 'Đang chờ';
    return status;
};

</script>

<style scoped>
/* Thêm style để con trỏ chuột biến thành "pointer" khi hover vào tiêu đề cột có thể sắp xếp */
.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable:hover {
    background-color: #f8f9fa;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.filter-card {
    margin-bottom: 1.5rem;
}

.data-table-card .card-body {
    padding: 0;
    /* Xóa padding để table vừa khít */
}

.table {
    margin-bottom: 0;
    /* Xóa margin-bottom mặc định của table */
}

.card-footer {
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
}
</style>