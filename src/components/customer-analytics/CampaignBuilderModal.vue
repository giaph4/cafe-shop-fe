<template>
    <Teleport to="body">
        <div
            class="campaign-builder-modal modal fade show"
            tabindex="-1"
            @click.self="handleClose"
            style="display: block; z-index: 1055;"
        >
            <div class="modal-backdrop fade show" @click="handleClose" style="z-index: 1050;"></div>
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style="z-index: 1056;">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title">Tạo Campaign</h5>
                            <p class="modal-subtitle mb-0">Tạo chiến dịch marketing cho phân loại khách hàng</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="handleClose"
                            aria-label="Đóng"
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Tính năng này sẽ được tích hợp với hệ thống voucher và email marketing trong tương lai.
                        </div>
                        <div class="form-section">
                            <label class="form-label">Phân loại khách hàng</label>
                            <input
                                type="text"
                                class="form-control clean-input"
                                :value="customerSegment || 'Tất cả'"
                                disabled
                            />
                        </div>
                        <div class="form-section">
                            <label class="form-label">Loại campaign</label>
                            <select class="form-select clean-input" v-model="formData.type">
                                <option value="voucher">Voucher giảm giá</option>
                                <option value="loyalty">Chương trình loyalty</option>
                                <option value="reengagement">Re-engagement</option>
                            </select>
                        </div>
                        <div class="form-section">
                            <label class="form-label">Mô tả</label>
                            <textarea
                                class="form-control clean-input"
                                v-model="formData.description"
                                rows="3"
                                placeholder="Mô tả chiến dịch..."
                            ></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-flat btn-flat--outline" @click="handleClose">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-flat btn-flat--primary" @click="handleCreate" :disabled="creating">
                            <span v-if="creating" class="spinner-border spinner-border-sm me-2"></span>
                            Tạo campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    customerSegment: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['close'])

const creating = ref(false)
const formData = ref({
    type: 'voucher',
    description: ''
})

const handleClose = () => {
    emit('close')
}

const handleCreate = async () => {
    creating.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Campaign đã được tạo thành công! (Tính năng demo)')
        handleClose()
    } catch (err) {
        console.error('Failed to create campaign', err)
        alert('Không thể tạo campaign. Vui lòng thử lại.')
    } finally {
        creating.value = false
    }
}
</script>

<style scoped>
.campaign-builder-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.alert-info {
    background: var(--color-soft-sky);
    border-color: var(--color-info);
    color: var(--color-text);
}

.form-section {
    margin-bottom: var(--spacing-4);
}

:deep(.form-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}
</style>

