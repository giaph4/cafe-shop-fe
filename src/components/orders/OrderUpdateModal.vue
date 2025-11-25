<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalElement" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Cập nhật đơn hàng #{{ orderId }}</h5>
                            <p class="mb-0 text-muted small">Cập nhật thông tin khách hàng, bàn và trạng thái đơn hàng.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <!-- Customer Selection -->
                            <div class="mb-3">
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
                            <div class="mb-3">
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
                            <div class="mb-3">
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
                            <div class="mb-3">
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
                            <div v-if="error" class="alert alert-danger mb-0">
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
:deep(.modal-content) {
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.15);
}

:deep(.modal-header) {
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem;
    background: #ffffff;
}

:deep(.modal-header .modal-title) {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
}

:deep(.modal-header .text-muted.small) {
    color: #64748b;
    font-size: 0.875rem;
}

.modal-body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1.5rem;
}

:deep(.modal-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1rem 1.5rem;
    background: #ffffff;
}

:deep(.form-label) {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

:deep(.form-control),
:deep(.form-select) {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.625rem 1rem;
    font-size: 0.9rem;
}

:deep(.form-control:focus),
:deep(.form-select:focus) {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

:deep(.btn-primary) {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    padding: 0.625rem 1.5rem;
    font-weight: 600;
}

:deep(.btn-outline-secondary) {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0.625rem 1.5rem;
    color: #64748b;
    background: #ffffff;
}

:deep(.btn-outline-secondary:hover) {
    background: #f8fafc;
    border-color: #cbd5e1;
}
</style>

