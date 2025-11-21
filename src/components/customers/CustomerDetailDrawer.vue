<template>
    <div :class="['drawer', { 'is-open': visible }]" @click.self="handleOverlayClick">
        <div class="drawer-content" data-aos="fade-right" data-aos-duration="400">
            <div class="drawer-header">
                <h5 class="drawer-title">Chi tiết khách hàng</h5>
                <button type="button" class="btn-close" @click="closeDrawer"></button>
            </div>
            <div class="drawer-body">
                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </div>
                <div v-else-if="error" class="alert alert-warning">
                    {{ error }}
                </div>
                <div v-else-if="customer">
                    <div class="list-group list-group-flush">
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Mã khách hàng:</strong>
                            <span>{{ customer.id }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Họ và tên:</strong>
                            <span>{{ customer.fullName }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Số điện thoại:</strong>
                            <span>{{ customer.phone || '—' }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Email:</strong>
                            <span>{{ customer.email || '—' }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Điểm thưởng:</strong>
                            <span class="fw-semibold text-primary">{{ formatLoyaltyPoints(customer.loyaltyPoints) }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Ngày tạo:</strong>
                            <span class="text-muted">{{ formatDate(customer.createdAt) }}</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <strong>Cập nhật lần cuối:</strong>
                            <span class="text-muted">{{ formatDate(customer.updatedAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="drawer-footer">
                <button type="button" class="btn btn-outline-secondary" @click="closeDrawer">
                    Đóng
                </button>
                <button type="button" class="btn btn-primary" @click="editCustomer">
                    <i class="bi bi-pencil me-2"></i>
                    Chỉnh sửa
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { getCustomerById } from '@/api/customerService'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    customerId: {
        type: [String, Number],
        default: null
    },
    initialTab: {
        type: String,
        default: 'overview'
    }
})

const emit = defineEmits(['close', 'edit'])

const customer = ref(null)
const loading = ref(false)
const error = ref('')

const fetchCustomerDetails = async () => {
    if (!props.customerId) {
        customer.value = null
        return
    }

    loading.value = true
    error.value = ''
    try {
        const response = await getCustomerById(props.customerId)
        customer.value = response
    } catch (err) {
        console.error('Failed to fetch customer details', err)
        error.value = err?.response?.data?.message || 'Không thể tải thông tin chi tiết khách hàng.'
        customer.value = null
    } finally {
        loading.value = false
    }
}

watch(
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            document.body.style.overflow = 'hidden'
            nextTick(fetchCustomerDetails)
        } else {
            document.body.style.overflow = ''
        }
    }
)

watch(
    () => props.customerId,
    (newId, oldId) => {
        if (newId !== oldId && props.visible) {
            fetchCustomerDetails()
        }
    }
)

const closeDrawer = () => {
    emit('close')
}

const handleOverlayClick = () => {
    closeDrawer()
}

const editCustomer = () => {
    if (customer.value) {
        emit('edit', customer.value)
    }
}

const formatDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
}

const formatLoyaltyPoints = (points) => {
    const numeric = Number(points)
    if (!Number.isFinite(numeric)) return '0'
    return numeric.toLocaleString('vi-VN')
}
</script>

<style scoped>
.drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

.drawer.is-open {
    opacity: 1;
    visibility: visible;
}

.drawer-content {
    position: fixed;
    top: 0;
    right: -100%;
    width: 100%;
    max-width: 480px;
    height: 100%;
    background-color: var(--color-card);
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.drawer.is-open .drawer-content {
    right: 0;
}

.drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.drawer-title {
    margin-bottom: 0;
    font-size: 1.25rem;
    font-weight: 700;
}

.drawer-body {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.drawer-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.nav-pills .nav-link {
    border-radius: 999px;
    font-weight: 600;
    color: var(--color-text-muted);
    transition: all 0.2s ease;
}

.nav-pills .nav-link.active {
    background: linear-gradient(122deg, rgba(99, 102, 241, 0.92) 0%, rgba(129, 140, 248, 0.88) 100%);
    color: #fff;
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
}

.list-group-item {
    background: transparent;
    border-color: var(--color-border-soft);
    padding: 1rem 0;
}

.list-group-item:first-child {
    padding-top: 0;
    border-top: none;
}

.list-group-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
}
</style>
