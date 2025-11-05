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

</style>