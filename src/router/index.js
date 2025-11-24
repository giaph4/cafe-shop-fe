import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ROLES } from '@/constants/roles'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '../pages/Dashboard.vue'
import Login from '../pages/Login.vue'
import Products from '../pages/Products.vue'
import Orders from '../pages/Orders.vue'
import Reports from '../pages/Reports.vue'
import Chat from '../pages/Chat.vue'
import Categories from '../pages/Categories.vue'
import Tables from '../pages/Tables.vue'
import Ingredients from '../pages/Ingredients.vue'
import Suppliers from '../pages/Suppliers.vue'
import PurchaseOrders from '../pages/PurchaseOrders.vue'
import PurchaseOrderCreate from '../pages/PurchaseOrderCreate.vue'
import InventoryReport from '../pages/InventoryReport.vue'
import Expenses from '../pages/Expenses.vue'
import NotFound from '../pages/NotFound.vue'
import Pos from '../pages/Pos.vue'
import Staff from '../pages/Staff.vue'
import ShiftManagement from '../pages/ShiftManagement.vue'
import Payroll from '../pages/Payroll.vue'
import Vouchers from '../pages/Vouchers.vue'
import ShiftReport from '../pages/ShiftReport.vue'
import ShiftAssignment from '../pages/ShiftAssignment.vue'
import PerformanceAdjustment from '../pages/PerformanceAdjustment.vue'
import Customers from '../pages/Customers.vue'

const routes = [
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: Dashboard,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'pos',
                name: 'POS',
                component: Pos,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.STAFF] }
            },
            {
                path: 'products',
                name: 'Quản lý Sản phẩm',
                component: Products,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'orders',
                name: 'Quản lý Hoá đơn',
                component: Orders,
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers',
                name: 'Quản lý Khách hàng',
                component: Customers,
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'customers/:id',
                name: 'Chi tiết Khách hàng',
                component: () => import('../pages/CustomerOrderDetail.vue'),
                meta: { allowedRoles: [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN] }
            },
            {
                path: 'categories',
                name: 'Quản lý Danh mục',
                component: Categories,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'tables',
                name: 'Quản lý Bàn',
                component: Tables,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'vouchers',
                name: 'Quản lý Voucher',
                component: Vouchers,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'reports',
                name: 'Báo cáo tổng hợp',
                component: Reports,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'chat',
                name: 'Trò chuyện nội bộ',
                component: Chat,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'sales',
                redirect: { path: '/reports' }
            },
            {
                path: 'ingredients',
                name: 'Quản lý Nguyên liệu',
                component: Ingredients,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'suppliers',
                name: 'Quản lý Nhà cung cấp',
                component: Suppliers,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'purchase-orders',
                name: 'Quản lý Nhập hàng',
                component: PurchaseOrders,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'purchase-orders/new',
                name: 'Tạo Đơn nhập hàng',
                component: PurchaseOrderCreate,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'inventory-report',
                name: 'Báo cáo tồn kho',
                component: InventoryReport,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'expenses',
                name: 'Quản lý Chi phí',
                component: Expenses,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'staff',
                name: 'Quản lý Nhân viên',
                component: Staff,
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'shifts',
                name: 'Quản lý Ca làm',
                component: ShiftManagement,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'attendance',
                name: 'Chấm công',
                component: () => import('../pages/Attendance.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'shift-report',
                name: 'Báo cáo Ca làm',
                component: ShiftReport,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'shift-report/:id',
                name: 'Chi tiết Báo cáo Ca làm',
                component: () => import('../pages/ShiftReportDetail.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'shift-assignment',
                name: 'Phân công Ca làm',
                component: ShiftAssignment,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            },
            {
                path: 'performance-adjustment',
                name: 'Điều chỉnh Hiệu suất',
                component: PerformanceAdjustment,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'payroll',
                name: 'Quản lý Lương',
                component: Payroll,
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'profile',
                name: 'Hồ sơ cá nhân',
                component: () => import('../pages/Profile.vue'),
                meta: { requiresAuth: true }
            },
            {
                path: 'login-history',
                name: 'Lịch sử đăng nhập',
                component: () => import('../pages/LoginHistory.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'file-management',
                name: 'Quản lý File',
                component: () => import('../pages/FileManagement.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
            },
            {
                path: 'admin-analytics',
                name: 'Phân tích AI',
                component: () => import('../pages/AdminAnalytics.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'admin-analytics/:id',
                name: 'Chi tiết Phân tích AI',
                component: () => import('../pages/AdminAnalyticsDetail.vue'),
                meta: { allowedRoles: [ROLES.ADMIN] }
            },
            {
                path: 'role-dashboards',
                name: 'Dashboard theo vai trò',
                component: () => import('../pages/RoleBasedDashboards.vue'),
                meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF] }
            }
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true },
    },
   {
       path: '/:pathMatch(.*)*',
       name: 'NotFound',
       component: NotFound
   }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    linkActiveClass: 'active',
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' })
        return
    }

    if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'Dashboard' })
        return
    }

    const allowedRoles = to.meta?.allowedRoles
    if (Array.isArray(allowedRoles) && allowedRoles.length) {
        if (!isAuthenticated) {
            next({ name: 'Login' })
            return
        }

        const roles = authStore.userRoles || []
        const hasPermission = allowedRoles.some((role) => roles.includes(role))

        if (!hasPermission) {
            next({ name: 'Dashboard' })
            return
        }
    }

    next()
})

export default router