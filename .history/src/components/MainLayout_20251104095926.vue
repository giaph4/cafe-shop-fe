<template>
    <div class="main-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <Sidebar :is-collapsed="isSidebarCollapsed" />

        <div class="main-content-wrapper">
            <Topbar :is-sidebar-collapsed="isSidebarCollapsed" @toggle-sidebar="toggleSidebar" />

            <main class="page-content container-fluid">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'

// Quản lý trạng thái thu gọn của sidebar
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>