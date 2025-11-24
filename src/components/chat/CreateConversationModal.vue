<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalElement" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tạo cuộc trò chuyện mới</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <!-- Conversation Type -->
                            <div class="mb-3">
                                <label class="form-label">Loại cuộc trò chuyện</label>
                                <div class="btn-group w-100" role="group">
                                    <input 
                                        type="radio" 
                                        class="btn-check" 
                                        id="typeDirect" 
                                        value="direct"
                                        v-model="conversationType"
                                        :disabled="submitting"
                                    >
                                    <label class="btn btn-outline-primary" for="typeDirect">
                                        <i class="bi bi-person me-1"></i>
                                        Trò chuyện riêng
                                    </label>
                                    <input 
                                        type="radio" 
                                        class="btn-check" 
                                        id="typeGroup" 
                                        value="group"
                                        v-model="conversationType"
                                        :disabled="submitting"
                                    >
                                    <label class="btn btn-outline-primary" for="typeGroup">
                                        <i class="bi bi-people me-1"></i>
                                        Nhóm
                                    </label>
                                </div>
                            </div>

                            <!-- Direct Conversation: Select User -->
                            <div v-if="conversationType === 'direct'" class="mb-3">
                                <label class="form-label">Chọn người dùng</label>
                                <select 
                                    class="form-select" 
                                    v-model="selectedUserId"
                                    :disabled="submitting || loadingUsers"
                                    required
                                >
                                    <option value="">-- Chọn người dùng --</option>
                                    <option 
                                        v-for="user in availableUsers" 
                                        :key="user.id" 
                                        :value="user.id"
                                    >
                                        {{ user.fullName || user.username }} ({{ user.username }})
                                    </option>
                                </select>
                                <div v-if="loadingUsers" class="form-text">
                                    <span class="spinner-border spinner-border-sm me-1"></span>
                                    Đang tải danh sách người dùng...
                                </div>
                            </div>

                            <!-- Group Conversation: Title and Members -->
                            <template v-if="conversationType === 'group'">
                                <div class="mb-3">
                                    <label class="form-label">Tên nhóm <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        v-model="groupTitle"
                                        :disabled="submitting"
                                        placeholder="Nhập tên nhóm"
                                        required
                                        maxlength="100"
                                    >
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Thành viên</label>
                                    <div class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                                        <div v-if="loadingUsers" class="text-center py-3">
                                            <span class="spinner-border spinner-border-sm me-2"></span>
                                            Đang tải danh sách người dùng...
                                        </div>
                                        <div v-else-if="availableUsers.length === 0" class="text-muted text-center py-3">
                                            Không có người dùng nào
                                        </div>
                                        <div v-else>
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
                                                >
                                                <label class="form-check-label" :for="`user-${user.id}`">
                                                    {{ user.fullName || user.username }}
                                                    <small class="text-muted">({{ user.username }})</small>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-text">
                                        Chọn ít nhất một thành viên để tạo nhóm
                                    </div>
                                </div>
                            </template>

                            <!-- Error Message -->
                            <div v-if="error" class="alert alert-danger mb-0">
                                {{ error }}
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            @click="hide"
                            :disabled="submitting"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="handleSubmit"
                            :disabled="submitting || !canSubmit"
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { Modal } from 'bootstrap'
import { createDirectConversation, createGroupConversation } from '@/api/chat/conversationService'
import { getUsers } from '@/api/userService'
import { useAuthStore } from '@/store/auth'
import { toast } from 'vue3-toastify'
import logger from '@/utils/logger'

const emit = defineEmits(['created', 'close'])

const modalElement = ref(null)
let modalInstance = null

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const conversationType = ref('direct')
const selectedUserId = ref(null)
const groupTitle = ref('')
const selectedMemberIds = ref([])
const availableUsers = ref([])
const loadingUsers = ref(false)
const submitting = ref(false)
const error = ref(null)

const canSubmit = computed(() => {
    if (submitting.value) return false
    if (conversationType.value === 'direct') {
        return !!selectedUserId.value
    } else {
        return !!groupTitle.value.trim() && selectedMemberIds.value.length > 0
    }
})

// Load available users (exclude current user)
const loadUsers = async () => {
    loadingUsers.value = true
    try {
        const response = await getUsers({ page: 0, size: 1000 })
        const users = Array.isArray(response?.content) ? response.content : (Array.isArray(response) ? response : [])
        // Filter out current user
        availableUsers.value = users.filter(u => u.id !== currentUserId.value)
    } catch (err) {
        logger.warn('Failed to load users:', err)
        availableUsers.value = []
        error.value = 'Không thể tải danh sách người dùng.'
    } finally {
        loadingUsers.value = false
    }
}

watch(() => conversationType.value, () => {
    // Reset form when type changes
    selectedUserId.value = null
    groupTitle.value = ''
    selectedMemberIds.value = []
    error.value = null
})

const handleSubmit = async () => {
    if (!canSubmit.value) return

    submitting.value = true
    error.value = null

    try {
        let conversation
        if (conversationType.value === 'direct') {
            conversation = await createDirectConversation(selectedUserId.value)
        } else {
            conversation = await createGroupConversation({
                title: groupTitle.value.trim(),
                memberIds: selectedMemberIds.value
            })
        }
        
        toast.success('Đã tạo cuộc trò chuyện thành công.')
        emit('created', conversation)
        hide()
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tạo cuộc trò chuyện.'
        toast.error(error.value)
    } finally {
        submitting.value = false
    }
}

const reset = () => {
    conversationType.value = 'direct'
    selectedUserId.value = null
    groupTitle.value = ''
    selectedMemberIds.value = []
    error.value = null
}

const show = () => {
    if (modalInstance) {
        reset()
        modalInstance.show()
        loadUsers()
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
    emit('close')
}

onMounted(() => {
    modalInstance = new Modal(modalElement.value, { backdrop: 'static' })
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
.modal-body {
    max-height: 70vh;
    overflow-y: auto;
}
</style>

