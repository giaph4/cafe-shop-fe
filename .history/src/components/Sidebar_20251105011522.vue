<template>
    <nav class="sidebar-wrapper" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-header">
            <router-link to="/" class="sidebar-brand">
                <i class="bi bi-cup-hot-fill me-2"></i>
                <span>Cafe-App</span>
            </router-link>
        </div>

        <div class="sidebar-menu">
            <ul class="nav flex-column">
                <li class="nav-item-title">Menu</li>
                <li class="nav-item">
                    <router-link to="/" class="nav-link">
                        <i class="bi bi-grid-fill"></i>
                        <span>Dashboard</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/pos" class="nav-link">
                        <i class="bi bi-calculator-fill"></i>
                        <span>Bán hàng (POS)</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/orders" class="nav-link">
                        <i class="bi bi-receipt-cutoff"></i>
                        <span>Quản lý Hoá đơn</span>
                    </router-link>
                </li>

                <li class="nav-item-title">Quản lý</li>
                <li class="nav-item">
                    <router-link to="/products" class="nav-link">
                        <i class="bi bi-box-seam-fill"></i>
                        <span>Sản phẩm</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/categories" class="nav-link">
                        <i class="bi bi-tags-fill"></i>
                        <span>Danh mục</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/tables" class="nav-link">
                        <i class="bi bi-table"></i>
                        <span>Bàn</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/ingredients" class="nav-link">
                        <i class="bi bi-droplet-half"></i>
                        <span>Nguyên liệu</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/suppliers" class="nav-link">
                        <i class="bi bi-truck"></i>
                        <span>Nhà cung cấp</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/purchase-orders" class="nav-link">
                        <i class="bi bi-clipboard-data-fill"></i>
                        <span>Nhập hàng</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/expenses" class="nav-link">
                        <i class="bi bi-cash-stack"></i>
                        <span>Chi phí</span>
                    </router-link>
                </li>
                <li class="nav-item">
                    <router-link to="/users" class="nav-link">
                        <i class="bi bi-people-fill"></i>
                        <span>Nhân viên</span>
                    </router-link>
                </li>

            </ul>
        </div>

        <div class="sidebar-footer">
            <a href="#" @click.prevent="handleLogout" class="nav-link">
                <i class="bi bi-box-arrow-left"></i>
                <span>Đăng xuất</span>
            </a>
        </div>
    </nav>
</template>

<script setup>
// import { ref } from 'vue' // 'ref' không cần thiết nếu bạn không dùng
import { RouterLink } from 'vue-router'; // 1. SỬA LỖI: Import RouterLink
import { useAuthStore } from '@/store/auth'; // 2. Import auth store

defineProps({
    isCollapsed: Boolean
})

// 3. Lấy auth store instance
const authStore = useAuthStore();

const handleLogout = () => {
    authStore.logout();
}
</script>

<style scoped></style>
