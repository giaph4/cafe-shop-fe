<template>
    <Teleport to="body">
        <div class="modal fade" tabindex="-1" ref="modalRef" @hidden.bs.modal="onModalHidden">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <form @submit.prevent="submitForm">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ title }}</h5>
                            <button type="button" class="btn-close" @click="closeModal" :disabled="loading"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <div class="mb-3">
                                <label for="fullName" class="form-label">Họ và tên</label>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="fullName"
                                    v-model="form.fullName"
                                    :disabled="loading"
                                    required
                                />
                            </div>
                            <div class="mb-3">
                                <label for="phone" class="form-label">Số điện thoại</label>
                                <input
                                    type="text"
                                    class="form-control"
                                    id="phone"
                                    v-model="form.phone"
                                    :disabled="loading"
                                    required
                                />
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <input
                                    type="email"
                                    class="form-control"
                                    id="email"
                                    v-model="form.email"
                                    :disabled="loading"
                                />
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
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            modalInstance?.show()
            if (props.mode === 'edit' && props.customer) {
                form.value = { ...props.customer }
            } else {
                form.value = { fullName: '', phone: '', email: '' }
            }
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
    if (!form.value.fullName || !form.value.phone) {
        error.value = 'Họ tên và số điện thoại là bắt buộc.'
        return
    }
    const phonePattern = /^(\+?84|0)\d{9}$/
    if (!phonePattern.test(form.value.phone)) {
        error.value = 'Số điện thoại không đúng định dạng Việt Nam (0XXXXXXXXX hoặc +84XXXXXXXXX).'
        return
    }
    emit('submit', { ...form.value })
}

const show = () => {
    if (props.mode === 'edit' && props.customer) {
        form.value = { ...props.customer }
    } else {
        form.value = { fullName: '', phone: '', email: '' }
    }
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
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
.modal-title {
    font-weight: 700;
}
</style>
