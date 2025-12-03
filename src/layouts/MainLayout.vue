<template>
    <div class="layout" :class="{ 'layout--has-overlay': isMobile && sidebarStore.isMobileOpen }">
        <Sidebar :is-mobile="isMobile" />

        <div class="layout__main" :style="{ marginLeft: mainMarginLeft }">
            <Topbar :is-sidebar-collapsed="sidebarToggleState" @toggleSidebar="toggleSidebar" />
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
            <div v-if="isMobile && sidebarStore.isMobileOpen" class="layout__overlay" role="presentation"
                @click="sidebarStore.closeMobile"></div>
        </transition>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, Suspense } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useSidebarStore } from '@/store/sidebar'

const sidebarStore = useSidebarStore()
const isMobile = ref(false)
const isAutoCollapsed = ref(false) // Track xem có phải tự động collapse không

const handleResize = () => {
    const width = window.innerWidth
    const mobile = width <= 992
    const shouldCollapse = width <= 1200 && width > 992
    
    if (mobile !== isMobile.value) {
        isMobile.value = mobile
        if (!mobile) {
            sidebarStore.closeMobile()
        }
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
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
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
    padding: calc(72px + 1.5rem) 1.5rem 1.5rem 1.5rem;
    transition: margin-left 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.24s var(--transition-ease, cubic-bezier(0.4, 0, 0.2, 1));
}

.layout__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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
        padding: calc(72px + 1.5rem) 1rem 1.5rem;
    }
}
</style>