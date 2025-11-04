// ... các import ...
import Products from '../pages/Products.vue'
import Orders from '../pages/Orders.vue'
import Categories from '../pages/Categories.vue' // 1. Import trang mới

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
                path: 'products',
                name: 'Quản lý Sản phẩm',
                component: Products,
            },
            {
                path: 'orders',
                name: 'Quản lý Hoá đơn',
                component: Orders,
            },
            {
                path: 'categories',
                name: 'Quản lý Danh mục',
                component: Categories,
            },
            // ...
        ]
    },
    // ... route /login ...
]
// ... phần còn lại ...
export default router