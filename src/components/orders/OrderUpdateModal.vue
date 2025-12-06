<template>
    <Teleport to="body">
        <div class="modal fade order-update-modal" ref="modalElement" tabindex="-1" aria-labelledby="orderUpdateModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title" id="orderUpdateModalLabel">Cập nhật đơn hàng #{{ orderId }}</h5>
                            <p class="modal-subtitle">Cập nhật thông tin khách hàng, bàn và trạng thái đơn hàng.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit" class="order-update-form">
                            <!-- Customer Selection -->
                            <div class="form-group">
                                <label class="form-label">Khách hàng</label>
                                <select 
                                    class="form-select" 
                                    v-model="form.customerId"
                                    :disabled="submitting"
                                >
                                    <option :value="null">Không có khách hàng</option>
                                    <option 
                                        v-for="customer in customers" 
                                        :key="customer.id" 
                                        :value="customer.id"
                                    >
                                        {{ customer.fullName }} ({{ customer.phone }})
                                    </option>
                                </select>
                                <div class="form-text">Chọn khách hàng cho đơn hàng này</div>
                            </div>

                            <!-- Table Selection -->
                            <div class="form-group">
                                <label class="form-label">Bàn</label>
                                <select 
                                    class="form-select" 
                                    v-model="form.tableId"
                                    :disabled="submitting"
                                >
                                    <option :value="null">Không có bàn</option>
                                    <option 
                                        v-for="table in tables" 
                                        :key="table.id" 
                                        :value="table.id"
                                    >
                                        {{ table.name }} ({{ table.capacity }} chỗ)
                                    </option>
                                </select>
                                <div class="form-text">Chọn bàn cho đơn hàng này</div>
                            </div>

                            <!-- Status -->
                            <div class="form-group">
                                <label class="form-label">Trạng thái</label>
                                <select 
                                    class="form-select" 
                                    v-model="form.status"
                                    :disabled="submitting"
                                >
                                    <option value="PENDING">Đang chờ</option>
                                    <option value="PAID">Đã thanh toán</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                    <option value="TRANSFERRED">Đã chuyển ca</option>
                                </select>
                            </div>

                            <!-- Note -->
                            <div class="form-group">
                                <label class="form-label">Ghi chú</label>
                                <textarea 
                                    class="form-control" 
                                    v-model="form.note"
                                    rows="3"
                                    :disabled="submitting"
                                    placeholder="Nhập ghi chú cho đơn hàng..."
                                ></textarea>
                            </div>

                            <!-- Error Message -->
                            <div v-if="error" class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                {{ error }}
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-outline-secondary" 
                            @click="hide"
                            :disabled="submitting"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="handleSubmit"
                            :disabled="submitting"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import { updateOrder } from '@/api/orderService'
import { getCustomers } from '@/api/customerService'
import { getTables } from '@/api/tableService'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const props = defineProps({
    orderId: {
        type: [Number, String],
        default: null
    },
    order: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['updated', 'close'])

const modalElement = ref(null)
let modalInstance = null

const form = reactive({
    customerId: null,
    tableId: null,
    status: 'PENDING',
    note: ''
})

const customers = ref([])
const tables = ref([])
const submitting = ref(false)
const error = ref(null)

// Load customers and tables
const loadCustomers = async () => {
    try {
        const response = await getCustomers({ keyword: '', page: 0, size: 100 })
        customers.value = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : [])
    } catch (err) {
        logger.warn('Failed to load customers:', err)
        customers.value = []
    }
}

const loadTables = async () => {
    try {
        const response = await getTables()
        tables.value = Array.isArray(response) ? response : (Array.isArray(response?.content) ? response.content : [])
    } catch (err) {
        logger.warn('Failed to load tables:', err)
        tables.value = []
    }
}

// Initialize form from order prop
const initializeForm = () => {
    if (props.order) {
        form.customerId = props.order.customerId || null
        form.tableId = props.order.tableId || null
        form.status = props.order.status || 'PENDING'
        form.note = props.order.note || ''
    }
}

watch(() => props.order, initializeForm, { immediate: true })

const handleSubmit = async () => {
    if (!props.orderId) {
        error.value = 'Order ID is required'
        return
    }

    submitting.value = true
    error.value = null

    try {
        const updateData = {}
        if (form.customerId !== undefined) {
            updateData.customerId = form.customerId
        }
        if (form.tableId !== undefined) {
            updateData.tableId = form.tableId
        }
        if (form.status !== undefined) {
            updateData.status = form.status
        }
        if (form.note !== undefined) {
            updateData.note = form.note
        }

        await updateOrder(props.orderId, updateData)
        toast.success('Đã cập nhật đơn hàng thành công.')
        emit('updated')
        hide()
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể cập nhật đơn hàng.'
        toast.error(error.value)
    } finally {
        submitting.value = false
    }
}

const show = () => {
    if (modalInstance) {
        modalInstance.show()
        initializeForm()
        loadCustomers()
        loadTables()
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
        error.value = null
    }
    emit('close')
}

onMounted(() => {
    modalInstance = new Modal(modalElement.value, { backdrop: 'static' })
    loadCustomers()
    loadTables()
})

onBeforeUnmount(() => {
    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

defineExpose({ show, hide })
</script>

<style scoped>
/* Modal - Chuẩn hóa theo base.css */
.order-update-modal :global(.modal-dialog) {
    max-width: 600px;
}

.order-update-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.order-update-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.order-update-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.modal-body) {
    padding: var(--spacing-5);
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    background: var(--color-card);
}

.order-update-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.order-update-modal :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.form-control),
.order-update-modal :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.form-control:focus),
.order-update-modal :global(.form-select:focus) {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    border-color: var(--color-primary);
    box-shadow: none;
}

.order-update-modal :global(.form-control:disabled),
.order-update-modal :global(.form-select:disabled) {
    background: var(--color-card-muted);
    opacity: 0.6;
    cursor: not-allowed;
}

.order-update-modal :global(textarea.form-control) {
    height: auto;
    min-height: 100px;
}

.order-update-modal :global(.form-text) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

/* Error message - không dùng alert, dùng div đơn giản */
.order-update-modal :global(.alert-danger) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    background: var(--color-card);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-2);
}

.order-update-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.order-update-modal :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.order-update-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    color: var(--color-heading);
    background: transparent;
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.order-update-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.order-update-modal :global(.btn-outline-secondary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
    .order-update-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .order-update-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .order-update-modal :global(.modal-footer) {
        flex-direction: column-reverse;
    }

    .order-update-modal :global(.modal-footer .btn) {
        width: 100%;
    }
}
</style>

