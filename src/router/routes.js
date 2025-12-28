import { ROLES } from '@/constants/roles'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * Định nghĩa tất cả routes của ứng dụng
 */
export const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import(/* webpackChunkName: "dashboard" */ '../pages/Dashboard.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'pos',
                name: 'POS',
                component: () => import(/* webpackChunkName: "pos" */ '../pages/Pos.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.STAFF] }
            },
            {
                path: 'products',
                name: 'Quản lý Sản phẩm',
                component: () => import(/* webpackChunkName: "products" */ '../pages/Products.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'orders',
                name: 'Quản lý Hoá đơn',
                component: () => import(/* webpackChunkName: "orders" */ '../pages/Orders.vue'),
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers',
                name: 'Quản lý Khách hàng',
                component: () => import(/* webpackChunkName: "customers" */ '../pages/Customers.vue'),
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers/:id',
                name: 'Chi tiết Khách hàng',
                component: () => import(/* webpackChunkName: "customer-order-detail" */ '../pages/CustomerOrderDetail.vue'),
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'categories',
                name: 'Quản lý Danh mục',
                component: () => import(/* webpackChunkName: "categories" */ '../pages/Categories.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'tables',
                name: 'Quản lý Bàn',
                component: () => import(/* webpackChunkName: "tables" */ '../pages/Tables.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'vouchers',
                name: 'Quản lý Voucher',
                component: () => import(/* webpackChunkName: "vouchers" */ '../pages/Vouchers.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'reports',
                name: 'Báo cáo tổng hợp',
                component: () => import(/* webpackChunkName: "reports" */ '../pages/Reports.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'notifications',
                name: 'Trung tâm thông báo',
                component: () => import(/* webpackChunkName: "notifications" */ '../pages/NotificationCenter.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'notifications/settings',
                name: 'Cài đặt thông báo',
                component: () => import(/* webpackChunkName: "notification-settings" */ '../pages/NotificationSettings.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'chart-builder',
                name: 'Chart Builder',
                component: () => import(/* webpackChunkName: "chart-builder" */ '../pages/ChartBuilder.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'chat',
                name: 'Trò chuyện nội bộ',
                component: () => import(/* webpackChunkName: "chat" */ '../pages/Chat.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'sales',
                redirect: { path: '/reports' }
            },
            {
                path: 'ingredients',
                name: 'Quản lý Nguyên liệu',
                component: () => import(/* webpackChunkName: "ingredients" */ '../pages/Ingredients.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'suppliers',
                name: 'Quản lý Nhà cung cấp',
                component: () => import(/* webpackChunkName: "suppliers" */ '../pages/Suppliers.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'purchase-orders',
                name: 'Quản lý Nhập hàng',
                component: () => import(/* webpackChunkName: "purchase-orders" */ '../pages/PurchaseOrders.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'purchase-orders/new',
                name: 'Tạo Đơn nhập hàng',
                component: () => import(/* webpackChunkName: "purchase-order-create" */ '../pages/PurchaseOrderCreate.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'inventory-report',
                name: 'Báo cáo tồn kho',
                component: () => import(/* webpackChunkName: "inventory-report" */ '../pages/InventoryReport.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'expenses',
                name: 'Quản lý Chi phí',
                component: () => import(/* webpackChunkName: "expenses" */ '../pages/Expenses.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'staff',
                name: 'Quản lý Nhân viên',
                component: () => import(/* webpackChunkName: "staff" */ '../pages/Staff.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'shifts',
                name: 'Quản lý Ca làm',
                component: () => import(/* webpackChunkName: "shift-management" */ '../pages/ShiftManagement.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'attendance',
                name: 'Chấm công',
                component: () => import(/* webpackChunkName: "attendance" */ '../pages/Attendance.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'shift-report',
                name: 'Báo cáo Ca làm',
                component: () => import(/* webpackChunkName: "shift-report" */ '../pages/ShiftReport.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'shift-report/:id',
                name: 'Chi tiết Báo cáo Ca làm',
                component: () => import(/* webpackChunkName: "shift-report-detail" */ '../pages/ShiftReportDetail.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'shift-assignment',
                name: 'Phân công Ca làm',
                component: () => import(/* webpackChunkName: "shift-assignment" */ '../pages/ShiftAssignment.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'performance-adjustment',
                name: 'Điều chỉnh Hiệu suất',
                component: () => import(/* webpackChunkName: "performance-adjustment" */ '../pages/PerformanceAdjustment.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'payroll',
                name: 'Quản lý Lương',
                component: () => import(/* webpackChunkName: "payroll" */ '../pages/Payroll.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'profile',
                name: 'Hồ sơ cá nhân',
                component: () => import(/* webpackChunkName: "profile" */ '../pages/Profile.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'login-history',
                name: 'Lịch sử đăng nhập',
                component: () => import(/* webpackChunkName: "login-history" */ '../pages/LoginHistory.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'file-management',
                name: 'Quản lý File',
                component: () => import(/* webpackChunkName: "file-management" */ '../pages/FileManagement.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'admin-analytics',
                name: 'Phân tích AI',
                component: () => import(/* webpackChunkName: "admin-analytics" */ '../pages/AdminAnalytics.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'admin-analytics/:id',
                name: 'Chi tiết Phân tích AI',
                component: () => import(/* webpackChunkName: "admin-analytics-detail" */ '../pages/AdminAnalyticsDetail.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'role-dashboards',
                name: 'Dashboard theo vai trò',
                component: () => import(/* webpackChunkName: "role-dashboards" */ '../pages/RoleBasedDashboards.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'performance',
                name: 'Performance Dashboard',
                component: () => import(/* webpackChunkName: "performance" */ '../pages/PerformanceDashboard.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'custom-dashboard',
                name: 'Dashboard Tùy chỉnh',
                component: () => import(/* webpackChunkName: "custom-dashboard" */ '../pages/CustomDashboard.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'revenue-forecast',
                name: 'Dự báo Doanh thu',
                component: () => import(/* webpackChunkName: "revenue-forecast" */ '../pages/RevenueForecast.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'stakeholder-report',
                name: 'Báo cáo Stakeholders',
                component: () => import(/* webpackChunkName: "stakeholder-report" */ '../pages/StakeholderReport.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'voucher-analytics',
                name: 'Phân tích Voucher',
                component: () => import(/* webpackChunkName: "voucher-analytics" */ '../pages/VoucherAnalytics.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'smart-inventory',
                name: 'Tồn kho thông minh',
                component: () => import(/* webpackChunkName: "smart-inventory" */ '../pages/SmartInventory.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'staff-performance',
                name: 'Phân tích Hiệu suất Nhân viên',
                component: () => import(/* webpackChunkName: "staff-performance" */ '../pages/StaffPerformance.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'customer-analytics',
                name: 'Phân tích Khách hàng',
                component: () => import(/* webpackChunkName: "customer-analytics" */ '../pages/CustomerAnalytics.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'product-profitability',
                name: 'Phân tích Lợi nhuận Sản phẩm',
                component: () => import(/* webpackChunkName: "product-profitability" */ '../pages/ProductProfitability.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'ingredient-demand-forecast',
                name: 'Dự báo Nhu cầu Nguyên liệu',
                component: () => import(/* webpackChunkName: "ingredient-demand-forecast" */ '../pages/IngredientDemandForecast.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'inventory-adjustment-history',
                name: 'Lịch sử điều chỉnh tồn kho',
                component: () => import(/* webpackChunkName: "inventory-adjustment-history" */ '../pages/InventoryAdjustmentHistory.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'shift-efficiency',
                name: 'Phân tích Hiệu quả Ca làm việc',
                component: () => import(/* webpackChunkName: "shift-efficiency" */ '../pages/ShiftEfficiencyAnalysis.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'cancellation-analysis',
                name: 'Phân tích Tỷ lệ Hủy Đơn',
                component: () => import(/* webpackChunkName: "cancellation-analysis" */ '../pages/CancellationAnalysis.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'realtime-dashboard',
                name: 'Dashboard Thời gian Thực',
                component: () => import(/* webpackChunkName: "realtime-dashboard" */ '../pages/RealTimeDashboard.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'trend-analysis',
                name: 'Phân tích Xu hướng',
                component: () => import(/* webpackChunkName: "trend-analysis" */ '../pages/TrendAnalysis.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'menu-optimization',
                name: 'Tối ưu Menu',
                component: () => import(/* webpackChunkName: "menu-optimization" */ '../pages/MenuOptimization.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'cost-analysis',
                name: 'Phân tích Chi phí',
                component: () => import(/* webpackChunkName: "cost-analysis" */ '../pages/CostAnalysis.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import(/* webpackChunkName: "login" */ '../pages/Login.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/portfolio',
        name: 'Portfolio',
        component: () => import(/* webpackChunkName: "portfolio" */ '../pages/Portfolio.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import(/* webpackChunkName: "not-found" */ '../pages/NotFound.vue')
    }
]

