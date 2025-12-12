<template>
  <div
    class="layout"
    :class="{ 'layout--has-overlay': isMobile && sidebarStore.isMobileOpen }"
  >
    <Sidebar :is-mobile="isMobile" />

    <div
      class="layout__main"
      :style="{ marginLeft: mainMarginLeft }"
    >
      <Topbar
        :is-sidebar-collapsed="sidebarToggleState"
        @toggle-sidebar="toggleSidebar"
      />
      <main class="layout__content">
        <router-view v-slot="{ Component }">
          <Suspense>
            <template #default>
              <component :is="Component" />
            </template>
            <template #fallback>
              <LoadingSpinner />
            </template>
          </Suspense>
        </router-view>
      </main>
    </div>
    <transition name="layout-overlay">
      <div
        v-if="isMobile && sidebarStore.isMobileOpen"
        class="layout__overlay"
        role="presentation"
        @click="sidebarStore.closeMobile"
      />
    </transition>

    <!-- Global Components -->
    <CommandPalette ref="commandPaletteRef" />
    <ShortcutsHelp ref="shortcutsHelpRef" />
    <SettingsModal ref="settingsModalRef" />

    <!-- Mobile Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import CommandPalette from '@/components/common/CommandPalette.vue'
import ShortcutsHelp from '@/components/common/ShortcutsHelp.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import BottomNavigation from '@/components/mobile/BottomNavigation.vue'
import { useSidebarStore } from '@/store/sidebar'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

const sidebarStore = useSidebarStore()
const { isMobile: deviceIsMobile } = useDeviceDetection()
const isMobile = computed(() => deviceIsMobile.value)
const isAutoCollapsed = ref(false) // Track xem có phải tự động collapse không

const commandPaletteRef = ref(null)
const shortcutsHelpRef = ref(null)
const settingsModalRef = ref(null)

const handleResize = () => {
    const width = window.innerWidth
    const mobile = width <= 992
    const shouldCollapse = width <= 1200 && width > 992

    if (!mobile) {
        sidebarStore.closeMobile()
    }

    // Tự động collapse sidebar khi màn hình nhỏ (nhưng không phải mobile)
    if (!mobile && shouldCollapse) {
        if (!sidebarStore.isCollapsed) {
            sidebarStore.setCollapsed(true, { persist: false })
            isAutoCollapsed.value = true
        }
    } else if (!mobile && !shouldCollapse && width > 1200) {
        // Tự động mở rộng khi màn hình lớn hơn 1200px
        if (isAutoCollapsed.value && sidebarStore.isCollapsed) {
            sidebarStore.setCollapsed(false, { persist: false })
            isAutoCollapsed.value = false
        }
    }
}

// Setup global shortcuts
useKeyboardShortcuts({
    shortcuts: {
        'open-settings': {
            key: ',',
            modifiers: ['ctrl', 'meta'],
            handler: () => {
                settingsModalRef.value?.show()
            }
        }
    }
})

// Handle global shortcut events
const handleShortcutsHelp = () => {
    shortcutsHelpRef.value?.show()
}

const handleOpenSettings = () => {
    settingsModalRef.value?.show()
}

onMounted(() => {
    // Gọi ngay khi mount để set initial state
    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })

    // Đảm bảo collapse đúng khi load trang
    const width = window.innerWidth
    if (width <= 1200 && width > 992 && !sidebarStore.isCollapsed) {
        sidebarStore.setCollapsed(true, { persist: false })
        isAutoCollapsed.value = true
    }

    // Listen for shortcut events
    window.addEventListener('shortcut:shortcuts-help', handleShortcutsHelp)
    window.addEventListener('shortcut:open-settings', handleOpenSettings)

    // Add mobile-specific body class
    if (isMobile.value) {
        document.body.classList.add('is-mobile')
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('shortcut:shortcuts-help', handleShortcutsHelp)
    window.removeEventListener('shortcut:open-settings', handleOpenSettings)

    // Remove mobile body class
    document.body.classList.remove('is-mobile')
})

const toggleSidebar = () => {
    if (isMobile.value) {
        sidebarStore.toggleMobile()
        return
    }
    // Khi user toggle thủ công, reset auto collapse flag
    isAutoCollapsed.value = false
    sidebarStore.toggleCollapsed()
}

const sidebarToggleState = computed(() => (isMobile.value ? !sidebarStore.isMobileOpen : sidebarStore.isCollapsed))

const sidebarWidth = computed(() => {
    if (isMobile.value) return 0
    return sidebarStore.isCollapsed ? 76 : 278
})

const mainMarginLeft = computed(() => {
    if (isMobile.value) return 0
    return `${sidebarWidth.value}px`
})
</script>

<style scoped>
.layout {
    position: relative;
    min-height: 100vh;
    color: var(--color-text);
}

.layout__main {
    display: flex;
    flex-direction: column;
    position: relative;
    padding: calc(72px + 2rem) 2rem 2rem 2rem;
    transition: margin-left 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.layout__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.layout__overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.28);
    backdrop-filter: blur(2px);
    z-index: 88;
}

.layout--has-overlay {
    overflow: hidden;
}

.layout-overlay-enter-active,
.layout-overlay-leave-active {
    transition: opacity 0.18s ease;
}

.layout-overlay-enter-from,
.layout-overlay-leave-to {
    opacity: 0;
}


@media (max-width: 992px) {
    .layout {
        grid-template-columns: 1fr;
    }

    .layout__main {
        margin-left: 0 !important;
        padding: calc(72px + 1.5rem) 1.25rem 1.5rem;
        padding-bottom: calc(80px + 1.5rem); /* Space for bottom navigation */
    }
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .layout__main {
        padding: calc(72px + 1rem) 1rem 1rem;
        padding-bottom: calc(80px + 1rem);
    }

    .layout__content {
        gap: 1rem;
    }
}

/* Touch-friendly spacing */
@media (hover: none) and (pointer: coarse) {
    .layout__main {
        padding: calc(72px + 1.5rem) 1.25rem 1.5rem;
        padding-bottom: calc(80px + 1.5rem);
    }
}
</style>
