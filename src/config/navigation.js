export const navigationSections = [
    {
        id: 'overview',
        title: 'Tổng quan',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: 'bi bi-speedometer2',
                to: '/',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            },
            {
                id: 'chat',
                label: 'Trò chuyện',
                icon: 'bi bi-chat-dots',
                to: '/chat',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
            }
        ]
    },
    {
        id: 'sales',
        title: 'Bán hàng',
        items: [
            {
                id: 'sales-operations',
                label: 'Điểm bán & Hoá đơn',
                icon: 'bi bi-bag-check',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF'],
                children: [
                    {
                        id: 'pos',
                        label: 'Điểm bán (POS)',
                        icon: 'bi bi-calculator-fill',
                        to: '/pos',
                        roles: ['ROLE_ADMIN', 'ROLE_STAFF']
                    },
                    {
                        id: 'orders',
                        label: 'Hoá đơn',
                        icon: 'bi bi-receipt-cutoff',
                        to: '/orders',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    },
                    {
                        id: 'vouchers',
                        label: 'Voucher',
                        icon: 'bi bi-ticket-detailed',
                        to: '/vouchers',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'tables',
                        label: 'Sơ đồ bàn',
                        icon: 'bi bi-grid-3x3-gap',
                        to: '/tables',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    }
                ]
            },
            {
                id: 'sales-analytics',
                label: 'Báo cáo tổng hợp',
                icon: 'bi bi-graph-up',
                to: '/reports',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
            }
        ]
    },
    {
        id: 'catalog',
        title: 'Sản phẩm & Kho',
        items: [
            {
                id: 'products',
                label: 'Danh mục sản phẩm',
                icon: 'bi bi-box-seam',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'products-list',
                        label: 'Sản phẩm',
                        icon: 'bi bi-box',
                        to: '/products',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'categories',
                        label: 'Danh mục',
                        icon: 'bi bi-tags',
                        to: '/categories',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            },
            {
                id: 'inventory',
                label: 'Kho & Nhà cung cấp',
                icon: 'bi bi-archive',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'ingredients',
                        label: 'Nguyên liệu',
                        icon: 'bi bi-droplet-half',
                        to: '/ingredients',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'suppliers',
                        label: 'Nhà cung cấp',
                        icon: 'bi bi-truck',
                        to: '/suppliers',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'purchase-orders',
                        label: 'Đơn nhập hàng',
                        icon: 'bi bi-clipboard-data',
                        to: '/purchase-orders',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'purchase-orders-create',
                        label: 'Tạo đơn nhập',
                        icon: 'bi bi-file-earmark-plus',
                        to: '/purchase-orders/new',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'inventory-report',
                        label: 'Báo cáo tồn kho',
                        icon: 'bi bi-clipboard-check',
                        to: '/inventory-report',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            }
        ]
    },
    {
        id: 'people',
        title: 'Nhân sự & Tài chính',
        items: [
            {
                id: 'people-operations',
                label: 'Nhân sự & Ca làm',
                icon: 'bi bi-people-fill',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'staff',
                        label: 'Nhân viên',
                        icon: 'bi bi-person-badge',
                        to: '/staff',
                        roles: ['ROLE_ADMIN']
                    },
                    {
                        id: 'shifts',
                        label: 'Ca làm',
                        icon: 'bi bi-calendar-check',
                        to: '/shifts',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'attendance',
                        label: 'Chấm công',
                        icon: 'bi bi-clock-history',
                        to: '/attendance',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_STAFF']
                    }
                ]
            },
            {
                id: 'finance',
                label: 'Tài chính',
                icon: 'bi bi-cash-stack',
                roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
                children: [
                    {
                        id: 'expenses',
                        label: 'Khoản chi',
                        icon: 'bi bi-wallet2',
                        to: '/expenses',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    },
                    {
                        id: 'payroll',
                        label: 'Lương',
                        icon: 'bi bi-cash-coin',
                        to: '/payroll',
                        roles: ['ROLE_ADMIN', 'ROLE_MANAGER']
                    }
                ]
            }
        ]
    }
]

export const allNavigationItems = navigationSections.flatMap((section) => section.items)
