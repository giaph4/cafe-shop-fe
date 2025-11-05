import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import Login from '../pages/Login.vue';
import store from '../store/auth';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('../pages/Dashboard.vue'),
            },
            {
                path: 'categories',
                name: 'Categories',
                component: () => import('../pages/Categories.vue'),
            },
            {
                path: 'tables',
                name: 'Tables',
                component: () => import('../pages/Tables.vue'),
            },
            {
                path: 'ingredients',
                name: 'Ingredients',
                component: () => import('../pages/Ingredients.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../pages/Suppliers.vue'),
            },
            {
                path: 'purchase-orders',
                name: 'PurchaseOrders',
                component: () => import('../pages/PurchaseOrders.vue'),
            },
            {
                path: 'purchase-orders/create',
                name: 'PurchaseOrderCreate',
                component: () => import('../pages/PurchaseOrderCreate.vue'),
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('../pages/Orders.vue'),
            },
            {
                path: 'products',
                name: 'Products',
                component: () => import('../pages/Products.vue'),
            },
            // THÊM ROUTE MỚI CHO QUẢN LÝ CHI PHÍ
            {
                path: 'expenses',
                name: 'Expenses',
                component: () => import('../pages/Expenses.vue'),
            },
        ],
        meta: { requiresAuth: true },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = store.getters.isAuthenticated;
    if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated) {
        next('/login');
    } else if (to.name === 'Login' && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
