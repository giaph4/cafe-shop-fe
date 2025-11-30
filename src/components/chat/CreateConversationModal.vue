<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tạo hội thoại mới</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs mb-3">
                            <li class="nav-item">
                                <button
                                    class="nav-link"
                                    :class="{ active: conversationType === 'direct' }"
                                    @click="conversationType = 'direct'"
                                >
                                    Trực tiếp
                                </button>
                            </li>
                            <li class="nav-item">
                                <button
                                    class="nav-link"
                                    :class="{ active: conversationType === 'group' }"
                                    @click="conversationType = 'group'"
                                >
                                    Nhóm
                                </button>
                            </li>
                        </ul>

                        <div v-if="conversationType === 'direct'">
                            <div v-if="loadingUsers" class="text-center py-3">
                                <div class="spinner-border spinner-border-sm text-primary"></div>
                                <span class="ms-2 text-muted">Đang tải danh sách người dùng...</span>
                            </div>
                            <div v-else>
                                <label class="form-label">Chọn người dùng <span class="text-danger">*</span></label>
                                <select class="form-select" v-model="selectedUserId" :disabled="submitting">
                                    <option value="">-- Chọn người dùng --</option>
                                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                                        {{ user.fullName || user.username }}
                                    </option>
                                </select>
                                <small class="text-muted" v-if="availableUsers.length === 0">
                                    Không có người dùng nào khả dụng
                                </small>
                            </div>
                        </div>

                        <div v-else>
                            <div class="mb-3">
                                <label class="form-label">Tên nhóm <span class="text-danger">*</span></label>
                                <input
                                    type="text"
                                    class="form-control"
                                    v-model="groupTitle"
                                    placeholder="Nhập tên nhóm"
                                    :disabled="submitting"
                                />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Thành viên <span class="text-danger">*</span></label>
                                <div v-if="loadingUsers" class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm text-primary"></div>
                                    <span class="ms-2 text-muted">Đang tải danh sách người dùng...</span>
                                </div>
                                <div v-else class="member-selection">
                                    <div
                                        v-for="user in availableUsers"
                                        :key="user.id"
                                        class="form-check"
                                    >
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            :id="`user-${user.id}`"
                                            :value="user.id"
                                            v-model="selectedMemberIds"
                                            :disabled="submitting"
                                        />
                                        <label class="form-check-label" :for="`user-${user.id}`">
                                            {{ user.fullName || user.username }}
                                        </label>
                                    </div>
                                    <small class="text-muted" v-if="availableUsers.length === 0">
                                        Không có người dùng nào khả dụng
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide" :disabled="submitting">
                            Hủy
                        </button>
                        <button
                            type="button"
                            class="btn btn-primary"
                            @click="handleSubmit"
                            :disabled="!canSubmit || submitting"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                            Tạo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Modal } from 'bootstrap'
import { getUsers } from '@/api/userService'
import { createDirectConversation, createGroupConversation } from '@/api/chat/conversationService'
import { toast } from 'vue3-toastify'

const emit = defineEmits(['created', 'close'])

const modalRef = ref(null)
let modalInstance = null

const conversationType = ref('direct')
const selectedUserId = ref(null)
const groupTitle = ref('')
const selectedMemberIds = ref([])
const availableUsers = ref([])
const loadingUsers = ref(false)
const submitting = ref(false)

const canSubmit = computed(() => {
    if (submitting.value) return false
    if (conversationType.value === 'direct') {
        return selectedUserId.value !== null
    }
    return groupTitle.value.trim().length > 0 && selectedMemberIds.value.length > 0
})

const loadUsers = async () => {
    loadingUsers.value = true
    try {
        const response = await getUsers({ size: 100 })
        availableUsers.value = response.content || []
    } catch (err) {
        toast.error('Không thể tải danh sách người dùng.')
    } finally {
        loadingUsers.value = false
    }
}

const handleSubmit = async () => {
    if (!canSubmit.value) return

    submitting.value = true
    try {
        let conversation
        if (conversationType.value === 'direct') {
            conversation = await createDirectConversation(selectedUserId.value)
        } else {
            conversation = await createGroupConversation(groupTitle.value.trim(), selectedMemberIds.value)
        }
        toast.success('Đã tạo hội thoại thành công.')
        emit('created', conversation)
        hide()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tạo hội thoại.')
    } finally {
        submitting.value = false
    }
}

const show = () => {
    conversationType.value = 'direct'
    selectedUserId.value = null
    groupTitle.value = ''
    selectedMemberIds.value = []
    loadUsers()
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
    emit('close')
}

onMounted(() => {
    modalInstance = new Modal(modalRef.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped lang="scss">
.member-selection {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--component-radius-sm);
    padding: var(--component-gap-sm);
    background: var(--color-card-muted);
}

.form-check {
    padding: 0.5rem 0;
}
</style>

