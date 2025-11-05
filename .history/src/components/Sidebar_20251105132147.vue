<template>
    <div class="sidebar">
        <div class="sidebar-header">
            <h2>Coffee Shop</h2>
        </div>
        <nav class="sidebar-nav">
            <ul>
                <li>
                    <router-link to="/" v-ripple><i class="pi pi-home"></i> Bảng điều khiển</router-link>
                </li>
                <li>
                    <router-link to="/orders" v-ripple><i class="pi pi-shopping-cart"></i> Quản lý Bán
                        hàng</router-link>
                </li>
                <li>
                    <router-link to="/tables" v-ripple><i class="pi pi-table"></i> Quản lý Bàn</router-link>
                </li>
                <li>
                    <router-link to="/products" v-ripple><i class="pi pi-coffee"></i> Quản lý Sản phẩm</router-link>
                </li>
                <li>
                    <router-link to="/categories" v-ripple><i class="pi pi-tags"></i> Quản lý Danh mục</router-link>
                </li>
                <li>
                    <router-link to="/ingredients" v-ripple><i class="pi pi-box"></i> Quản lý Tồn kho</router-link>
                </li>
                <li>
                    <router-link to="/purchase-orders" v-ripple><i class="pi pi-file-import"></i> Quản lý Nhập
                        hàng</router-link>
                </li>
                <!-- THÊM LINK MỚI CHO QUẢN LÝ CHI PHÍ -->
                <li>
                    <router-link to="/expenses" v-ripple><i class="pi pi-wallet"></i> Quản lý Chi phí</router-link>
                </li>
                <li>
                    <router-link to="/suppliers" v-ripple><i class="pi pi-truck"></i> Quản lý NCC</router-link>
                </li>
                <!-- Thêm các link khác tại đây -->
            </ul>
        </nav>
    </div>
</template>

<script setup>
import 'primeicons/primeicons.css';
import Ripple from 'primevue/ripple';
</script>

<style lang="scss" scoped>
.sidebar {
    width: 250px;
    background-color: #ffffff;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;

    .sidebar-header {
        padding: 1.5rem;
        text-align: center;
        border-bottom: 1px solid #e9ecef;

        h2 {
            margin: 0;
            font-size: 1.5rem;
            color: var(--primary-color);
        }
    }

    .sidebar-nav {
        flex-grow: 1;
        overflow-y: auto;

        ul {
            list-style: none;
            padding: 1rem 0;
            margin: 0;
        }

        li a {
            display: flex;
            align-items: center;
            padding: 1rem 1.5rem;
            text-decoration: none;
            color: var(--text-color);
            font-weight: 500;
            transition: background-color 0.2s, color 0.2s;
            border-radius: 6px;
            margin: 0.25rem 1rem;

            i {
                margin-right: 1rem;
                font-size: 1.2rem;
            }

            &:hover {
                background-color: #f4f4f5;
            }

            &.router-link-exact-active {
                background-color: var(--primary-100);
                color: var(--primary-700);
                font-weight: 600;
            }
        }
    }
}
</style>
