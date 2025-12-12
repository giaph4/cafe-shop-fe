<template>
  <nav
    v-if="isMobile"
    class="bottom-navigation"
  >
    <router-link
      v-for="item in navigationItems"
      :key="item.id"
      :to="item.to"
      class="bottom-navigation__item"
      :class="{ 'bottom-navigation__item--active': isActive(item.to) }"
      @click="handleClick"
    >
      <i :class="item.icon" />
      <span class="bottom-navigation__label">{{ item.label }}</span>
      <span
        v-if="item.badge"
        class="bottom-navigation__badge"
      >{{ item.badge }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDeviceDetection } from '@/composables/useDeviceDetection'
import { navigationSections } from '@/config/navigation'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const { isMobile } = useDeviceDetection()
const authStore = useAuthStore()

const navigationItems = computed(() => {
    const items = []

    // Get main navigation items from config
    navigationSections.forEach(section => {
        section.items.forEach(item => {
            if (item.to && item.mobile !== false) {
                // Check role permission
                const hasPermission = !item.roles ||
                    item.roles.some(role => authStore.userRoles.includes(role))

                if (hasPermission) {
                    items.push({
                        id: item.id,
                        label: item.label,
                        icon: item.icon || 'bi bi-circle',
                        to: item.to,
                        badge: item.badge
                    })
                }
            }
        })
    })

    // Limit to 5 items for bottom navigation
    return items.slice(0, 5)
})

const isActive = (path) => route.path === path || route.path.startsWith(`${path  }/`)

const handleClick = () => {
    // Close mobile sidebar if open
    // This will be handled by the layout
}
</script>

<style scoped>
.bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-1);
    z-index: 1000;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    height: 64px;
}

.bottom-navigation__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1);
    padding: var(--spacing-2);
    color: var(--color-text-muted);
    text-decoration: none;
    transition: all var(--transition-base);
    position: relative;
    flex: 1;
    min-width: 0;
    border-radius: var(--radius-base);
}

.bottom-navigation__item:hover {
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

.bottom-navigation__item--active {
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

.bottom-navigation__item i {
    font-size: 20px;
    line-height: 1;
}

.bottom-navigation__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.bottom-navigation__badge {
    position: absolute;
    top: 4px;
    right: 8px;
    background: var(--color-danger);
    color: white;
    font-size: 10px;
    font-weight: var(--font-weight-bold);
    padding: 2px 5px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    line-height: 1.2;
}

/* Safe area for devices with notch */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .bottom-navigation {
        padding-bottom: calc(var(--spacing-2) + env(safe-area-inset-bottom));
    }
}
</style>

