<template>
  <div class="bulk-operation-history">
    <div class="bulk-operation-history__header">
      <h3>
        <i class="bi bi-clock-history me-2" />
        Lịch sử thao tác hàng loạt
      </h3>
      <button
        v-if="operations.length > 0"
        class="btn btn-sm btn-outline-secondary"
        type="button"
        @click="clearHistory"
      >
        <i class="bi bi-trash me-2" />
        Xóa lịch sử
      </button>
    </div>

    <div
      v-if="operations.length === 0"
      class="bulk-operation-history__empty"
    >
      <i class="bi bi-inbox" />
      <p>Chưa có thao tác nào</p>
    </div>

    <div
      v-else
      class="bulk-operation-history__list"
    >
      <div
        v-for="operation in operations"
        :key="operation.id"
        class="bulk-operation-history__item"
        :class="{
          'bulk-operation-history__item--success': operation.failedCount === 0,
          'bulk-operation-history__item--partial': operation.failedCount > 0 && operation.successCount > 0,
          'bulk-operation-history__item--failed': operation.successCount === 0
        }"
      >
        <div class="bulk-operation-history__item-header">
          <div class="bulk-operation-history__item-icon">
            <i
              class="bi"
              :class="{
                'bi-check-circle-fill text-success': operation.failedCount === 0,
                'bi-exclamation-triangle-fill text-warning': operation.failedCount > 0 && operation.successCount > 0,
                'bi-x-circle-fill text-danger': operation.successCount === 0
              }"
            />
          </div>
          <div class="bulk-operation-history__item-info">
            <div class="bulk-operation-history__item-title">
              {{ getActionLabel(operation.action) }}
            </div>
            <div class="bulk-operation-history__item-time">
              {{ formatTime(operation.timestamp) }}
            </div>
          </div>
          <div class="bulk-operation-history__item-stats">
            <span class="bulk-operation-history__stat">
              <i class="bi bi-check-circle text-success" />
              {{ operation.successCount }}
            </span>
            <span
              v-if="operation.failedCount > 0"
              class="bulk-operation-history__stat"
            >
              <i class="bi bi-x-circle text-danger" />
              {{ operation.failedCount }}
            </span>
          </div>
        </div>

        <div class="bulk-operation-history__item-details">
          <div class="bulk-operation-history__detail">
            <strong>Tổng số:</strong> {{ operation.selectedCount }} mục
          </div>
          <div
            v-if="operation.errors && operation.errors.length > 0"
            class="bulk-operation-history__errors"
          >
            <button
              class="bulk-operation-history__errors-toggle"
              type="button"
              @click="toggleErrors(operation.id)"
            >
              <i
                class="bi"
                :class="expandedErrors.has(operation.id) ? 'bi-chevron-up' : 'bi-chevron-down'"
              />
              {{ operation.errors.length }} lỗi
            </button>
            <div
              v-if="expandedErrors.has(operation.id)"
              class="bulk-operation-history__errors-list"
            >
              <div
                v-for="(error, index) in operation.errors"
                :key="index"
                class="bulk-operation-history__error-item"
              >
                <span class="bulk-operation-history__error-id">ID: {{ error.id }}</span>
                <span class="bulk-operation-history__error-message">{{ error.error }}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="operation.undone"
          class="bulk-operation-history__item-undo"
        >
          <i class="bi bi-arrow-counterclockwise" />
          Đã hoàn tác
        </div>

        <div
          v-else-if="operation.undoable"
          class="bulk-operation-history__item-actions"
        >
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
            @click="handleUndo(operation)"
          >
            <i class="bi bi-arrow-counterclockwise me-2" />
            Hoàn tác
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
    operations: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['undo', 'clear'])

const expandedErrors = ref(new Set())

const toggleErrors = (operationId) => {
    if (expandedErrors.value.has(operationId)) {
        expandedErrors.value.delete(operationId)
    } else {
        expandedErrors.value.add(operationId)
    }
}

const getActionLabel = (action) => {
    const labels = {
        delete: 'Xóa',
        update: 'Cập nhật',
        export: 'Xuất',
        assign: 'Phân công',
        tag: 'Gắn thẻ',
        activate: 'Kích hoạt',
        deactivate: 'Vô hiệu hóa'
    }
    return labels[action] || action
}

const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) {
        return 'Vừa xong'
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} phút trước`
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} giờ trước`
    }
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const handleUndo = (operation) => {
    emit('undo', operation)
}

const clearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
        emit('clear')
    }
}
</script>

<style scoped>
.bulk-operation-history {
    background: var(--color-card);
    border-radius: var(--radius-lg);
    padding: 20px;
}

.bulk-operation-history__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.bulk-operation-history__header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
}

.bulk-operation-history__empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--color-text-muted);
}

.bulk-operation-history__empty i {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.3;
}

.bulk-operation-history__empty p {
    margin: 0;
    font-size: 0.95rem;
}

.bulk-operation-history__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.bulk-operation-history__item {
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-card);
    transition: all 0.2s ease;
}

.bulk-operation-history__item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.bulk-operation-history__item--success {
    border-left: 4px solid var(--color-success);
}

.bulk-operation-history__item--partial {
    border-left: 4px solid #f59e0b;
}

.bulk-operation-history__item--failed {
    border-left: 4px solid #ef4444;
}

.bulk-operation-history__item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.bulk-operation-history__item-icon {
    font-size: 1.5rem;
}

.bulk-operation-history__item-info {
    flex: 1;
}

.bulk-operation-history__item-title {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 4px;
}

.bulk-operation-history__item-time {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.bulk-operation-history__item-stats {
    display: flex;
    gap: 12px;
}

.bulk-operation-history__stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
    font-weight: 500;
}

.bulk-operation-history__item-details {
    margin-bottom: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
}

.bulk-operation-history__detail {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-bottom: 8px;
}

.bulk-operation-history__errors {
    margin-top: 8px;
}

.bulk-operation-history__errors-toggle {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.bulk-operation-history__errors-toggle:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.bulk-operation-history__errors-list {
    margin-top: 8px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.05);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.bulk-operation-history__error-item {
    padding: 6px;
    background: var(--color-card);
    border-radius: 4px;
    font-size: 0.85rem;
    display: flex;
    gap: 8px;
}

.bulk-operation-history__error-id {
    font-weight: 600;
    color: var(--color-heading);
    min-width: 80px;
}

.bulk-operation-history__error-message {
    color: var(--color-text-muted);
}

.bulk-operation-history__item-undo {
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 6px;
    font-size: 0.85rem;
    color: #3b82f6;
    display: flex;
    align-items: center;
    gap: 6px;
}

.bulk-operation-history__item-actions {
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
}
</style>

