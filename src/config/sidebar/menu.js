export const sidebarMenu = [
    {
        heading: 'Tổng quan',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: 'dashboard',
                to: '/',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            },
            {
                id: 'chat',
                label: 'Trò chuyện',
                icon: 'chat',
                to: '/chat',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            }
        ]
    },
    {
        heading: 'Vận hành',
        items: [
            {
                id: 'pos-suite',
                label: 'Điểm bán & Hoá đơn',
                icon: 'pos',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                children: [
                    {
                        id: 'pos',
                        label: 'Điểm bán (POS)',
                        icon: 'pos',
                        to: '/pos',
                        roles: ['ROLE_ADMIN', 'ROLE_STAFF']
                    },
                    {
                        id: 'orders',
                        label: 'Hoá đơn',
                        icon: 'orders',
                        to: '/orders',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    },
                    {
                        id: 'tables',
                        label: 'Sơ đồ bàn',
                        icon: 'tables',
                        to: '/tables',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    }
                ]
            },
            {
                id: 'sales-analytics',
                label: 'Báo cáo & Phân tích',
                icon: 'reports',
                to: '/sales',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
            }
        ]
    },
    {
        heading: 'Sản phẩm & Kho',
        items: [
            {
                id: 'products',
                label: 'Danh mục sản phẩm',
                icon: 'products',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'products-list',
                        label: 'Sản phẩm',
                        icon: 'products',
                        to: '/products',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'categories',
                        label: 'Danh mục',
                        icon: 'categories',
                        to: '/categories',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            },
            {
                id: 'inventory',
                label: 'Kho & Cung ứng',
                icon: 'inventory',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'ingredients',
                        label: 'Nguyên liệu',
                        icon: 'ingredients',
                        to: '/ingredients',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'suppliers',
                        label: 'Nhà cung cấp',
                        icon: 'suppliers',
                        to: '/suppliers',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'purchase-orders',
                        label: 'Đơn nhập hàng',
                        icon: 'purchaseOrders',
                        to: '/purchase-orders',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'purchase-orders-create',
                        label: 'Tạo đơn nhập',
                        icon: 'purchaseCreate',
                        to: '/purchase-orders/new',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'inventory-report',
                        label: 'Báo cáo tồn kho',
                        icon: 'inventoryReport',
                        to: '/inventory-report',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            }
        ]
    },
    {
        heading: 'Nhân sự & Tài chính',
        items: [
            {
                id: 'people',
                label: 'Nhân sự & Ca làm',
                icon: 'people',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'staff',
                        label: 'Nhân viên',
                        icon: 'staff',
                        to: '/staff',
                        roles: ['ROLE_ADMIN']
                    },
                    {
                        id: 'shifts',
                        label: 'Ca làm',
                        icon: 'shifts',
                        to: '/shifts',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'shift-report',
                        label: 'Báo cáo ca làm',
                        icon: 'shiftReport',
                        to: '/shift-report',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            },
            {
                id: 'finance',
                label: 'Tài chính',
                icon: 'finance',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'expenses',
                        label: 'Khoản chi',
                        icon: 'expenses',
                        to: '/expenses',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'payroll',
                        label: 'Lương',
                        icon: 'payroll',
                        to: '/payroll',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            }
        ]
    },
    {
        heading: 'Khác',
        items: [
            {
                id: 'profile',
                label: 'Hồ sơ cá nhân',
                icon: 'profile',
                to: '/profile',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            },
            {
                id: 'settings',
                label: 'Cài đặt hệ thống',
                icon: 'settings',
                to: '/settings',
                roles: ['ROLE_ADMIN']
            }
        ]
    }
]
