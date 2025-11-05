<template>
    <div class="main-layout-wrapper">
        <Sidebar :isCollapsed="isSidebarCollapsed" />

        <div class="main-content-wrapper">

            <main class="page-content">
                <router-view />
            </main>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
// 1. Đảm bảo bạn import Sidebar component
// !!! KIỂM TRA LẠI ĐƯỜNG DẪN NÀY CHO ĐÚNG VỚI CẤU TRÚC THƯ MỤC CỦA BẠN !!!
import Sidebar from '@/components/layout/Sidebar.vue'; // (File bạn gửi ở trên)

// Biến này dùng để điều khiển trạng thái đóng/mở của sidebar
const isSidebarCollapsed = ref(false);

// (Tùy chọn) Bạn có thể tạo một hàm để bật/tắt sidebar
// const toggleSidebar = () => {
//   isSidebarCollapsed.value = !isSidebarCollapsed.value;
// };
</script>

<style scoped>
/* CSS này giúp layout của bạn chia làm 2 cột:
    - Cột 1: Sidebar
    - Cột 2: Nội dung chính
  */
.main-layout-wrapper {
    display: flex;
    height: 100vh;
    /* Chiếm toàn bộ chiều cao màn hình */
    background-color: #f8f9fa;
    /* Màu nền nhẹ cho toàn bộ trang */
}

.main-content-wrapper {
    flex-grow: 1;
    /* Cho phép nội dung chính chiếm hết phần còn lại */
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    /* Ẩn thanh cuộn ở wrapper */
}

.page-content {
    flex-grow: 1;
    padding: 24px;
    /* Khoảng đệm cho nội dung trang */
    overflow-y: auto;
    /* Thêm thanh cuộn CHỈ cho nội dung khi cần */
}
</style>