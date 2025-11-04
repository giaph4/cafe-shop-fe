<template>
    <nav class="topbar-wrapper navbar navbar-expand">
      <button class="btn btn-icon" @click="toggleSidebar">
        <i class="bi" :class="isSidebarCollapsed ? 'bi-list' : 'bi-x-lg'"></i>
      </button>
  
      <div class="topbar-title ms-3">
        <h5 class="mb-0">{{ $route.name }}</h5>
      </div>
  
      <div class="ms-auto d-flex align-items-center">
        <div class="topbar-search me-3">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <i class="bi bi-search"></i>
            </span>
            <input type="text" class="form-control border-start-0" placeholder="Tìm kiếm...">
          </div>
        </div>
  
        <button class="btn btn-icon me-2">
          <i class="bi bi-bell-fill"></i>
        </button>
  
        <div class="dropdown">
          <a href="#" class="topbar-profile" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://i.pravatar.cc/40" alt="Avatar" class="rounded-circle" />
            <div class="ms-2 d-none d-md-block">
              <span class="d-block small">Xin chào,</span>
              <span class="fw-bold">Manager</span>
            </div>
          </a>
          <ul class="dropdown-menu dropdown-menu-end p-2 shadow-lg border-0" style="border-radius: 12px;">
            <li>
              <a class="dropdown-item rounded" href="#">
                <i class="bi bi-person-circle me-2"></i> Hồ sơ
              </a>
            </li>
            <li>
              <a class="dropdown-item rounded" href="#">
                <i class="bi bi-gear-fill me-2"></i> Cài đặt
              </a>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <a class="dropdown-item rounded text-danger-muted" href="#" @click.prevent="handleLogout">
                <i class="bi bi-box-arrow-left me-2"></i> Đăng xuất
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </template>
  
  <script setup>
  const emit = defineEmits(['toggleSidebar'])
  
  defineProps({
    isSidebarCollapsed: Boolean
  })
  
  const toggleSidebar = () => {
    emit('toggleSidebar')
  }
  
  const handleLogout = () => {
    alert('Đăng xuất!')
  }
  </script>
  
  <style scoped>
  /* Style sẽ được thêm vào main.scss */
  </style>