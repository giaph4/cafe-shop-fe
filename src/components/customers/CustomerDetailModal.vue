<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header align-items-start">
                        <div>
                            <h5 class="modal-title">Chi tiết khách hàng</h5>
                            <p class="text-muted mb-0">
                                Cập nhật lần cuối: {{ formatDate(customer?.updatedAt) || '—' }}
                            </p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>

                    <div class="modal-body modal-body-scroll">
                        <div v-if="loading" class="detail-state">
                            <div class="spinner-border text-primary" role="status"></div>
                        </div>
                        <div v-else-if="error" class="alert alert-danger d-flex align-items-center gap-2">
                            <i class="bi bi-exclamation-triangle"></i>
                            <span>{{ error }}</span>
                        </div>
                        <div v-else-if="!customer" class="detail-state text-muted">
                            Không tìm thấy thông tin khách hàng.
                        </div>
                        <div v-else class="detail-grid">
                            <aside class="detail-media">
                                <div class="image-frame">
                                    <div class="avatar-placeholder">
                                        <i class="bi bi-person-circle"></i>
                                    </div>
                                </div>
                                <div class="status-block status-block--active">
                                    <i class="bi bi-check-circle-fill"></i>
                                    <span>Đang hoạt động</span>
                                </div>
                                <dl class="meta-list">
                                    <div>
                                        <dt>Mã khách hàng</dt>
                                        <dd>{{ customer.id }}</dd>
                                    </div>
                                    <div>
                                        <dt>Ngày tạo</dt>
                                        <dd>{{ formatDate(customer.createdAt) || '—' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Cập nhật lần cuối</dt>
                                        <dd>{{ formatDate(customer.updatedAt) || '—' }}</dd>
                                    </div>
                                </dl>
                            </aside>

                            <section class="detail-content">
                                <header class="detail-header">
                                    <h3>{{ customer.fullName || '—' }}</h3>
                                    <p class="text-muted mb-0">{{ customer.email || 'Chưa có email' }}</p>
                                </header>

                                <div class="info-cards">
                                    <div class="info-card">
                                        <span class="label">Điểm thưởng</span>
                                        <strong class="value text-primary">{{ formatLoyaltyPoints(customer.loyaltyPoints) }}</strong>
                                    </div>
                                    <div class="info-card">
                                        <span class="label">Số điện thoại</span>
                                        <strong class="value">{{ customer.phone || '—' }}</strong>
                                    </div>
                                    <div class="info-card">
                                        <span class="label">Email</span>
                                        <strong class="value">{{ customer.email || '—' }}</strong>
                                    </div>
                                </div>

                                <section class="additional-info-section">
                                    <h5 class="mb-3">Thông tin bổ sung</h5>
                                    <div class="table-responsive">
                                        <table class="table table-sm align-middle">
                                            <tbody>
                                                <tr>
                                                    <td class="fw-semibold" style="width: 40%;">Họ và tên:</td>
                                                    <td>{{ customer.fullName || '—' }}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-semibold">Số điện thoại:</td>
                                                    <td>{{ customer.phone || '—' }}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-semibold">Email:</td>
                                                    <td>{{ customer.email || '—' }}</td>
                                                </tr>
                                                <tr>
                                                    <td class="fw-semibold">Điểm thưởng:</td>
                                                    <td><span class="text-primary fw-bold">{{ formatLoyaltyPoints(customer.loyaltyPoints) }}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </section>
                        </div>
                    </div>

                    <div class="modal-footer dual-buttons">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                        <button type="button" class="btn btn-primary" @click="editCustomer">
                            <i class="bi bi-pencil me-2"></i>Chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { getCustomerById } from '@/api/customerService'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps({
    customerId: {
        type: [String, Number],
        default: null
    }
})

const emit = defineEmits(['close', 'edit'])

const modal = ref(null)
let modalInstance = null
const customer = ref(null)
const loading = ref(false)
const error = ref(null)

const formatDate = (value) => (value ? formatDateTime(value) : '')

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return numeric.toLocaleString('vi-VN')
}

const fetchDetail = async (id) => {
    if (!id) return
    loading.value = true
    error.value = null
    try {
        const response = await getCustomerById(id)
        customer.value = response
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải chi tiết khách hàng.'
        customer.value = null
    } finally {
        loading.value = false
    }
}

watch(
    () => props.customerId,
    async (id) => {
        if (!modalInstance) return
        customer.value = null
        if (!id) return
        await fetchDetail(id)
        await nextTick()
    }
)

const show = async () => {
    if (!props.customerId) {
        return
    }
    await fetchDetail(props.customerId)
    await nextTick()
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
    emit('close')
}

const editCustomer = () => {
    if (customer.value) {
        hide()
        emit('edit', customer.value)
    }
}

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: true })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
.detail-state {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.detail-grid {
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    gap: 2rem;
    min-width: 0;
}

.detail-media {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.image-frame {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.16);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
}

.avatar-placeholder {
    width: 100%;
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05));
}

.avatar-placeholder i {
    font-size: 8rem;
    color: rgba(99, 102, 241, 0.3);
}

.status-block {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    font-weight: 600;
    width: fit-content;
}

.status-block--active {
    background: rgba(16, 185, 129, 0.16);
    color: var(--color-success);
}

.status-block--inactive {
    background: rgba(248, 113, 113, 0.18);
    color: var(--color-danger);
}

.meta-list {
    display: grid;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.4);
    background: var(--color-card-muted);
}

.meta-list dt {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
}

.meta-list dd {
    margin: 0;
    font-weight: 600;
    color: var(--color-heading);
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
    overflow: hidden;
}

.detail-header h3 {
    font-weight: 700;
    margin-bottom: 0.35rem;
    word-break: break-word;
    overflow-wrap: break-word;
}

.detail-header p {
    word-break: break-word;
    overflow-wrap: break-word;
}

.info-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    min-width: 0;
}

.info-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    overflow: hidden;
}

.info-card .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--color-text-subtle);
    letter-spacing: 0.06em;
}

.info-card .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-heading);
    word-break: break-word;
    overflow-wrap: break-word;
}

.additional-info-section {
    border-top: 1px solid var(--color-border);
    padding-top: 1.25rem;
    min-width: 0;
}

.additional-info-section table td {
    word-break: break-word;
    overflow-wrap: break-word;
}

.additional-info-section h5 {
    font-weight: 600;
    color: var(--color-heading);
}

.customer-detail-modal :global(.modal-backdrop.show) {
    background-color: rgba(15, 23, 42, 0.3);
    backdrop-filter: blur(2px);
}

@media (max-width: 992px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }

    .image-frame {
        height: 220px;
    }

    .info-cards {
        grid-template-columns: 1fr;
    }
}
</style>

