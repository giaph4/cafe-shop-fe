<template>
    <aside class="sidebar-wrapper" data-aos="fade-right">
        <nav class="sidebar-menu">
            <ul class="nav flex-column">
                <li class="nav-item-title">Menu</li>
                <li class="nav-item" v-for="link in mainLinks" :key="link.name">
                </li>

                <li class="nav-item-title">Quản lý Kho</li>
                <li class="nav-item" v-for="link in inventoryLinks" :key="link.name">
                </li>

                <li class="nav-item-title">Hệ thống</li>
                <li class="nav-item" v-for="link in systemLinks" :key="link.name"> <router-link :to="link.to"
                        class="nav-link">
                        <i :class="link.icon"></i>
                        <span>{{ link.name }}</span>
                    </router-link>
                </li>
            </ul>
        </nav>

    </aside>
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
const authStore = useAuthStore()

defineProps({
    isCollapsed: Boolean
})

const mainLinks = [
    { name: 'Tổng quan', to: '/', icon: 'bi bi-grid-1x2-fill' },
    { name: 'Quản lý Bán hàng', to: '/orders', icon: 'bi bi-receipt-cutoff' },
    { name: 'Quản lý Bàn', to: '/tables', icon: 'bi bi-table' },
    { name: 'Quản lý Sản phẩm', to: '/products', icon: 'bi bi-cup-straw' },
    { name: 'Quản lý Danh mục', to: '/categories', icon: 'bi bi-tags-fill' },
]

const inventoryLinks = [
    { name: 'Quản lý Nhập hàng', to: '/purchase-orders', icon: 'bi bi-truck' },
    { name: 'Quản lý Nguyên liệu', to: '/ingredients', icon: 'bi bi-archive-fill' },
    { name: 'Quản lý NCC', to: '/suppliers', icon: 'bi bi-person-lines-fill' },
    { name: 'Quản lý Chi phí', to: '/expenses', icon: 'bi bi-wallet2' },
]

const systemLinks = [ // <-- SỬA Ở ĐÂY
    { name: 'Quản lý Nhân viên', to: '/staff', icon: 'bi bi-people-fill' },
    { name: 'Báo cáo', to: '/reports', icon: 'bi bi-bar-chart-line-fill' },
]

</script>

<style scoped>
/* Scoped styles nếu cần */
</style>