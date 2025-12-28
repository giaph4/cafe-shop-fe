<template>
  <div class="settings-shortcuts">
    <div class="settings-shortcuts__header">
      <h5 class="settings-shortcuts__title">
        <i class="bi bi-keyboard" />
        Keyboard Shortcuts
      </h5>
      <p class="settings-shortcuts__subtitle">
        Tùy chỉnh các phím tắt để tăng tốc độ làm việc
      </p>
    </div>

    <div class="settings-shortcuts__actions">
      <button
        class="btn btn-outline-primary"
        @click="handleExport"
      >
        <i class="bi bi-download me-2" />
        Xuất cấu hình
      </button>
      <button
        class="btn btn-outline-secondary"
        @click="handleImport"
      >
        <i class="bi bi-upload me-2" />
        Nhập cấu hình
      </button>
      <button
        class="btn btn-outline-danger"
        @click="handleResetAll"
      >
        <i class="bi bi-arrow-counterclockwise me-2" />
        Đặt lại mặc định
      </button>
    </div>

    <div class="settings-shortcuts__content">
      <div
        v-for="(category, categoryKey) in allShortcuts"
        :key="categoryKey"
        class="settings-shortcuts__category"
      >
        <h6 class="settings-shortcuts__category-title">
          {{ getCategoryLabel(categoryKey) }}
        </h6>
        <div class="settings-shortcuts__list">
          <div
            v-for="(shortcut, action) in category"
            :key="action"
            class="settings-shortcuts__item"
          >
            <div class="settings-shortcuts__item-info">
              <div class="settings-shortcuts__item-description">
                {{ shortcut.description }}
              </div>
              <div class="settings-shortcuts__item-keys">
                <kbd
                  v-for="(key, index) in formatShortcutKeys(shortcut)"
                  :key="index"
                  class="settings-shortcuts__key"
                >
                  {{ key }}
                </kbd>
              </div>
            </div>
            <div class="settings-shortcuts__item-actions">
              <button
                v-if="isCustomShortcut(categoryKey, action)"
                class="btn btn-sm btn-outline-secondary"
                @click="handleReset(categoryKey, action)"
              >
                <i class="bi bi-arrow-counterclockwise" />
              </button>
              <button
                class="btn btn-sm btn-primary"
                @click="handleEdit(categoryKey, action, shortcut)"
              >
                <i class="bi bi-pencil" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Shortcut Modal -->
    <div
      v-if="editingShortcut"
      ref="editModalRef"
      class="modal fade show"
      style="display: block;"
      tabindex="-1"
      @click.self="cancelEdit"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <h5 class="modal-title">
              Chỉnh sửa Shortcut
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="cancelEdit"
            />
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">
                {{ editingShortcut.description }}
              </label>
              <div class="shortcut-editor">
                <div
                  v-if="!isRecording"
                  class="shortcut-editor__placeholder"
                >
                  Nhấn phím tắt mới...
                </div>
                <div
                  v-else
                  class="shortcut-editor__recording"
                >
                  <i class="bi bi-record-circle-fill text-danger" />
                  Đang ghi...
                </div>
                <div
                  v-if="recordedKeys.length > 0"
                  class="shortcut-editor__keys"
                >
                  <kbd
                    v-for="(key, index) in recordedKeys"
                    :key="index"
                    class="shortcut-editor__key"
                  >
                    {{ key }}
                  </kbd>
                </div>
              </div>
              <input
                ref="shortcutInput"
                type="text"
                class="form-control mt-2"
                :value="recordedShortcut"
                readonly
                @keydown="handleKeyDown"
                @keyup="handleKeyUp"
                @focus="startRecording"
                @blur="stopRecording"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!recordedShortcut"
              @click="saveEdit"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useShortcutsStore } from '@/store/shortcuts'
import { toast } from 'vue3-toastify'
import { useModal } from '@/composables/useModal'

const shortcutsStore = useShortcutsStore()
const { modalRef: editModalRef } = useModal()

const allShortcuts = computed(() => shortcutsStore.getAllShortcuts)

const editingShortcut = ref(null)
const isRecording = ref(false)
const recordedKeys = ref([])
const recordedShortcut = ref('')
const shortcutInput = ref(null)

const categoryLabels = {
    global: 'Toàn cục',
    dashboard: 'Dashboard',
    orders: 'Đơn hàng',
    products: 'Sản phẩm',
    customers: 'Khách hàng',
    table: 'Bảng dữ liệu'
}

const getCategoryLabel = (categoryKey) => categoryLabels[categoryKey] || categoryKey

const formatShortcutKeys = (shortcut) => {
    const keys = []
    const modifiers = shortcut.modifiers || []

    if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
        keys.push('Ctrl')
    }
    if (modifiers.includes('shift')) {
        keys.push('Shift')
    }
    if (modifiers.includes('alt')) {
        keys.push('Alt')
    }

    const mainKey = shortcut.key
    if (mainKey) {
        if (mainKey === ' ') {
            keys.push('Space')
        } else if (mainKey === 'Escape') {
            keys.push('Esc')
        } else {
            keys.push(mainKey.toUpperCase())
        }
    }

    return keys
}

const isCustomShortcut = (category, action) => Boolean(shortcutsStore.customShortcuts[category]?.[action])

const handleEdit = (category, action, shortcut) => {
    editingShortcut.value = {
        category,
        action,
        original: shortcut
    }
    recordedKeys.value = formatShortcutKeys(shortcut)
    recordedShortcut.value = formatShortcutString(shortcut)
    isRecording.value = false

    nextTick(() => {
        shortcutInput.value?.focus()
    })
}

const startRecording = () => {
    isRecording.value = true
    recordedKeys.value = []
    recordedShortcut.value = ''
}

const stopRecording = () => {
    isRecording.value = false
}

const handleKeyDown = (event) => {
    event.preventDefault()

    const keys = []
    if (event.ctrlKey || event.metaKey) keys.push('ctrl')
    if (event.shiftKey) keys.push('shift')
    if (event.altKey) keys.push('alt')

    let mainKey = event.key.toLowerCase()
    if (mainKey === ' ') mainKey = ' '
    if (mainKey === 'escape') mainKey = 'Escape'

    // Không thêm modifier keys làm main key
    if (!['control', 'shift', 'alt', 'meta'].includes(mainKey)) {
        keys.push(mainKey)
        recordedKeys.value = []
        if (event.ctrlKey || event.metaKey) recordedKeys.value.push('Ctrl')
        if (event.shiftKey) recordedKeys.value.push('Shift')
        if (event.altKey) recordedKeys.value.push('Alt')
        recordedKeys.value.push(mainKey === ' ' ? 'Space' : mainKey.toUpperCase())

        recordedShortcut.value = keys.join('+')
    }
}

const handleKeyUp = () => {
    // Dừng recording khi tất cả phím được thả ra
    if (recordedShortcut.value) {
        stopRecording()
    }
}

const formatShortcutString = (shortcut) => {
    const parts = []
    const modifiers = shortcut.modifiers || []
    if (modifiers.includes('ctrl') || modifiers.includes('meta')) parts.push('ctrl')
    if (modifiers.includes('shift')) parts.push('shift')
    if (modifiers.includes('alt')) parts.push('alt')
    if (shortcut.key) parts.push(shortcut.key)
    return parts.join('+')
}

const parseShortcutString = (str) => {
    const parts = str.toLowerCase().split('+').map(s => s.trim())
    const key = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)
    return { key, modifiers }
}

const saveEdit = () => {
    if (!recordedShortcut.value || !editingShortcut.value) return

    const { key, modifiers } = parseShortcutString(recordedShortcut.value)

    shortcutsStore.updateShortcut(
        editingShortcut.value.category,
        editingShortcut.value.action,
        {
            key,
            modifiers,
            description: editingShortcut.value.original.description
        }
    )

    toast.success('Đã cập nhật shortcut!')
    cancelEdit()
}

const cancelEdit = () => {
    editingShortcut.value = null
    recordedKeys.value = []
    recordedShortcut.value = ''
    isRecording.value = false
}

const handleReset = (category, action) => {
    shortcutsStore.resetShortcut(category, action)
    toast.success('Đã đặt lại shortcut về mặc định!')
}

const handleResetAll = () => {
    if (confirm('Bạn có chắc muốn đặt lại tất cả shortcuts về mặc định?')) {
        shortcutsStore.resetAllShortcuts()
        toast.success('Đã đặt lại tất cả shortcuts!')
    }
}

const handleExport = () => {
    const config = shortcutsStore.exportShortcuts()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shortcuts-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất cấu hình shortcuts!')
}

const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const success = shortcutsStore.importShortcuts(event.target.result)
                if (success) {
                    toast.success('Đã nhập cấu hình shortcuts!')
                } else {
                    toast.error('Lỗi khi nhập cấu hình!')
                }
            } catch {
                toast.error('File không hợp lệ!')
            }
        }
        reader.readAsText(file)
    }
    input.click()
}
</script>

<style scoped>
.settings-shortcuts {
    padding: var(--spacing-4);
}

.settings-shortcuts__header {
    margin-bottom: var(--spacing-4);
}

.settings-shortcuts__title {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2);
}

.settings-shortcuts__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.settings-shortcuts__actions {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
    flex-wrap: wrap;
}

.settings-shortcuts__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-shortcuts__category {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
}

.settings-shortcuts__category-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 2px solid var(--color-border);
}

.settings-shortcuts__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.settings-shortcuts__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.settings-shortcuts__item:hover {
    background: var(--color-bg);
    border-color: var(--color-border-strong);
}

.settings-shortcuts__item-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-4);
}

.settings-shortcuts__item-description {
    font-size: var(--font-size-base);
    color: var(--color-text);
}

.settings-shortcuts__item-keys {
    display: flex;
    gap: var(--spacing-1);
    align-items: center;
}

.settings-shortcuts__key {
    padding: 4px 8px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    font-family: monospace;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    min-width: 32px;
    text-align: center;
}

.settings-shortcuts__key:not(:last-child)::after {
    content: '+';
    margin-left: 8px;
    color: var(--color-text-muted);
}

.settings-shortcuts__item-actions {
    display: flex;
    gap: var(--spacing-2);
    margin-left: var(--spacing-4);
}

.shortcut-editor {
    min-height: 60px;
    padding: var(--spacing-3);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-muted);
}

.shortcut-editor__placeholder {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.shortcut-editor__recording {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    color: var(--color-danger);
    font-weight: var(--font-weight-semibold);
}

.shortcut-editor__keys {
    display: flex;
    gap: var(--spacing-1);
    align-items: center;
}

.shortcut-editor__key {
    padding: 4px 8px;
    background: var(--color-card);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
    font-family: monospace;
}
</style>

