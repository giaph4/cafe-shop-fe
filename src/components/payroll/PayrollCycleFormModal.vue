<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">{{ localState.id ? 'Cập nhật chu kỳ lương' : 'Tạo chu kỳ lương' }}</h5>
                            <p class="text-muted mb-0">Quản lý thời gian chấm lương theo chu kỳ.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleSubmit">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Mã chu kỳ <span class="text-danger">*</span></label>
                                <input
                                    v-model.trim="localState.code"
                                    type="text"
                                    class="form-control"
                                    maxlength="50"
                                    :disabled="submitting"
                                />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Tên chu kỳ</label>
                                <input
                                    v-model.trim="localState.name"
                                    type="text"
                                    class="form-control"
                                    maxlength="255"
                                    :disabled="submitting"
                                />
                            </div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Ngày bắt đầu <span class="text-danger">*</span></label>
                                    <input
                                        v-model="localState.startDate"
                                        type="date"
                                        class="form-control"
                                        :disabled="submitting"
                                    />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Ngày kết thúc <span class="text-danger">*</span></label>
                                    <input
                                        v-model="localState.endDate"
                                        type="date"
                                        class="form-control"
                                        :disabled="submitting"
                                    />
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="form-label">Trạng thái</label>
                                <select v-model="localState.status" class="form-select" :disabled="submitting">
                                    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </div>

                            <div class="mt-3">
                                <label class="form-label">Ghi chú</label>
                                <textarea
                                    v-model.trim="localState.notes"
                                    class="form-control"
                                    rows="3"
                                    maxlength="2000"
                                    :disabled="submitting"
                                ></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="hide" :disabled="submitting">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary" :disabled="submitting">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                                Lưu
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {computed, reactive, ref, onMounted, onBeforeUnmount} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'

const props = defineProps({
    submitting: {
        type: Boolean,
        default: false
    },
    statusOptions: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['submit'])

const modal = ref(null)
let modalInstance = null

const EMPTY_FORM = Object.freeze({
    id: null,
    code: '',
    name: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT',
    notes: ''
})

const localState = reactive({...EMPTY_FORM})

const statusOptions = computed(() => {
    if (!props.statusOptions.length) {
        return [
            {value: 'DRAFT', label: 'Nháp'},
            {value: 'IN_PROGRESS', label: 'Đang xử lý'},
            {value: 'READY_FOR_APPROVAL', label: 'Chờ phê duyệt'},
            {value: 'APPROVED', label: 'Đã phê duyệt'},
            {value: 'CLOSED', label: 'Đã chốt'}
        ]
    }
    return props.statusOptions
})

const show = (cycle = null) => {
    if (cycle) {
        Object.assign(localState, {
            id: cycle.id ?? null,
            code: cycle.code ?? '',
            name: cycle.name ?? '',
            startDate: cycle.startDate ?? '',
            endDate: cycle.endDate ?? '',
            status: cycle.status ?? 'DRAFT',
            notes: cycle.notes ?? ''
        })
    } else {
        Object.assign(localState, {...EMPTY_FORM})
    }
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

const validate = () => {
    if (!localState.code) {
        toast.warning('Mã chu kỳ lương là bắt buộc.')
        return false
    }
    if (!localState.startDate || !localState.endDate) {
        toast.warning('Vui lòng chọn đủ ngày bắt đầu và kết thúc.')
        return false
    }
    if (localState.endDate < localState.startDate) {
        toast.warning('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.')
        return false
    }
    return true
}

const handleSubmit = () => {
    if (!validate()) return
    emit('submit', {
        id: localState.id,
        code: localState.code,
        name: localState.name || null,
        startDate: localState.startDate,
        endDate: localState.endDate,
        status: localState.status || null,
        notes: localState.notes || null
    })
}

const exposed = {show, hide}

defineExpose(exposed)

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})
</script>

<style scoped lang="scss">
.modal-body {
    max-height: 70vh;
    overflow-y: auto;
}
</style>
