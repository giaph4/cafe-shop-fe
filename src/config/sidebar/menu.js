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
                id: 'role-dashboards',
                label: 'Dashboard theo vai trò',
                icon: 'roleDashboards',
                to: '/role-dashboards',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            },
            {
                id: 'chat',
                label: 'Trò chuyện',
                icon: 'chat',
                to: '/chat',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                status: 'development'
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
                    },
                    {
                        id: 'customers',
                        label: 'Khách hàng',
                        icon: 'customers',
                        to: '/customers',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    }
                ]
            },
            {
                id: 'vouchers',
                label: 'Quản lý voucher',
                icon: 'voucher',
                to: '/vouchers',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
            },
            {
                id: 'sales-analytics',
                label: 'Báo cáo & Phân tích',
                icon: 'reports',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'reports',
                        label: 'Báo cáo tổng hợp',
                        icon: 'reports',
                        to: '/reports',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'admin-analytics',
                        label: 'Phân tích AI',
                        icon: 'adminAnalytics',
                        to: '/admin-analytics',
                        roles: ['ROLE_ADMIN']
                    }
                ]
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
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                children: [
                    {
                        id: 'products-list',
                        label: 'Sản phẩm',
                        icon: 'products',
                        to: '/products',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
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
                        id: 'inventory-report',
                        label: 'Báo cáo tồn kho',
                        icon: 'inventoryReport',
                        to: '/inventory-report',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'smart-inventory',
                        label: 'Tồn kho thông minh',
                        icon: 'smartInventory',
                        to: '/smart-inventory',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'ingredient-demand-forecast',
                        label: 'Dự báo Nhu cầu',
                        icon: 'ingredientDemandForecast',
                        to: '/ingredient-demand-forecast',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'inventory-adjustment-history',
                        label: 'Lịch sử điều chỉnh',
                        icon: 'inventoryAdjustmentHistory',
                        to: '/inventory-adjustment-history',
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
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
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
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
                    },
                    {
                        id: 'attendance',
                        label: 'Chấm công',
                        icon: 'attendance',
                        to: '/attendance',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                        status: 'development'
                    },
                    {
                        id: 'shift-report',
                        label: 'Báo cáo ca làm',
                        icon: 'shiftReport',
                        to: '/shift-report',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
                    },
                    {
                        id: 'shift-assignment',
                        label: 'Phân công ca làm',
                        icon: 'shiftAssignment',
                        to: '/shift-assignment',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                        status: 'development'
                    },
                    {
                        id: 'shift-efficiency',
                        label: 'Hiệu quả Ca làm',
                        icon: 'shiftEfficiency',
                        to: '/shift-efficiency',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
                    },
                    {
                        id: 'performance-adjustment',
                        label: 'Điều chỉnh hiệu suất',
                        icon: 'performanceAdjustment',
                        to: '/performance-adjustment',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
                    },
                    {
                        id: 'staff-performance',
                        label: 'Phân tích Hiệu suất',
                        icon: 'staffPerformance',
                        to: '/staff-performance',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
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
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                        status: 'development'
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
                id: 'login-history',
                label: 'Lịch sử đăng nhập',
                icon: 'loginHistory',
                to: '/login-history',
                roles: ['ROLE_ADMIN']
            },
            {
                id: 'file-management',
                label: 'Quản lý File',
                icon: 'fileManagement',
                to: '/file-management',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
            }
        ]
    }
]
