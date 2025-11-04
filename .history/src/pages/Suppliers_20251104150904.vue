// ... các import ...
import Ingredients from '../pages/Ingredients.vue'
import Suppliers from '../pages/Suppliers.vue' // 1. Import trang mới

const routes = [
{
path: '/',
component: MainLayout,
meta: { requiresAuth: true },
children: [
// ... các route khác ...
{
path: 'ingredients',
name: 'Quản lý Nguyên liệu',
component: Ingredients,
},
// 2. Thêm route cho Suppliers
{
path: 'suppliers',
name: 'Quản lý Nhà cung cấp',
component: Suppliers,
},
]
},
// ... route /login ...
]
// ...
export default router