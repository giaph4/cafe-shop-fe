<template>
  <router-view />
  <ToastContainer 
    :auto-close="3000" 
    theme="colored"
    position="bottom-right"
  />
</template>

<script setup>
// Lỗi của bạn là ở dòng import này
// Đảm bảo nó là 'ToastContainer' và nằm trong { }
import { ToastContainer } from 'vue3-toastify' 
</script>