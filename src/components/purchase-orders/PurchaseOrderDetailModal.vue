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
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.info-card {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
    transition: all var(--transition-fast);
}

.info-card:hover {
    box-shadow: var(--shadow-soft);
    background: var(--color-card-muted);
}

.info-card .label {
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wide);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-1);
}

.info-card .value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
}

.section-title {
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-3);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
}

.table-wrapper {
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-lg);
    padding: var(--spacing-5);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
}

.status-success {
    background: var(--color-success-soft);
    color: var(--color-success);
}

.status-danger {
    background: var(--color-danger-soft);
    color: var(--color-danger);
}

.status-warning {
    background: var(--color-warning-soft);
    color: var(--color-warning);
}

.table tbody tr:last-child td {
    border-bottom: none;
}

.table td,
.table th {
    vertical-align: middle;
}

:deep(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

:deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

:deep(.modal-header .modal-subtitle) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

:deep(.modal-body) {
    padding: var(--spacing-6);
}

:deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    background: var(--color-card);
}
</style>