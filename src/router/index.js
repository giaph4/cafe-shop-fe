import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import MainLayout from '../MainLayout.vue' // Corrected path
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
            },
            {
                path: 'pos',
                name: 'POS',
                component: Pos,
            },
            {
                path: 'products',
                name: 'Quản lý Sản phẩm',
                component: Products,
            },
            {
                path: 'orders',
                name: 'Quản lý Hoá đơn',
                component: Orders,
                meta: { allowedRoles: ['ROLE_STAFF', 'ROLE_MANAGER', 'ROLE_ADMIN'] }
            },
            {
                path: 'customers',
                name: 'Quản lý Khách hàng',
                component: Customers,
                meta: { allowedRoles: ['ROLE_STAFF', 'ROLE_MANAGER', 'ROLE_ADMIN'] }
            },
            {
                path: 'customers/:id',
                name: 'Chi tiết Khách hàng',
                component: () => import('../pages/CustomerOrderDetail.vue'),
                meta: { allowedRoles: ['ROLE_STAFF', 'ROLE_MANAGER', 'ROLE_ADMIN'] }
            },
            {
                path: 'categories',
                name: 'Quản lý Danh mục',
                component: Categories,
            },
            {
                path: 'tables',
                name: 'Quản lý Bàn',
                component: Tables,
            },
            {
                path: 'vouchers',
                name: 'Quản lý Voucher',
                component: Vouchers,
                meta: { allowedRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
            },
            {
                path: 'reports',
                name: 'Báo cáo tổng hợp',
                component: Reports,
                meta: { allowedRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
            },
            {
                path: 'chat',
                name: 'Trò chuyện nội bộ',
                component: Chat,
                meta: { allowedRoles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'] }
            },
            {
                path: 'sales',
                redirect: { path: '/reports' }
            },
            {
                path: 'ingredients',
                name: 'Quản lý Nguyên liệu',
                component: Ingredients,
            },
            {
                path: 'suppliers',
                name: 'Quản lý Nhà cung cấp',
                component: Suppliers,
            },
            {
                path: 'purchase-orders',
                name: 'Quản lý Nhập hàng',
                component: PurchaseOrders,
            },
            {
                path: 'purchase-orders/new',
                name: 'Tạo Đơn nhập hàng',
                component: PurchaseOrderCreate,
            },
            {
                path: 'inventory-report',
                name: 'Báo cáo tồn kho',
                component: InventoryReport,
                meta: { allowedRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
            },
            {
                path: 'expenses',
                name: 'Quản lý Chi phí',
                component: Expenses,
            },
            {
                path: 'staff',
                name: 'Quản lý Nhân viên',
                component: Staff,
            },
            {
                path: 'shifts',
                name: 'Quản lý Ca làm',
                component: ShiftManagement,
            },
            {
                path: 'shift-report',
                name: 'Báo cáo Ca làm',
                component: ShiftReport,
                meta: { allowedRoles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }
            },
            {
                path: 'payroll',
                name: 'Quản lý Lương',
                component: Payroll,
            },
            {
                path: 'profile',
                name: 'Hồ sơ cá nhân',
                component: () => import('../pages/Profile.vue'),
                meta: { requiresAuth: true }
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