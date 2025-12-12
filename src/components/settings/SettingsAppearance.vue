<template>
  <div class="settings-section">
    <header class="settings-section__header">
      <div class="settings-section__title-group">
        <div class="settings-section__icon-wrapper">
          <i class="bi bi-palette settings-section__icon" />
        </div>
        <div>
          <h2 class="settings-section__title">
            Giao diện
          </h2>
          <p class="settings-section__description">
            Tùy chỉnh theme, màu sắc và giao diện hệ thống
          </p>
        </div>
      </div>
    </header>

    <div class="settings-section__content">
      <!-- Tabs -->
      <div class="appearance-tabs">
        <div class="appearance-tabs__header">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="appearance-tabs__tab"
            :class="{ 'appearance-tabs__tab--active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="`bi ${tab.icon}`" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div class="appearance-tabs__content">
          <!-- Theme Tab -->
          <div
            v-if="activeTab === 'theme'"
            class="appearance-tabs__panel"
          >
            <div class="appearance-tabs__panel-section">
              <h3 class="appearance-tabs__panel-title">
                <i class="bi bi-palette-fill" />
                Theme Có Sẵn
              </h3>
              <ThemeSelector />
            </div>
            <div class="appearance-tabs__panel-section">
              <h3 class="appearance-tabs__panel-title">
                <i class="bi bi-paint-bucket" />
                Tạo Theme Tùy Chỉnh
              </h3>
              <ThemeBuilder />
            </div>
          </div>

          <!-- Layout Tab -->
          <div
            v-if="activeTab === 'layout'"
            class="appearance-tabs__panel"
          >
            <LayoutCustomizer />
          </div>

          <!-- Components Tab -->
          <div
            v-if="activeTab === 'components'"
            class="appearance-tabs__panel"
          >
            <ComponentStyling />
          </div>

          <!-- Accessibility Tab -->
          <div
            v-if="activeTab === 'accessibility'"
            class="appearance-tabs__panel"
          >
            <DarkModeAdvanced />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ThemeSelector from '@/components/common/ThemeSelector.vue'
import ThemeBuilder from '@/components/settings/ThemeBuilder.vue'
import LayoutCustomizer from '@/components/settings/LayoutCustomizer.vue'
import ComponentStyling from '@/components/settings/ComponentStyling.vue'
import DarkModeAdvanced from '@/components/settings/DarkModeAdvanced.vue'

const activeTab = ref('theme')

const tabs = [
    {
        id: 'theme',
        label: 'Theme',
        icon: 'bi-palette-fill'
    },
    {
        id: 'layout',
        label: 'Bố cục',
        icon: 'bi-layout-sidebar'
    },
    {
        id: 'components',
        label: 'Component',
        icon: 'bi-paint-bucket'
    },
    {
        id: 'accessibility',
        label: 'Truy cập',
        icon: 'bi-eye'
    }
]
</script>

<style scoped>
.settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.settings-section__header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: var(--spacing-3);
}

.settings-section__title-group {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.settings-section__icon-wrapper {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card-muted);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    flex-shrink: 0;
}

.settings-section__icon {
    font-size: var(--font-size-lg);
    color: var(--color-primary);
}

.settings-section__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.settings-section__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

.settings-section__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

/* Tabs */
.appearance-tabs {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.appearance-tabs__header {
    display: flex;
    gap: var(--spacing-2);
    border-bottom: 2px solid var(--color-border);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.appearance-tabs__tab {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-5);
    border: none;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
    position: relative;
    margin-bottom: -2px;
}

.appearance-tabs__tab:hover {
    color: var(--color-primary);
    background: var(--color-soft-primary);
}

.appearance-tabs__tab--active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: var(--color-soft-primary);
}

.appearance-tabs__tab i {
    font-size: var(--font-size-lg);
}

.appearance-tabs__content {
    min-height: 400px;
}

.appearance-tabs__panel {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.appearance-tabs__panel-section {
    margin-bottom: var(--spacing-8);
}

.appearance-tabs__panel-section:last-child {
    margin-bottom: 0;
}

.appearance-tabs__panel-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-4) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding-bottom: var(--spacing-3);
    border-bottom: 2px solid var(--color-border);
}

.appearance-tabs__panel-title i {
    color: var(--color-primary);
}

/* Responsive */
@media (max-width: 768px) {
    .appearance-tabs__header {
        gap: var(--spacing-1);
    }

    .appearance-tabs__tab {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-sm);
    }

    .appearance-tabs__tab span {
        display: none;
    }

    .appearance-tabs__tab i {
        font-size: var(--font-size-base);
    }
}
</style>
