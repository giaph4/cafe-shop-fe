<template>
    <Teleport to="body">
        <div class="modal fade customer-form-modal" tabindex="-1" aria-labelledby="customerFormModalLabel" aria-hidden="true" ref="modalRef" @hidden.bs.modal="onModalHidden">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title" id="customerFormModalLabel">{{ title }}</h5>
                            <p class="modal-subtitle">{{ mode === 'edit' ? 'Cập nhật thông tin khách hàng.' : 'Điền đầy đủ thông tin để tạo khách hàng mới.' }}</p>
                        </div>
                        <button type="button" class="btn-close" @click="closeModal" :disabled="loading" aria-label="Đóng"></button>
                    </div>
                    <form @submit.prevent="submitForm" class="customer-form">
                        <div class="modal-body">
                            <div v-if="error" class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                {{ error }}
                            </div>
                            <div class="form-group">
                                <label for="fullName" class="form-label">Họ và tên <span class="text-danger">*</span></label>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="fullName"
                                    v-model="form.fullName"
                                    :disabled="loading"
                                    placeholder="Nhập họ và tên"
                                    required
                                />
                            </div>
                            <div class="form-group">
                                <label for="phone" class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="phone"
                                    v-model="form.phone"
                                    :disabled="loading"
                                    placeholder="Nhập số điện thoại"
                                    required
                                />
                                <div class="form-text">Định dạng: 0XXXXXXXXX hoặc +84XXXXXXXXX</div>
                            </div>
                            <div class="form-group">
                                <label for="email" class="form-label">Email</label>
                                <input
                                    type="email"
                                    class="form-control"
                                    id="email"
                                    v-model="form.email"
                                    :disabled="loading"
                                    placeholder="Nhập email (tùy chọn)"
                                />
                            </div>

                            <div
                                v-if="mode === 'edit' && customer"
                                class="customer-meta"
                            >
                                <div class="customer-meta__item">
                                    <span class="customer-meta__label">Mã khách hàng</span>
                                    <span class="customer-meta__value">#{{ customer.id }}</span>
                                </div>
                                <div class="customer-meta__item">
                                    <span class="customer-meta__label">Điểm thưởng hiện tại</span>
                                    <span class="customer-meta__value">{{ customer.loyaltyPoints ?? 0 }}</span>
                                </div>
                                <div class="customer-meta__item">
                                    <span class="customer-meta__label">Ngày tạo</span>
                                    <span class="customer-meta__value">{{ customer.createdAt || '—' }}</span>
                                </div>
                                <div class="customer-meta__item">
                                    <span class="customer-meta__label">Cập nhật lần cuối</span>
                                    <span class="customer-meta__value">{{ customer.updatedAt || '—' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="closeModal" :disabled="loading">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ submitButtonText }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import { validatePhone, validateRequired } from '@/utils/validation'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    mode: {
        type: String,
        default: 'create', // 'create' or 'edit'
        validator: (value) => ['create', 'edit'].includes(value)
    },
    loading: {
        type: Boolean,
        default: false
    },
    customer: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close', 'submit'])

const modalRef = ref(null)
let modalInstance = null

const form = ref({
    fullName: '',
    phone: '',
    email: ''
})
const error = ref('')

const title = computed(() => (props.mode === 'edit' ? 'Chỉnh sửa khách hàng' : 'Tạo khách hàng mới'))
const submitButtonText = computed(() => (props.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo khách hàng'))
watch(
    () => props.customer,
    () => {
        // Khi dữ liệu khách hàng thay đổi (ví dụ chọn khách khác để sửa),
        // đồng bộ lại form nếu đang ở mode edit.
        if (props.mode === 'edit' && modalInstance) {
            resetForm()
        }
    }
)


watch(
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            resetForm()
            modalInstance?.show()
        } else {
            modalInstance?.hide()
        }
    }
)

const closeModal = () => {
    emit('close')
}

const onModalHidden = () => {
    emit('close')
}

const submitForm = () => {
    error.value = ''
    
    if (!validateRequired(form.value.fullName)) {
        error.value = 'Họ tên là bắt buộc.'
        return
    }
    
    if (!validateRequired(form.value.phone)) {
        error.value = 'Số điện thoại là bắt buộc.'
        return
    }
    
    if (!validatePhone(form.value.phone)) {
        error.value = 'Số điện thoại không đúng định dạng Việt Nam (0XXXXXXXXX hoặc +84XXXXXXXXX).'
        return
    }
    
    emit('submit', { ...form.value })
}

const show = () => {
    resetForm()
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
}

const resetForm = () => {
    if (props.mode === 'edit' && props.customer) {
        form.value = {
            fullName: props.customer.fullName || '',
            phone: props.customer.phone || '',
            email: props.customer.email || ''
        }
    } else {
        form.value = { fullName: '', phone: '', email: '' }
    }
    error.value = ''
}

onMounted(() => {
    if (modalRef.value) {
        modalInstance = new Modal(modalRef.value, {
            backdrop: 'static',
            keyboard: false
        })
    }
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
.customer-form-modal :global(.modal-dialog) {
    max-width: 600px;
}

.customer-form-modal :global(.modal-content) {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-2xl);
}

.customer-form-modal :global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-6);
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

.customer-form-modal :global(.modal-header .modal-title) {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-1);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin-bottom: 0;
    line-height: var(--line-height-normal);
}

.customer-form {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.customer-form .modal-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.customer-form-modal :global(.form-label) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    margin-bottom: 0;
}

.customer-form-modal :global(.form-control) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
    background: var(--color-card);
    color: var(--color-text);
}

.customer-form-modal :global(.form-control:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
    outline: none;
}

.customer-form-modal :global(.form-control:disabled) {
    background: var(--color-card-muted);
    opacity: 0.6;
    cursor: not-allowed;
}

.customer-form-modal :global(.form-text) {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.customer-form-modal :global(.alert-danger) {
    border-radius: var(--radius-md);
    border: 1px solid var(--color-danger-border);
    background: var(--color-danger-soft);
    color: var(--color-danger);
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
}

.customer-meta {
    margin-top: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card-muted);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--spacing-3);
}

.customer-meta__item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.customer-meta__label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
}

.customer-meta__value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}
</style>
