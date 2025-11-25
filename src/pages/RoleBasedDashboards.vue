<template>
    <div class="page-container container-fluid role-dashboards-page" data-aos="fade-up">
        <div class="role-dashboards-header">
            <div class="role-dashboards-header__content">
                <div class="role-dashboards-header__title-section">
                    <h2 class="page-title">
                        <i class="bi bi-speedometer2 me-2"></i>Dashboard theo vai trò
                    </h2>
                    <p class="page-subtitle">Xem tổng quan và các chỉ số quan trọng dựa trên vai trò của bạn trong hệ thống.</p>
                </div>
                <div class="role-dashboards-header__actions">
                    <button class="btn btn-outline-secondary" type="button" @click="fetchDashboard" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                </div>
            </div>
        </div>

        <div class="card tabs-card mb-4">
            <div class="card-body">
                <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
                    <li class="nav-item" v-for="tab in availableTabs" :key="tab.key" role="presentation">
                        <button
                            type="button"
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                        </button>
                    </li>
                </ul>

                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
                </div>

                <div v-else-if="error" class="alert alert-danger mb-0">{{ error }}</div>

                <div v-else class="tab-content">
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
        error.value = handleError(err, 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
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
    padding-bottom: 3rem;
}

/* Header Styles */
.role-dashboards-header {
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
}

.role-dashboards-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.role-dashboards-header__title-section {
    flex: 1;
    min-width: 0;
}

.role-dashboards-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading, #1e293b);
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted, #64748b);
    font-size: 0.9rem;
    line-height: 1.5;
}

.tabs-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.reports-tabs {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
}

.reports-tabs .nav-link {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.reports-tabs .nav-link:hover {
    background: rgba(148, 163, 184, 0.1);
    color: var(--color-heading);
}

.reports-tabs .nav-link.active {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}
</style>

