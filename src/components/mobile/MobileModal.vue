<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade mobile-modal"
      :class="{ 'mobile-modal--fullscreen': isMobile }"
      tabindex="-1"
    >
      <div
        class="modal-dialog"
        :class="{
          'modal-dialog-centered': !isMobile,
          'modal-fullscreen': isMobile,
          [`modal-${size}`]: !isMobile && size
        }"
      >
        <div class="modal-content">
          <div class="modal-header">
            <div
              v-if="title"
              class="modal-header__content"
            >
              <h5 class="modal-title">
                <i
                  v-if="icon"
                  :class="icon"
                  class="me-2"
                />
                {{ title }}
              </h5>
              <p
                v-if="subtitle"
                class="modal-subtitle mb-0"
              >
                {{ subtitle }}
              </p>
            </div>
            <slot name="header" />
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="hide"
            />
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="modal-footer"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useModal } from '@/composables/useModal'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

defineProps({
    title: {
        type: String,
        default: null
    },
    subtitle: {
        type: String,
        default: null
    },
    icon: {
        type: String,
        default: null
    },
    size: {
        type: String,
        default: null,
        validator: (value) => !value || ['sm', 'lg', 'xl'].includes(value)
    },
    fullscreen: {
        type: Boolean,
        default: false
    }
})

const { isMobile } = useDeviceDetection()
const { modalRef, show, hide } = useModal({
    backdrop: true,
    keyboard: true
})

defineExpose({
    show,
    hide
})
</script>

<style scoped>
.mobile-modal {
    /* z-index được quản lý bởi base.css */
}

.mobile-modal--fullscreen :deep(.modal-dialog) {
    margin: 0;
    max-width: 100%;
    height: 100%;
}

.mobile-modal--fullscreen :deep(.modal-content) {
    height: 100%;
    border-radius: 0;
    display: flex;
    flex-direction: column;
}

.mobile-modal--fullscreen :deep(.modal-body) {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.mobile-modal :deep(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
    flex-shrink: 0;
}

.mobile-modal :deep(.modal-title) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
}

.mobile-modal :deep(.modal-subtitle) {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

.mobile-modal :deep(.modal-body) {
    padding: var(--spacing-4);
}

.mobile-modal :deep(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4);
    flex-shrink: 0;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .mobile-modal :deep(.modal-header),
    .mobile-modal :deep(.modal-body),
    .mobile-modal :deep(.modal-footer) {
        padding: var(--spacing-3);
    }

    .mobile-modal :deep(.modal-title) {
        font-size: var(--font-size-lg);
    }

    .mobile-modal :deep(.btn) {
        min-height: 44px; /* Touch-friendly */
        padding: var(--spacing-2) var(--spacing-4);
    }
}

/* Safe area for devices with notch */
@supports (padding-top: env(safe-area-inset-top)) {
    .mobile-modal--fullscreen :deep(.modal-content) {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
    }
}
</style>

