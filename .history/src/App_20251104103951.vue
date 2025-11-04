<template>
  <router-view />

  <ToastContainer :auto-close="3000" theme="colored" position="bottom-right" />
</template>

<script setup>
// Đảm bảo dòng này CHÍNH XÁC
import { ToastContainer } from 'vue3-toastify'
</script>