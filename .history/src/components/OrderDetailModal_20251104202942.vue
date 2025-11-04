<template>
    <div class="modal fade" ref="modalEle" tabindex="-1" aria-labelledby="orderDetailModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="orderDetailModalLabel">
                        Chi tiết Hoá đơn #{{ orderId }}
                    </h5>
                    <button type="button" class="btn-close" @click="hide" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div v-if="isLoading" class="text-center my-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div v-else-if="error" class="alert alert-danger">
                        {{ error }}
                    </div>

                    <div v-else-if="order">
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <h6 class="text-muted">Trạng thái</h6>
                                <span class="badge fs-6" :class="getStatusClass(order.status)">
                                    {{ getStatusText(order.status) }}
                                </span>
                            </div>
                            <div class="col-md-4">
                                <h6 class="text-muted">Bàn/Loại</h6>
                                <p class="fs-6 fw-medium mb-0">{{ order.tableName || order.orderType }}</p>
                            </div>
                            <div class="col-md-4">
                                <h6 class="text-muted">Người tạo</h6>
                                <p class="fs-6 fw-medium mb-0">{{ order.createdBy }}</p>
                            </div>
                        </div>

                        <h5 class="mb-3">Các món đã gọi ({{ order.items.length }})</h5>
                        <div class="list-group list-group-flush">
                            <div v-for="item in order.items" :key="item.id" class="list-group-item px-0">
                                <div class="d-flex w-100">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">{{ item.productName }}</h6>
                                        <small class="text-muted">
                                            {{ formatMoney(item.unitPrice) }} x {{ item.quantity }}
                                        </small>
                                        <p v-if="item.notes" class="mb-0 text-info">
                                            <i class="fas fa-sticky-note me-1"></i>
                                            Ghi chú: {{ item.notes }}
                                        </p>
                                    </div>
                                    <div class="text-end">
                                        <span class="fw-bold">{{ formatMoney(item.totalPrice) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr class="my-3">

                        <div class="row justify-content-end">
                            <div class="col-md-6">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        Tạm tính:
                                        <span>{{ formatMoney(order.subtotal) }}</span>
                                    </li>
                                    <li
                                        class="list-group-item d-flex justify-content-between align-items-center px-0 text-danger">
                                        Giảm giá (Voucher):
                                        <span>- {{ formatMoney(order.discount) }}</span>
                                    </li>
                                    <li
                                        class="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold fs-5">
                                        Tổng cộng:
                                        <span class="text-primary">{{ formatMoney(order.totalAmount) }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="hide">
                        <i class="fas fa-times me-1"></i>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { Modal } from 'bootstrap'; // Import Bootstrap's JS
import { getOrderById } from '@/api/orderService.js';
import { formatMoney } from '@/utils/formatMoney.js';

const props = defineProps({
    orderId: {
        type: Number,
        default: null,
    },
});

const emit = defineEmits(['close']);

// State
const modalEle = ref(null);
let modalInstance = null;
const order = ref(null);
const isLoading = ref(false);
const error = ref(null);

// --- API ---
const fetchOrderDetail = async (id) => {
    if (!id) return;
    isLoading.value = true;
    error.value = null;
    order.value = null;
    try {
        // API: GET /api/v1/orders/{id} 
        order.value = await getOrderById(id);
    } catch (err) {
        console.error(err);
        error.value = err.message || 'Lỗi khi tải chi tiết đơn hàng.';
    } finally {
        isLoading.value = false;
    }
};

// --- Modal Controls ---
const show = () => {
    if (modalInstance) {
        modalInstance.show();
    }
};

const hide = () => {
    if (modalInstance) {
        modalInstance.hide();
    }
};

onMounted(() => {
    if (modalEle.value) {
        modalInstance = new Modal(modalEle.value);
        // Bắt sự kiện 'hidden' của Bootstrap để emit 'close'
        modalEle.value.addEventListener('hidden.bs.modal', () => {
            emit('close');
        });
    }
});

// --- Watcher ---
watch(() => props.orderId, (newId) => {
    if (newId) {
        fetchOrderDetail(newId);
        show();
    } else {
        hide();
    }
});

// --- Helpers (Styling) ---
// (Copy từ Orders.vue)
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
</script>

<style scoped>
.fw-medium {
    font-weight: 500;
}
</style>