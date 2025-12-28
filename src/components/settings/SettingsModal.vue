<template>
  <Teleport to="body">
    <div
      ref="modalRef"
      class="modal fade settings-modal"
      tabindex="-1"
      aria-labelledby="settingsModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                <i class="bi bi-gear-fill me-2" />
                Cài đặt hệ thống
              </h5>
              <p class="modal-subtitle">
                Quản lý cài đặt hệ thống, tài khoản, bảo mật và tùy chỉnh giao diện
              </p>
            </div>
            <button
              type="button"
              class="settings-modal__close"
              aria-label="Đóng"
              @click="hide"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <div class="modal-body">
            <div class="settings-modal__layout">
              <!-- Sidebar Navigation -->
              <aside class="settings-modal__sidebar">
                <nav class="settings-modal__nav">
                  <button
                    v-for="section in sections"
                    :key="section.id"
                    class="settings-modal__nav-item"
                    :class="{ 'settings-modal__nav-item--active': activeSection === section.id }"
                    @click="setActiveSection(section.id)"
                  >
                    <i :class="`bi ${section.icon} settings-modal__nav-icon`" />
                    <span class="settings-modal__nav-label">{{ section.label }}</span>
                  </button>
                </nav>
              </aside>

              <!-- Content Area -->
              <main class="settings-modal__content">
                <div class="settings-modal__content-inner">
                  <!-- General Settings -->
                  <SettingsGeneral v-if="activeSection === 'general'" />

                  <!-- Appearance Settings -->
                  <SettingsAppearance v-if="activeSection === 'appearance'" />

                  <!-- Account Settings -->
                  <SettingsAccount v-if="activeSection === 'account'" />

                  <!-- Security Settings -->
                  <SettingsSecurity v-if="activeSection === 'security'" />

                  <!-- Notifications Settings -->
                  <SettingsNotifications v-if="activeSection === 'notifications'" />

                  <!-- Advanced Settings -->
                  <SettingsAdvanced v-if="activeSection === 'advanced'" />

                  <!-- Shortcuts Settings -->
                  <SettingsShortcuts v-if="activeSection === 'shortcuts'" />
                </div>
              </main>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="hide"
            >
              <i class="bi bi-x-lg me-2" />
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useModal } from '@/composables/useModal'
import SettingsGeneral from '@/components/settings/SettingsGeneral.vue'
import SettingsAppearance from '@/components/settings/SettingsAppearance.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'
import SettingsNotifications from '@/components/settings/SettingsNotifications.vue'
import SettingsAdvanced from '@/components/settings/SettingsAdvanced.vue'
import SettingsShortcuts from '@/components/settings/SettingsShortcuts.vue'

const { modalRef, show, hide } = useModal({
    backdrop: true,
    keyboard: true
})

const activeSection = ref('general')

const sections = [
    {
        id: 'general',
        label: 'Chung',
        icon: 'bi-sliders',
        description: 'Cài đặt cơ bản hệ thống'
    },
    {
        id: 'appearance',
        label: 'Giao diện',
        icon: 'bi-palette',
        description: 'Tùy chỉnh theme và màu sắc'
    },
    {
        id: 'account',
        label: 'Tài khoản',
        icon: 'bi-person-circle',
        description: 'Thông tin tài khoản cá nhân'
    },
    {
        id: 'security',
        label: 'Bảo mật',
        icon: 'bi-shield-lock',
        description: 'Mật khẩu và bảo mật'
    },
    {
        id: 'notifications',
        label: 'Thông báo',
        icon: 'bi-bell',
        description: 'Cài đặt thông báo'
    },
    {
        id: 'advanced',
        label: 'Nâng cao',
        icon: 'bi-gear-wide-connected',
        description: 'Cài đặt nâng cao hệ thống'
    },
    {
        id: 'shortcuts',
        label: 'Phím tắt',
        icon: 'bi-keyboard',
        description: 'Tùy chỉnh keyboard shortcuts'
    }
]

const setActiveSection = (sectionId) => {
    activeSection.value = sectionId
}

// Expose các methods
defineExpose({
    show,
    hide
})
</script>

<style scoped>
.settings-modal {
  /* z-index được quản lý bởi base.css */
}

.settings-modal :deep(.modal-dialog) {
  max-width: 1400px;
  margin: 1.75rem auto;
}

.settings-modal :deep(.modal-content) {
  border: 1px solid var(--color-border);
  border-radius: var(--component-radius-lg, var(--radius-lg));
  background: var(--color-card);
  box-shadow: var(--shadow-modal, 0 4px 12px rgba(0, 0, 0, 0.15));
}

.settings-modal :deep(.modal-header) {
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-6);
  background: var(--color-card);
}

.modal-header__content {
  flex: 1;
}

.settings-modal :deep(.modal-title) {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-heading);
  margin: 0 0 var(--spacing-1) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.settings-modal :deep(.modal-title i) {
  color: var(--color-primary);
}

.settings-modal :deep(.modal-subtitle) {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.settings-modal :deep(.modal-body) {
  padding: 0;
  max-height: calc(100vh - 250px);
  overflow: hidden;
}

.settings-modal__layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0;
  height: 100%;
  min-height: 600px;
}

.settings-modal__sidebar {
  border-right: 1px solid var(--color-border);
  background: var(--color-card-muted);
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar) transparent;
}

.settings-modal__sidebar::-webkit-scrollbar {
  width: 6px;
}

.settings-modal__sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.settings-modal__sidebar::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar);
  border-radius: var(--radius-full);
}

.settings-modal__nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
}

.settings-modal__nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-base);
  color: var(--color-text);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-sans);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  position: relative;
}

.settings-modal__nav-item:hover {
  background: var(--color-card);
  color: var(--color-primary);
}

.settings-modal__nav-item--active {
  background: var(--color-card);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.settings-modal__nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.settings-modal__nav-icon {
  font-size: var(--font-size-lg);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-modal__nav-label {
  flex: 1;
  min-width: 0;
}

.settings-modal__content {
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  background: var(--color-card);
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar) transparent;
}

.settings-modal__content::-webkit-scrollbar {
  width: 6px;
}

.settings-modal__content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-modal__content::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar);
  border-radius: var(--radius-full);
}

.settings-modal__content-inner {
  padding: var(--spacing-6);
  min-height: 100%;
}

.settings-modal :deep(.modal-footer) {
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-4) var(--spacing-6);
  background: var(--color-card);
}

.settings-modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
  flex-shrink: 0;
  padding: 0;
}

.settings-modal__close:hover {
  background: var(--color-card-muted);
  border-color: var(--color-border-strong);
  color: var(--color-heading);
}

.settings-modal__close:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-soft-primary);
}

.settings-modal__close i {
  font-size: var(--font-size-base);
  line-height: 1;
}

/* Responsive */
@media (max-width: 1200px) {
  .settings-modal__layout {
    grid-template-columns: 200px 1fr;
  }
}

@media (max-width: 992px) {
  .settings-modal :deep(.modal-dialog) {
    max-width: 95vw;
    margin: 1rem;
  }

  .settings-modal__layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .settings-modal__sidebar {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    max-height: 200px;
  }

  .settings-modal__nav {
    flex-direction: row;
    overflow-x: auto;
    padding: var(--spacing-3);
  }

  .settings-modal__nav-item {
    white-space: nowrap;
    min-width: fit-content;
  }

  .settings-modal__nav-item--active::before {
    display: none;
  }

  .settings-modal__nav-item--active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-primary);
  }
}

@media (max-width: 576px) {
  .settings-modal :deep(.modal-header) {
    padding: var(--spacing-4);
  }

  .settings-modal :deep(.modal-title) {
    font-size: var(--font-size-xl);
  }

  .settings-modal__content-inner {
    padding: var(--spacing-4);
  }
}
</style>

