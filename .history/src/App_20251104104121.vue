<template>
  <router-view />

  <ToastContainer :auto-close="3000" theme="colored" position="bottom-right" />
</template>

<script setup>

import { ToastContainer } from 'vue3-toastify'
</script><template>
  <router-view />
</template>

<script setup>
// Không cần import ToastContainer ở đây
</script>
