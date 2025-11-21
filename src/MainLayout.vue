<template>
    <div class="layout" :class="{ 'layout--has-overlay': isMobile && sidebarStore.isMobileOpen }">
        <Sidebar :is-mobile="isMobile" />

        <div class="layout__main">
            <Topbar :is-sidebar-collapsed="sidebarToggleState" @toggleSidebar="toggleSidebar" />
            <main class="layout__content">
                <router-view />
            </main>
        </div>
        <transition name="layout-overlay">
            <div
                v-if="isMobile && sidebarStore.isMobileOpen"
                class="layout__overlay"
                role="presentation"
                @click="sidebarStore.closeMobile"
            ></div>
        </transition>
    </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import {useSidebarStore} from '@/store/sidebar'

const sidebarStore = useSidebarStore()
const isMobile = ref(false)

const handleResize = () => {
    const mobile = window.innerWidth <= 992
    if (mobile !== isMobile.value) {
        isMobile.value = mobile
        if (!mobile) {
            sidebarStore.closeMobile()
        }
    }
}

onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize, {passive: true})
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
})

const toggleSidebar = () => {
    if (isMobile.value) {
        sidebarStore.toggleMobile()
        return
    }
    sidebarStore.toggleCollapsed()
}

const sidebarToggleState = computed(() => (isMobile.value ? !sidebarStore.isMobileOpen : sidebarStore.isCollapsed))
</script>

<style scoped>
.layout {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    min-height: 100vh;
    color: var(--color-text);
}

.layout__main {
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 1.75rem 2.25rem 2.5rem;
    transition: padding 0.24s var(--transition-ease, cubic-bezier(0.4, 0, 0.2, 1));
}

.layout__content {
    flex: 1;
    margin-top: 1.75rem;
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
        padding: 1.5rem 1.4rem 2.25rem;
    }
}
</style>
