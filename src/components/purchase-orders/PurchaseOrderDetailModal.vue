<template>
    <div class="modal fade" id="purchaseDetailModal" tabindex="-1" ref="modalElement" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content detail-modal">
                <div class="modal-header border-0 pb-0">
                    <div>
                        <h5 class="modal-title fw-semibold">Chi tiết đơn nhập hàng #{{ orderId }}</h5>
                        <p class="modal-subtitle text-muted mb-0">Theo dõi tình trạng xử lý và các hạng mục trong phiếu nhập.</p>
                    </div>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <div class="modal-body">
                    <div v-if="isLoading" class="state-block py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>
                    <div v-else-if="isError" class="state-block py-5">
                        <div class="alert alert-danger mb-0">{{ errorMessage }}</div>
                    </div>
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

                <div class="modal-footer border-0 pt-0">
                    <button type="button" class="btn btn-outline-secondary" @click="closeModal">Đóng</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'

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

<style scoped>
.detail-modal {
    border-radius: 24px;
    border: 1px solid var(--color-border);
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22);
}

.modal-subtitle {
    font-size: 0.9rem;
}

.state-block {
    display: flex;
    align-items: center;
    justify-content: center;
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-card {
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
}

.info-card .label {
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.info-card .value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 0;
}

.section-title {
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--color-heading);
}

.table-wrapper {
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 18px;
    padding: 1.25rem;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
}

.status-success {
    background: rgba(34, 197, 94, 0.15);
    color: #16a34a;
}

.status-danger {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
}

.status-warning {
    background: rgba(234, 179, 8, 0.15);
    color: #ca8a04;
}

.table tbody tr:last-child td {
    border-bottom: none;
}

.table td,
.table th {
    vertical-align: middle;
}

</style>