<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade shortcuts-help-modal"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                <i class="bi bi-keyboard" />
                Keyboard Shortcuts
              </h5>
              <p class="modal-subtitle mb-0">
                Danh sách tất cả các phím tắt có sẵn
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>

          <div class="modal-body">
            <div
              v-for="(category, categoryKey) in allShortcuts"
              :key="categoryKey"
              class="shortcuts-help__category"
            >
              <h6 class="shortcuts-help__category-title">
                {{ getCategoryLabel(categoryKey) }}
              </h6>
              <div class="shortcuts-help__list">
                <div
                  v-for="(shortcut, action) in category"
                  :key="action"
                  class="shortcuts-help__item"
                >
                  <div class="shortcuts-help__item-content">
                    <div class="shortcuts-help__item-description">
                      {{ shortcut.description }}
                    </div>
                    <div class="shortcuts-help__item-keys">
                      <kbd
                        v-for="(key, index) in formatShortcutKeys(shortcut)"
                        :key="index"
                        class="shortcuts-help__key"
                      >
                        {{ key }}
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="hide"
            >
              Đóng
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleGoToSettings"
            >
              <i class="bi bi-gear me-2" />
              Tùy chỉnh Shortcuts
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useModal } from '@/composables/useModal'
import { useShortcutsStore } from '@/store/shortcuts'
import { useRouter } from 'vue-router'

const { modalRef, show, hide } = useModal({
    backdrop: true,
    keyboard: true
})
const shortcutsStore = useShortcutsStore()
const router = useRouter()

const allShortcuts = computed(() => shortcutsStore.getAllShortcuts)

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

const handleGoToSettings = () => {
    hide()
    router.push('/settings?tab=shortcuts')
    // Trigger settings modal open
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('shortcut:open-settings'))
    }, 300)
}

defineExpose({
    show,
    hide
})
</script>

<style scoped>
.shortcuts-help-modal .modal-header__content {
    flex: 1;
}

.shortcuts-help-modal .modal-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.shortcuts-help__category {
    margin-bottom: var(--spacing-5);
}

.shortcuts-help__category:last-child {
    margin-bottom: 0;
}

.shortcuts-help__category-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-2);
    border-bottom: 2px solid var(--color-border);
}

.shortcuts-help__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.shortcuts-help__item {
    display: flex;
    align-items: center;
    padding: var(--spacing-3);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
}

.shortcuts-help__item:hover {
    background: var(--color-bg);
    border-color: var(--color-border-strong);
}

.shortcuts-help__item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: var(--spacing-4);
}

.shortcuts-help__item-description {
    font-size: var(--font-size-base);
    color: var(--color-text);
    flex: 1;
}

.shortcuts-help__item-keys {
    display: flex;
    gap: var(--spacing-1);
    align-items: center;
}

.shortcuts-help__key {
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

.shortcuts-help__key:not(:last-child)::after {
    content: '+';
    margin-left: 8px;
    color: var(--color-text-muted);
}
</style>

