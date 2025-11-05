<template>
  <div id="app">
    <Sidebar :is-collapsed="isCollapsed" />
    <div class="main-content">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>
