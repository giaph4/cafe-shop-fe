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

</script>

<style scoped>

</style>