<template>
    <Teleport to="body">
        <div class="modal fade" id="purchaseDetailModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content detail-modal">
                <div class="modal-header">
                    <div>
                        <h5 class="modal-title">Chi tiết đơn nhập hàng #{{ orderId }}</h5>
                        <p class="modal-subtitle mb-0">Theo dõi tình trạng xử lý và các hạng mục trong phiếu nhập.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <div class="modal-body">
                    <LoadingState v-if="isLoading" />
                    <ErrorState 
                        v-else-if="isError" 
                        :message="errorMessage"
                    />
                    <div v-else-if="detail" class="detail-content">
                        <div class="row g-4 mb-3">
                            <div class="col-md-6">
                                <div class="info-card">
                                    <p class="label">Nhà cung cấp</p>
                                    <p class="value">{{ detail.supplierName }}</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-card">
                                    <p class="label">Người tạo phiếu</p>
                                    <p class="value">{{ detail.staffUsername }}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="info-card">
                                    <p class="label">Ngày đặt</p>
                                    <p class="value">{{ formatDateTime(detail.orderDate) || '—' }}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="info-card">
                                    <p class="label">Trạng thái</p>
                                    <p class="value">
                                        <span class="status-badge" :class="statusBadgeClass(detail.status)">
                                            {{ statusLabel(detail.status) }}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="info-card">
                                    <p class="label">Tổng giá trị</p>
                                    <p class="value text-primary fw-semibold">{{ formatCurrency(detail.totalAmount) }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="table-wrapper">
                            <h6 class="section-title">Danh sách mặt hàng</h6>
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nguyên liệu</th>
                                            <th class="text-end">Số lượng</th>
                                            <th class="text-end">Đơn giá</th>
                                            <th class="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="item in lineItems" :key="item.id">
                                            <td>
                                                <div class="d-flex flex-column">
                                                    <span class="fw-semibold">{{ item.ingredientName }}</span>
                                                    <small class="text-muted">Đơn vị: {{ item.ingredientUnit }}</small>
                                                </div>
                                            </td>
                                            <td class="text-end">{{ formatNumber(item.quantity) }}</td>
                                            <td class="text-end">{{ formatCurrency(item.unitPrice) }}</td>
                                            <td class="text-end fw-semibold">{{ formatCurrency(item.lineTotal) }}</td>
                                        </tr>
                                        <tr v-if="!lineItems.length">
                                            <td colspan="4" class="text-center text-muted py-4">Không có mặt hàng nào trong đơn.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" @click="closeModal">Đóng</button>
                </div>
            </div>
        </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Teleport } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'

import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { getPurchaseOrderById } from '@/api/purchaseOrderService'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters'

const props = defineProps({
    orderId: Number
})

const emit = defineEmits(['close'])

const modalElement = ref(null)
const bsModal = ref(null)

const query = useQuery({
    queryKey: computed(() => ['purchaseOrder', props.orderId]),
    queryFn: ({ queryKey }) => {
        const [, id] = queryKey
        return getPurchaseOrderById(id)
    },
    enabled: false
})

const { data, isLoading, isError, error, refetch } = query

const detail = computed(() => data.value ?? null)

const lineItems = computed(() => {
    if (!detail.value?.purchaseOrderDetails) return []
    return detail.value.purchaseOrderDetails.map((item) => ({
        ...item,
        lineTotal: Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0)
    }))
})

const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message || 'Không thể tải chi tiết phiếu nhập.')

watch(() => props.orderId, async (newId) => {
    if (newId) {
        await refetch()
        bsModal.value?.show()
    } else {
        bsModal.value?.hide()
    }
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value, { backdrop: 'static' })
        modalElement.value.addEventListener('hidden.bs.modal', () => emit('close'))
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
})

const closeModal = () => {
    emit('close')
}

const statusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'status-success'
    if (status === 'CANCELLED') return 'status-danger'
    return 'status-warning'
}

const statusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'CANCELLED') return 'Đã huỷ'
    return 'Đang chờ'
}
</script>

<style scoped lang="scss">
.detail-modal {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.info-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3) var(--spacing-4);
    background: var(--color-card);
    transition: all var(--transition-base);
}

.info-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.info-card .label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.info-card .value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.info-card .value.text-primary {
    color: var(--color-primary) !important;
}

.section-title {
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-3);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    font-family: var(--font-family-sans);
}

.table-wrapper {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    background: var(--color-card);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    border: 1px solid transparent;
    font-family: var(--font-family-sans);
}

.status-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border-color: var(--color-success);
}

.status-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border-color: var(--color-danger);
}

.status-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
    border-color: var(--color-warning);
}

:deep(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

:deep(.table thead),
:deep(.table thead.table-light) {
    background: var(--color-card-muted);
}

:deep(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

:deep(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

:deep(.table tbody tr:last-child td) {
    border-bottom: none;
}

:deep(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

:deep(.table .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:deep(.table .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:deep(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

:deep(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

:deep(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>