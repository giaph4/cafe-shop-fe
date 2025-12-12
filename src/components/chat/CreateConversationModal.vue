<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              Tạo hội thoại mới
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
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
              <div
                v-if="loadingUsers"
                class="text-center py-3"
              >
                <div
                  class="spinner-border spinner-border-sm"
                  style="color: var(--color-primary);"
                />
                <span class="ms-2 text-muted">Đang tải danh sách người dùng...</span>
              </div>
              <div v-else>
                <label class="form-label">Chọn người dùng <span class="text-danger">*</span></label>
                <select
                  v-model="selectedUserId"
                  class="form-select"
                  :disabled="submitting"
                >
                  <option value="">
                    -- Chọn người dùng --
                  </option>
                  <option
                    v-for="user in availableUsers"
                    :key="user.id"
                    :value="user.id"
                  >
                    {{ user.fullName || user.username }}
                  </option>
                </select>
                <small
                  v-if="availableUsers.length === 0"
                  class="text-muted"
                >
                  Không có người dùng nào khả dụng
                </small>
              </div>
            </div>

            <div v-else>
              <div class="mb-3">
                <label class="form-label">Tên nhóm <span class="text-danger">*</span></label>
                <input
                  v-model="groupTitle"
                  type="text"
                  class="form-control"
                  placeholder="Nhập tên nhóm"
                  :disabled="submitting"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Thành viên <span class="text-danger">*</span></label>
                <div
                  v-if="loadingUsers"
                  class="text-center py-3"
                >
                  <div
                    class="spinner-border spinner-border-sm"
                    style="color: var(--color-primary);"
                  />
                  <span class="ms-2 text-muted">Đang tải danh sách người dùng...</span>
                </div>
                <div
                  v-else
                  class="member-selection"
                >
                  <div
                    v-for="user in availableUsers"
                    :key="user.id"
                    class="form-check"
                  >
                    <input
                      :id="`user-${user.id}`"
                      v-model="selectedMemberIds"
                      class="form-check-input"
                      type="checkbox"
                      :value="user.id"
                      :disabled="submitting"
                    >
                    <label
                      class="form-check-label"
                      :for="`user-${user.id}`"
                    >
                      {{ user.fullName || user.username }}
                    </label>
                  </div>
                  <small
                    v-if="availableUsers.length === 0"
                    class="text-muted"
                  >
                    Không có người dùng nào khả dụng
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="submitting"
              @click="hide"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!canSubmit || submitting"
              @click="handleSubmit"
            >
              <span
                v-if="submitting"
                class="spinner-border spinner-border-sm me-2"
              />
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
    } catch {
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

<style scoped>
/* Create Conversation Modal - Chuẩn hóa theo base.css */
.create-conversation-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.create-conversation-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.create-conversation-modal :global(.modal-body) {
    padding: var(--spacing-5);
    background: var(--color-card);
}

.create-conversation-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
    gap: var(--spacing-2);
}

.create-conversation-modal :global(.modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Tabs - Chuẩn hóa */
.create-conversation-modal :global(.nav-tabs) {
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-4);
    gap: var(--spacing-2);
}

.create-conversation-modal :global(.nav-tabs .nav-link) {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.nav-tabs .nav-link:hover:not(.active)) {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.create-conversation-modal :global(.nav-tabs .nav-link.active) {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-bottom: 2px solid var(--color-primary);
}

/* Form - Chuẩn hóa */
.create-conversation-modal :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.form-control),
.create-conversation-modal :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-text);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.form-control:focus),
.create-conversation-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.create-conversation-modal :global(.form-control:disabled),
.create-conversation-modal :global(.form-select:disabled) {
    background: var(--color-card-muted);
    opacity: 0.6;
    cursor: not-allowed;
}

.member-selection {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2);
    background: var(--color-card-muted);
}

.create-conversation-modal :global(.form-check) {
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-base);
}

.create-conversation-modal :global(.form-check:hover) {
    background: var(--color-card);
}

.create-conversation-modal :global(.form-check-label) {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.form-check-input) {
    margin-top: 0.25em;
}

.create-conversation-modal :global(small.text-muted) {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    display: block;
    margin-top: var(--spacing-2);
}

/* Buttons - Chuẩn hóa */
.create-conversation-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    gap: 6px;
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

.create-conversation-modal :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.create-conversation-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    color: var(--color-text);
    background: transparent;
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.create-conversation-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

/* Responsive */
@media (max-width: 768px) {
    .create-conversation-modal :global(.modal-dialog) {
        max-width: 90%;
        margin: var(--spacing-4) auto;
    }

    .create-conversation-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }
}
</style>

