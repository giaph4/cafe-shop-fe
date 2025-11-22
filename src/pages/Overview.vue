<template>
    <div class="overview-page" data-aos="fade-up">
        <!-- Header Section -->
        <header class="overview-header">
            <div class="overview-header__content">
                <div class="overview-header__title">
                    <h1>Tổng quan hệ thống</h1>
                    <p>Xem nhanh các chỉ số quan trọng và hoạt động của hệ thống</p>
                </div>
                <div class="overview-header__actions">
                    <button class="btn btn-outline-primary" @click="refreshData" :disabled="loading">
                        <i class="bi bi-arrow-clockwise me-2" :class="{ 'spinning': loading }"></i>
                        Làm mới
                    </button>
                </div>
            </div>
        </header>

        <!-- Stats Cards -->
        <section class="overview-stats">
            <div v-for="stat in stats" :key="stat.key" class="stat-card" :class="stat.variant">
                <div class="stat-card__icon">
                    <i :class="stat.icon"></i>
                </div>
                <div class="stat-card__content">
                    <span class="stat-card__label">{{ stat.label }}</span>
                    <strong class="stat-card__value">{{ stat.value }}</strong>
                    <span v-if="stat.change" class="stat-card__change" :class="stat.changeType">
                        <i :class="stat.changeIcon"></i>
                        {{ stat.change }}
                    </span>
                </div>
            </div>
        </section>

        <!-- Main Content Grid -->
        <section class="overview-grid">
            <!-- Revenue Chart -->
            <div class="overview-card chart-card">
                <div class="card-header">
                    <div>
                        <h5>Doanh thu theo thời gian</h5>
                        <p>Biểu đồ doanh thu trong 30 ngày qua</p>
                    </div>
                    <div class="card-header__actions">
                        <select v-model="chartPeriod" class="form-select form-select-sm" @change="updateChart">
                            <option value="7">7 ngày</option>
                            <option value="30">30 ngày</option>
                            <option value="90">90 ngày</option>
                        </select>
                    </div>
                </div>
                <div class="chart-container">
                    <ApexChart 
                        v-if="chartData.series.length > 0"
                        type="area" 
                        height="320" 
                        :series="chartData.series" 
                        :options="chartData.options"
                    />
                    <div v-else class="chart-placeholder">
                        <i class="bi bi-bar-chart"></i>
                        <p>Chưa có dữ liệu</p>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="overview-card quick-actions-card">
                <div class="card-header">
                    <h5>Thao tác nhanh</h5>
                    <p>Truy cập nhanh các chức năng quan trọng</p>
                </div>
                <div class="quick-actions-grid">
                    <router-link
                        v-for="action in quickActions"
                        :key="action.id"
                        :to="action.to"
                        class="quick-action-item"
                    >
                        <div class="quick-action__icon" :class="action.variant">
                            <i :class="action.icon"></i>
                        </div>
                        <div class="quick-action__content">
                            <h6>{{ action.title }}</h6>
                            <span>{{ action.description }}</span>
                        </div>
                        <i class="bi bi-arrow-right quick-action__arrow"></i>
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Secondary Grid -->
        <section class="overview-grid-secondary">
            <!-- Top Products (Admin only) -->
            <div v-if="showTopProducts" class="overview-card">
                <div class="card-header">
                    <h5>Sản phẩm bán chạy</h5>
                    <p>Top 5 sản phẩm được yêu thích nhất</p>
                </div>
                <div class="list-container">
                    <div v-if="topProducts.length > 0" class="product-list">
                        <div v-for="(product, index) in topProducts" :key="product.id" class="product-item">
                            <div class="product-item__rank">{{ index + 1 }}</div>
                            <div class="product-item__info">
                                <h6>{{ product.name }}</h6>
                                <span>{{ formatCurrency(product.revenue) }}</span>
                            </div>
                            <div class="product-item__badge">
                                <span class="badge bg-primary">{{ product.quantity }} đơn</span>
                            </div>
                        </div>
                    </div>
                    <EmptyState v-else message="Chưa có dữ liệu sản phẩm" />
                </div>
            </div>

            <!-- Upcoming Shifts (Staff/Manager) -->
            <div v-if="showUpcomingShifts" class="overview-card">
                <div class="card-header">
                    <h5>Ca làm sắp tới</h5>
                    <p>Lịch làm việc của bạn</p>
                </div>
                <div class="list-container">
                    <div v-if="upcomingShifts.length > 0" class="shift-list">
                        <div v-for="shift in upcomingShifts" :key="shift.assignmentId" class="shift-item">
                            <div class="shift-item__icon">
                                <i class="bi bi-calendar-event"></i>
                            </div>
                            <div class="shift-item__info">
                                <h6>{{ formatDate(shift.shiftDate) }}</h6>
                                <span>{{ shift.timeRange }}</span>
                            </div>
                            <div class="shift-item__badge">
                                <span class="badge" :class="getShiftStatusBadge(shift.status)">
                                    {{ shift.status }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <EmptyState v-else message="Không có ca làm sắp tới" />
                </div>
            </div>

            <!-- Recent Orders (Admin/Manager) -->
            <div v-if="showRecentOrders" class="overview-card">
                <div class="card-header">
                    <h5>Đơn hàng gần đây</h5>
                    <p>5 đơn hàng mới nhất</p>
                </div>
                <div class="list-container">
                    <div v-if="recentOrders.length > 0" class="order-list">
                        <div v-for="order in recentOrders" :key="order.id" class="order-item">
                            <div class="order-item__icon">
                                <i class="bi bi-receipt"></i>
                            </div>
                            <div class="order-item__info">
                                <h6>Đơn #{{ order.id }}</h6>
                                <span>{{ formatDateTime(order.createdAt) }}</span>
                            </div>
                            <div class="order-item__amount">
                                <strong>{{ formatCurrency(order.total) }}</strong>
                            </div>
                        </div>
                    </div>
                    <EmptyState v-else message="Chưa có đơn hàng" />
                </div>
            </div>

            <!-- System Status -->
            <div class="overview-card status-card">
                <div class="card-header">
                    <h5>Trạng thái hệ thống</h5>
                    <p>Thông tin hoạt động hiện tại</p>
                </div>
                <div class="status-list">
                    <div class="status-item">
                        <div class="status-item__icon status-item__icon--success">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="status-item__content">
                            <h6>Hệ thống hoạt động bình thường</h6>
                            <span>Tất cả dịch vụ đang chạy ổn định</span>
                        </div>
                    </div>
                    <div v-if="showInventoryStatus" class="status-item">
                        <div class="status-item__icon" :class="inventoryStatus.class">
                            <i :class="inventoryStatus.icon"></i>
                        </div>
                        <div class="status-item__content">
                            <h6>Kho hàng</h6>
                            <span>{{ inventoryStatus.message }}</span>
                        </div>
                    </div>
                    <div v-if="showActiveStaff" class="status-item">
                        <div class="status-item__icon status-item__icon--info">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="status-item__content">
                            <h6>Nhân viên đang làm việc</h6>
                            <span>{{ activeStaffCount }} người</span>
                        </div>
                    </div>
                    <!-- Staff specific status -->
                    <div v-if="showStaffAttendance" class="status-item">
                        <div class="status-item__icon" :class="attendanceStatus.class">
                            <i :class="attendanceStatus.icon"></i>
                        </div>
                        <div class="status-item__content">
                            <h6>Trạng thái chấm công</h6>
                            <span>{{ attendanceStatus.message }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Loading State -->
        <div v-if="loading" class="overview-loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
            <p>Đang tải dữ liệu...</p>
        </div>

        <!-- Error State -->
        <div v-if="error && !loading" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {{ error }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { getAdminDashboard } from '@/api/adminDashboardService'
import { getManagerDashboard } from '@/api/managerDashboardService'
import { getStaffDashboard } from '@/api/staffDashboardService'
import { getOrders } from '@/api/orderService'
import { getRevenueByDate } from '@/api/reportService'
import { formatCurrency, formatDateTime, formatDate } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'
import VueApexCharts from 'vue3-apexcharts'

const ApexChart = VueApexCharts
const authStore = useAuthStore()

const loading = ref(false)
const error = ref(null)
const chartPeriod = ref('30')
const dashboardData = ref(null)
const revenueChartData = ref(null)
const recentOrdersData = ref([])

const stats = computed(() => {
    if (!dashboardData.value) return []
    
    const roles = authStore.userRoles || []
    const data = dashboardData.value
    
    // Admin Dashboard
    if (roles.includes('ROLE_ADMIN') && data.revenue) {
        const revenue = data.revenue || {}
        const orders = data.orders || {}
        const inventory = data.inventory || {}
        
        return [
            {
                key: 'todayRevenue',
                label: 'Doanh thu hôm nay',
                value: formatCurrency(revenue.today || 0),
                icon: 'bi bi-cash-stack',
                variant: 'stat-card--primary'
            },
            {
                key: 'monthRevenue',
                label: 'Doanh thu tháng này',
                value: formatCurrency(revenue.month || 0),
                icon: 'bi bi-calendar-event',
                variant: 'stat-card--success'
            },
            {
                key: 'todayOrders',
                label: 'Đơn hàng hôm nay',
                value: (orders.today || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-clipboard-check',
                variant: 'stat-card--warning'
            },
            {
                key: 'lowStock',
                label: 'Nguyên liệu sắp hết',
                value: (inventory.lowStockItems || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-exclamation-triangle',
                variant: 'stat-card--danger'
            }
        ]
    }
    
    // Manager Dashboard
    if (roles.includes('ROLE_MANAGER') && data.teamPerformance) {
        const teamPerf = data.teamPerformance || {}
        const inventory = data.inventory || {}
        const shiftOverview = data.shiftOverview || {}
        
        return [
            {
                key: 'totalRevenue',
                label: 'Doanh thu tổng',
                value: formatCurrency(teamPerf.totalRevenue || 0),
                icon: 'bi bi-cash-stack',
                variant: 'stat-card--primary'
            },
            {
                key: 'totalOrders',
                label: 'Tổng đơn hàng',
                value: (teamPerf.totalOrders || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-clipboard-check',
                variant: 'stat-card--success'
            },
            {
                key: 'inProgressShifts',
                label: 'Ca đang diễn ra',
                value: (shiftOverview.inProgress || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-clock-history',
                variant: 'stat-card--warning'
            },
            {
                key: 'lowStock',
                label: 'Nguyên liệu sắp hết',
                value: (inventory.lowStockItems || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-exclamation-triangle',
                variant: 'stat-card--danger'
            }
        ]
    }
    
    // Staff Dashboard
    if (roles.includes('ROLE_STAFF') && data.performance) {
        const performance = data.performance || {}
        const shiftSummary = data.shiftSummary || {}
        
        return [
            {
                key: 'totalRevenue',
                label: 'Doanh thu của tôi',
                value: formatCurrency(performance.totalRevenue || 0),
                icon: 'bi bi-cash-stack',
                variant: 'stat-card--primary'
            },
            {
                key: 'totalOrders',
                label: 'Đơn hàng đã tạo',
                value: (performance.totalOrders || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-clipboard-check',
                variant: 'stat-card--success'
            },
            {
                key: 'shiftsThisWeek',
                label: 'Ca trong tuần',
                value: (shiftSummary.shiftsThisWeek || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-calendar-week',
                variant: 'stat-card--warning'
            },
            {
                key: 'completedShifts',
                label: 'Ca đã hoàn thành',
                value: (shiftSummary.completedShifts || 0).toLocaleString('vi-VN'),
                icon: 'bi bi-check-circle',
                variant: 'stat-card--info'
            }
        ]
    }
    
    return []
})

const topProducts = computed(() => {
    if (!dashboardData.value) return []
    
    // Admin có topProducts
    if (dashboardData.value.topProducts) {
        return dashboardData.value.topProducts.slice(0, 5).map(p => ({
            id: p.productId,
            name: p.productName || 'N/A',
            revenue: p.revenue || 0,
            quantity: p.quantity || 0
        }))
    }
    
    return []
})

const showTopProducts = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_ADMIN')
})

const upcomingShifts = computed(() => {
    if (!dashboardData.value) return []
    
    // Staff có upcomingShifts
    if (dashboardData.value.upcomingShifts) {
        return dashboardData.value.upcomingShifts.slice(0, 5)
    }
    
    return []
})

const showUpcomingShifts = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_STAFF') || roles.includes('ROLE_MANAGER')
})

const showRecentOrders = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')
})

const showInventoryStatus = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')
})

const showActiveStaff = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')
})

const showStaffAttendance = computed(() => {
    const roles = authStore.userRoles || []
    return roles.includes('ROLE_STAFF')
})

const attendanceStatus = computed(() => {
    if (!dashboardData.value?.attendance) {
        return {
            class: 'status-item__icon--info',
            icon: 'bi bi-info-circle',
            message: 'Chưa có thông tin'
        }
    }
    
    const attendance = dashboardData.value.attendance
    if (attendance.currentlyCheckedIn) {
        return {
            class: 'status-item__icon--success',
            icon: 'bi bi-check-circle',
            message: 'Đang làm việc'
        }
    } else {
        return {
            class: 'status-item__icon--warning',
            icon: 'bi bi-clock',
            message: 'Chưa check-in'
        }
    }
})

const getShiftStatusBadge = (status) => {
    if (!status) return 'bg-secondary'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('pending') || statusLower.includes('scheduled')) {
        return 'bg-warning'
    } else if (statusLower.includes('completed')) {
        return 'bg-success'
    } else if (statusLower.includes('cancelled')) {
        return 'bg-danger'
    }
    return 'bg-info'
}

const recentOrders = computed(() => {
    if (!recentOrdersData.value || recentOrdersData.value.length === 0) return []
    
    return recentOrdersData.value.slice(0, 5).map(order => ({
        id: order.id || order.orderId || 'N/A',
        total: order.totalAmount || order.total || 0,
        createdAt: order.createdAt || order.createdDate || new Date()
    }))
})

const activeStaffCount = computed(() => {
    if (!dashboardData.value) return 0
    
    const roles = authStore.userRoles || []
    
    // Manager có shiftOverview với inProgress
    if (roles.includes('ROLE_MANAGER') && dashboardData.value.shiftOverview) {
        return dashboardData.value.shiftOverview.inProgress || 0
    }
    
    // Admin có thể tính từ topStaff hoặc các nguồn khác
    if (roles.includes('ROLE_ADMIN')) {
        // Có thể lấy từ API khác hoặc để 0
        return 0
    }
    
    return 0
})

const inventoryStatus = computed(() => {
    if (!dashboardData.value) {
        return {
            class: 'status-item__icon--info',
            icon: 'bi bi-info-circle',
            message: 'Đang tải dữ liệu...'
        }
    }
    
    const roles = authStore.userRoles || []
    let lowStock = 0
    
    // Admin và Manager có inventory
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')) {
        lowStock = dashboardData.value.inventory?.lowStockItems || 0
    }
    
    if (lowStock === 0) {
        return {
            class: 'status-item__icon--success',
            icon: 'bi bi-check-circle',
            message: 'Tất cả nguyên liệu đủ dùng'
        }
    } else if (lowStock < 5) {
        return {
            class: 'status-item__icon--warning',
            icon: 'bi bi-exclamation-triangle',
            message: `${lowStock} nguyên liệu sắp hết`
        }
    } else {
        return {
            class: 'status-item__icon--danger',
            icon: 'bi bi-x-circle',
            message: `${lowStock} nguyên liệu cần nhập ngay`
        }
    }
})

const quickActions = computed(() => {
    const roles = authStore.userRoles || []
    const actions = []
    
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')) {
        actions.push(
            {
                id: 'pos',
                title: 'Bán hàng',
                description: 'Mở POS để bán hàng',
                icon: 'bi bi-cash-register',
                variant: 'quick-action--primary',
                to: '/pos'
            },
            {
                id: 'orders',
                title: 'Quản lý đơn hàng',
                description: 'Xem và quản lý đơn hàng',
                icon: 'bi bi-receipt',
                variant: 'quick-action--success',
                to: '/orders'
            },
            {
                id: 'products',
                title: 'Quản lý sản phẩm',
                description: 'Thêm, sửa sản phẩm',
                icon: 'bi bi-basket2',
                variant: 'quick-action--info',
                to: '/products'
            },
            {
                id: 'reports',
                title: 'Báo cáo',
                description: 'Xem báo cáo chi tiết',
                icon: 'bi bi-graph-up',
                variant: 'quick-action--warning',
                to: '/reports'
            }
        )
    }
    
    if (roles.includes('ROLE_STAFF')) {
        actions.push(
            {
                id: 'pos',
                title: 'Bán hàng',
                description: 'Mở POS để bán hàng',
                icon: 'bi bi-cash-register',
                variant: 'quick-action--primary',
                to: '/pos'
            },
            {
                id: 'orders',
                title: 'Đơn hàng của tôi',
                description: 'Xem đơn hàng đã tạo',
                icon: 'bi bi-receipt',
                variant: 'quick-action--success',
                to: '/orders'
            },
            {
                id: 'products',
                title: 'Quản lý sản phẩm',
                description: 'Xem và quản lý sản phẩm',
                icon: 'bi bi-basket2',
                variant: 'quick-action--info',
                to: '/products'
            }
        )
    }
    
    return actions
})

const chartData = computed(() => {
    if (!revenueChartData.value || !revenueChartData.value.labels || revenueChartData.value.labels.length === 0) {
        return {
            series: [],
            options: {
                chart: { type: 'area', toolbar: { show: false } },
                xaxis: { categories: [] },
                yaxis: { labels: { formatter: (val) => formatCurrency(val) } }
            }
        }
    }
    
    const data = revenueChartData.value
    
    return {
        series: [{
            name: 'Doanh thu',
            data: data.values || []
        }],
        options: {
            chart: {
                type: 'area',
                toolbar: { show: false },
                zoom: { enabled: false }
            },
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.45,
                    opacityTo: 0.05,
                    stops: [0, 90, 100]
                }
            },
            colors: ['#6366f1'],
            xaxis: {
                categories: data.labels || [],
                labels: {
                    style: {
                        colors: '#64748b',
                        fontSize: '12px'
                    },
                    formatter: (value) => {
                        // Format date từ YYYY-MM-DD sang DD/MM
                        if (value && value.includes('-')) {
                            const [year, month, day] = value.split('-')
                            return `${day}/${month}`
                        }
                        return value
                    }
                }
            },
            yaxis: {
                labels: {
                    formatter: (val) => formatCurrency(val),
                    style: {
                        colors: '#64748b'
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: (val) => formatCurrency(val)
                }
            },
            grid: {
                borderColor: '#e2e8f0',
                strokeDashArray: 4
            }
        }
    }
})

const fetchData = async () => {
    loading.value = true
    error.value = null
    
    try {
        const roles = authStore.userRoles || []
        
        // Fetch dashboard data
        let data = null
        if (roles.includes('ROLE_ADMIN')) {
            // Backend yêu cầu enum DashboardRange: TODAY, WEEK, MONTH, LAST_30_DAYS, CUSTOM
            // Không gửi range để backend dùng default, hoặc gửi LAST_30_DAYS cho 30 ngày
            data = await getAdminDashboard({})
        } else if (roles.includes('ROLE_MANAGER')) {
            data = await getManagerDashboard()
        } else if (roles.includes('ROLE_STAFF')) {
            data = await getStaffDashboard(null)
        }
        dashboardData.value = data
        
        // Fetch revenue chart data
        const days = parseInt(chartPeriod.value)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        
        try {
            const revenueData = await getRevenueByDate(startDateStr, endDateStr)
            revenueChartData.value = revenueData
        } catch (chartErr) {
            revenueChartData.value = null
        }
        
        // Fetch recent orders (only for Admin and Manager)
        if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER')) {
            try {
                const ordersResponse = await getOrders(0, 5)
                // Handle different response structures
                if (Array.isArray(ordersResponse)) {
                    recentOrdersData.value = ordersResponse
                } else if (ordersResponse?.content) {
                    recentOrdersData.value = ordersResponse.content
                } else if (ordersResponse?.items) {
                    recentOrdersData.value = ordersResponse.items
                } else if (ordersResponse?.data) {
                    recentOrdersData.value = Array.isArray(ordersResponse.data) 
                        ? ordersResponse.data 
                        : ordersResponse.data?.content || []
                } else {
                    recentOrdersData.value = []
                }
            } catch (ordersErr) {
                recentOrdersData.value = []
            }
        } else {
            recentOrdersData.value = []
        }
        
    } catch (err) {
        const message = err.response?.data?.message || err.message
        error.value = message || 'Không thể tải dữ liệu. Vui lòng thử lại.'
    } finally {
        loading.value = false
    }
}

const refreshData = () => {
    fetchData()
}

const updateChart = async () => {
    // Fetch new chart data when period changes
    const days = parseInt(chartPeriod.value)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    try {
        const revenueData = await getRevenueByDate(startDateStr, endDateStr)
        revenueChartData.value = revenueData
    } catch (err) {
        // Error handled silently
    }
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.overview-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: 2rem;
}

.overview-header {
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    border-radius: 22px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    padding: 2rem;
}

.overview-header__content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.overview-header__title h1 {
    font-weight: 700;
    font-size: 2rem;
    color: var(--color-heading);
    margin: 0 0 0.5rem 0;
}

.overview-header__title p {
    color: var(--color-text-muted);
    margin: 0;
    font-size: 1rem;
}

.overview-header__actions {
    display: flex;
    gap: 0.75rem;
}

.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    padding: 1.5rem;
    box-shadow: 0 16px 30px rgba(99, 102, 241, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    min-height: 140px;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.18);
}

.stat-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 1.8rem;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.stat-card--success .stat-card__icon {
    background: linear-gradient(135deg, #22c55e, #4ade80);
    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.3);
}

.stat-card--warning .stat-card__icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
}

.stat-card--danger .stat-card__icon {
    background: linear-gradient(135deg, #ef4444, #f87171);
    box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
}

.stat-card__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.stat-card__label {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-weight: 500;
}

.stat-card__value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-heading);
    line-height: 1.2;
}

.stat-card__change {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
}

.overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1.5rem;
}

.overview-grid-secondary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.overview-card {
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border-radius: 20px;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    padding-bottom: 1rem;
}

.card-header h5 {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-heading);
    margin: 0 0 0.35rem 0;
}

.card-header p {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0;
}

.chart-container {
    min-height: 320px;
}

.chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    color: var(--color-text-muted);
    gap: 1rem;
}

.chart-placeholder i {
    font-size: 3rem;
    opacity: 0.5;
}

.quick-actions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.quick-action-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    background: linear-gradient(170deg, rgba(244, 246, 255, 0.92), rgba(233, 240, 255, 0.84));
    color: inherit;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.1);
}

.quick-action-item:hover {
    transform: translateX(4px);
    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.28);
}

.quick-action__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    color: #fff;
}

.quick-action--primary .quick-action__icon {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.quick-action--success .quick-action__icon {
    background: linear-gradient(135deg, #22c55e, #4ade80);
}

.quick-action--info .quick-action__icon {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.quick-action--warning .quick-action__icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.quick-action__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.quick-action__content h6 {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
    margin: 0;
}

.quick-action__content span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.quick-action__arrow {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    transition: transform 0.18s ease;
}

.quick-action-item:hover .quick-action__arrow {
    transform: translateX(4px);
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.product-list,
.order-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.product-item,
.order-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.6), rgba(233, 240, 255, 0.5));
    border: 1px solid rgba(148, 163, 184, 0.12);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.product-item:hover,
.order-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
}

.product-item__rank {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    font-size: 0.9rem;
}

.product-item__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.product-item__info h6 {
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    font-size: 0.95rem;
}

.product-item__info span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.order-item__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
    font-size: 1.2rem;
}

.order-item__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.order-item__info h6 {
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    font-size: 0.95rem;
}

.order-item__info span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.order-item__amount strong {
    font-size: 1.1rem;
    color: var(--color-heading);
}

.shift-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.shift-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.6), rgba(233, 240, 255, 0.5));
    border: 1px solid rgba(148, 163, 184, 0.12);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.shift-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.12);
}

.shift-item__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
    font-size: 1.2rem;
}

.shift-item__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.shift-item__info h6 {
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    font-size: 0.95rem;
}

.shift-item__info span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.shift-item__badge {
    display: flex;
    align-items: center;
}

.status-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(244, 246, 255, 0.6), rgba(233, 240, 255, 0.5));
    border: 1px solid rgba(148, 163, 184, 0.12);
}

.status-item__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 1.3rem;
    color: #fff;
}

.status-item__icon--success {
    background: linear-gradient(135deg, #22c55e, #4ade80);
}

.status-item__icon--warning {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.status-item__icon--danger {
    background: linear-gradient(135deg, #ef4444, #f87171);
}

.status-item__icon--info {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.status-item__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.status-item__content h6 {
    font-weight: 600;
    color: var(--color-heading);
    margin: 0;
    font-size: 0.95rem;
}

.status-item__content span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.overview-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 1200px) {
    .overview-grid {
        grid-template-columns: 1fr;
    }
    
    .overview-stats {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
}

@media (max-width: 768px) {
    .overview-header__content {
        flex-direction: column;
    }
    
    .overview-header__title h1 {
        font-size: 1.5rem;
    }
    
    .overview-stats {
        grid-template-columns: 1fr;
    }
    
    .overview-grid-secondary {
        grid-template-columns: 1fr;
    }
}

.dark-theme .overview-card,
.dark-theme .stat-card {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    border-color: rgba(129, 140, 248, 0.28);
}

.dark-theme .quick-action-item,
.dark-theme .product-item,
.dark-theme .order-item,
.dark-theme .status-item {
    background: linear-gradient(160deg, rgba(30, 41, 59, 0.6), rgba(17, 24, 39, 0.5));
    border-color: rgba(129, 140, 248, 0.2);
}

.comfort-theme .overview-card,
.comfort-theme .stat-card {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}
</style>

