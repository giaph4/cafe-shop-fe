<template>
  <div
    class="page-container container-fluid role-dashboards-page"
    data-aos="fade-up"
  >
    <div class="role-dashboards-header">
      <div class="role-dashboards-header__content">
        <div class="role-dashboards-header__title-section">
          <h2 class="page-title">
            <i class="bi bi-speedometer2 me-2" />Dashboard theo vai trò
          </h2>
          <p class="page-subtitle">
            Xem tổng quan và các chỉ số quan trọng dựa trên vai trò của bạn trong hệ thống.
          </p>
        </div>
        <div class="role-dashboards-header__actions">
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="loading"
            @click="fetchDashboard"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-arrow-clockwise me-2"
            />
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <div class="card tabs-card mb-4">
      <div class="card-body">
        <ul
          class="nav nav-pills reports-tabs mb-3"
          role="tablist"
        >
          <li
            v-for="tab in availableTabs"
            :key="tab.key"
            class="nav-item"
            role="presentation"
          >
            <button
              type="button"
              class="nav-link"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <i :class="[tab.icon, 'me-2']" />{{ tab.label }}
            </button>
          </li>
        </ul>

        <div
          v-if="loading"
          class="text-center py-5"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          />
          <p class="mt-3 text-muted">
            Đang tải dữ liệu...
          </p>
        </div>

        <div
          v-else-if="error"
          class="error-message mb-0"
        >
          {{ error }}
        </div>

        <div
          v-else
          class="tab-content"
        >
          <AdminDashboardTab
            v-if="activeTab === 'admin' && isAdmin"
            :dashboard-data="dashboardData"
            :range="range"
            @update-range="handleRangeUpdate"
          />

          <ManagerDashboardTab
            v-else-if="activeTab === 'manager' && isManager"
            :dashboard-data="dashboardData"
          />

          <StaffDashboardTab
            v-else-if="activeTab === 'staff' && isStaff"
            :dashboard-data="dashboardData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { getAdminDashboard } from '@/api/adminDashboardService'
import { getManagerDashboard } from '@/api/managerDashboardService'
import { getStaffDashboard } from '@/api/staffDashboardService'
import AdminDashboardTab from '@/components/dashboard/AdminDashboardTab.vue'
import ManagerDashboardTab from '@/components/dashboard/ManagerDashboardTab.vue'
import StaffDashboardTab from '@/components/dashboard/StaffDashboardTab.vue'

const { handleError } = useErrorHandler({ context: 'RoleBasedDashboards' })

const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')
const dashboardData = ref(null)
const range = ref(null)
const activeTab = ref('')

const isAdmin = computed(() => authStore.isAdmin)
const isManager = computed(() => authStore.isManager)
const isStaff = computed(() => authStore.isStaff)

const availableTabs = computed(() => {
    const tabs = []
    const roles = authStore.userRoles || []

    if (roles.includes('ROLE_ADMIN')) {
        tabs.push({
            key: 'admin',
            label: 'Admin Dashboard',
            icon: 'bi bi-shield-check'
        })
    }

    if (roles.includes('ROLE_MANAGER')) {
        tabs.push({
            key: 'manager',
            label: 'Manager Dashboard',
            icon: 'bi bi-person-badge'
        })
    }

    if (roles.includes('ROLE_STAFF')) {
        tabs.push({
            key: 'staff',
            label: 'Staff Dashboard',
            icon: 'bi bi-person'
        })
    }

    return tabs
})

const fetchDashboard = async () => {
    // Don't fetch if activeTab is not set yet
    if (!activeTab.value) {
        return
    }

    loading.value = true
    error.value = ''

    try {
        const roles = authStore.userRoles || []
        let data = null

        if (activeTab.value === 'admin' && roles.includes('ROLE_ADMIN')) {
            const params = {}
            if (range.value) {
                if (typeof range.value === 'object' && range.value.range === 'CUSTOM') {
                    // Custom range requires from and to dates
                    if (range.value.from && range.value.to) {
                        params.range = 'CUSTOM'
                        params.from = range.value.from
                        params.to = range.value.to
                    }
                    // If custom range but missing dates, don't pass range
                } else if (typeof range.value === 'string' && range.value.trim() !== '') {
                    // Only pass valid enum values
                    const validRanges = ['TODAY', 'WEEK', 'MONTH', 'LAST_30_DAYS', 'CUSTOM']
                    const trimmedRange = range.value.trim().toUpperCase()
                    if (validRanges.includes(trimmedRange)) {
                        params.range = trimmedRange
                    }
                    // Invalid range value - skip silently
                }
            }
            // If no params, backend will use default (LAST_30_DAYS)
            // Pass empty object if no params to avoid sending undefined
            data = await getAdminDashboard(Object.keys(params).length > 0 ? params : {})
        } else if (activeTab.value === 'manager' && roles.includes('ROLE_MANAGER')) {
            data = await getManagerDashboard()
        } else if (activeTab.value === 'staff' && roles.includes('ROLE_STAFF')) {
            data = await getStaffDashboard(null)
        }

        dashboardData.value = data
    } catch (err) {
        const errorMessage = handleError(err, 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
        error.value = typeof errorMessage === 'string' ? errorMessage : 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.'
    } finally {
        loading.value = false
    }
}

const handleRangeUpdate = (newRange) => {
    range.value = newRange
    fetchDashboard()
}

// Set initial tab based on user role
const setInitialTab = () => {
    const roles = authStore.userRoles || []
    if (roles.includes('ROLE_ADMIN')) {
        activeTab.value = 'admin'
    } else if (roles.includes('ROLE_MANAGER')) {
        activeTab.value = 'manager'
    } else if (roles.includes('ROLE_STAFF')) {
        activeTab.value = 'staff'
    }
}

onMounted(() => {
    setInitialTab()
    // Use nextTick to ensure activeTab is set before fetching
    nextTick(() => {
        if (activeTab.value) {
            fetchDashboard()
        }
    })
})
</script>

<style scoped>
.role-dashboards-page {
    padding-bottom: var(--spacing-6);
}

/* Header - Chuẩn hóa theo base.css */
.role-dashboards-header {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-base);
    margin-bottom: var(--spacing-5);
    padding: var(--spacing-4);
}

.role-dashboards-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.role-dashboards-header__title-section {
    flex: 1;
    min-width: 0;
}

.role-dashboards-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
}

.page-title i {
    font-size: 20px;
    line-height: 1;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
}

/* Tabs Card - Chuẩn hóa */
.tabs-card {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-base);
}

.reports-tabs {
    display: flex;
    gap: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-2);
    margin-bottom: var(--spacing-3);
    overflow-x: auto;
}

.reports-tabs .nav-link {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

.reports-tabs .nav-link i {
    font-size: 18px;
    line-height: 1;
}

.reports-tabs .nav-link:hover:not(.active) {
    background: var(--color-bg-muted);
    color: var(--color-text);
}

.reports-tabs .nav-link.active {
    background: var(--color-primary);
    color: #ffffff;
}

/* Error message - không dùng alert */
.error-message {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-danger);
    background: var(--color-bg-muted);
    color: var(--color-danger);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

@media (max-width: 768px) {
    .role-dashboards-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .role-dashboards-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .reports-tabs {
        gap: var(--spacing-1);
    }

    .reports-tabs .nav-link {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-base);
    }
}
</style>

