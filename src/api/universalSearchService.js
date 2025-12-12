import * as productService from './productService'
import * as customerService from './customerService'
import * as orderService from './orderService'
import * as voucherService from './voucherService'
import * as userService from './userService'
import * as supplierService from './supplierService'
import * as ingredientService from './ingredientService'
import * as fileService from './fileService'
import logger from '@/utils/logger'

/**
 * Universal search across all entities
 * @param {string} keyword - Search keyword
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results grouped by entity
 */
export const universalSearch = async (keyword, options = {}) => {
    if (!keyword || !keyword.trim()) {
        return {
            products: [],
            customers: [],
            orders: [],
            vouchers: [],
            users: [],
            suppliers: [],
            ingredients: [],
            files: [],
            total: 0
        }
    }

    const trimmedKeyword = keyword.trim()
    const searchKeyword = trimmedKeyword // Alias for use in map functions
    const limit = options.limit || 5
    const entities = options.entities || ['products', 'customers', 'orders', 'vouchers', 'users']

    const results = {
        products: [],
        customers: [],
        orders: [],
        vouchers: [],
        users: [],
        suppliers: [],
        ingredients: [],
        files: [],
        total: 0
    }

    try {
        const promises = []

        // Search products
        if (entities.includes('products')) {
            promises.push(
                productService.getProducts({
                    name: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.products = items.map(item => ({
                        id: item.id,
                        type: 'product',
                        title: item.name,
                        subtitle: item.categoryName || 'Sản phẩm',
                        description: item.description || `Giá: ${formatCurrency(item.price || 0)}`,
                        image: item.imageUrl,
                        route: '/products',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            price: item.price,
                            categoryId: item.categoryId,
                            available: item.available
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Products search failed', err)
                })
            )
        }

        // Search customers
        if (entities.includes('customers')) {
            promises.push(
                customerService.getCustomers({
                    keyword: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.customers = items.map(item => ({
                        id: item.id,
                        type: 'customer',
                        title: item.fullName || item.name,
                        subtitle: item.phone || item.email || 'Khách hàng',
                        description: `Điểm tích lũy: ${item.loyaltyPoints || 0} | Email: ${item.email || 'N/A'} | SĐT: ${item.phone || 'N/A'}`,
                        route: item.id ? `/customers/${item.id}` : '/customers',
                        query: item.id ? null : { highlight: item.id, search: searchKeyword },
                        metadata: {
                            phone: item.phone,
                            email: item.email,
                            loyaltyPoints: item.loyaltyPoints,
                            totalOrders: item.totalOrders
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Customers search failed', err)
                })
            )
        }

        // Search orders (by ID or client-side filter)
        if (entities.includes('orders')) {
            promises.push(
                orderService.getOrders(0, limit * 2).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    const filtered = items.filter(item => {
                        const idStr = String(item.id || '')
                        const status = String(item.status || '').toLowerCase()
                        const keywordLower = trimmedKeyword.toLowerCase()
                        return idStr.includes(keywordLower) || status.includes(keywordLower)
                    }).slice(0, limit)

                    results.orders = filtered.map(item => ({
                        id: item.id,
                        type: 'order',
                        title: `Đơn hàng #${item.id}`,
                        subtitle: `Trạng thái: ${getStatusLabel(item.status)}`,
                        description: `Tổng tiền: ${formatCurrency(item.totalAmount || 0)} | Bàn: ${item.tableName || item.tableId || 'N/A'} | Ngày: ${formatDate(item.createdAt)}`,
                        route: '/orders',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            status: item.status,
                            totalAmount: item.totalAmount,
                            tableId: item.tableId,
                            tableName: item.tableName,
                            createdAt: item.createdAt,
                            customerName: item.customerName
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Orders search failed', err)
                })
            )
        }

        // Search vouchers
        if (entities.includes('vouchers')) {
            promises.push(
                voucherService.searchVouchers({
                    code: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.vouchers = items.map(item => ({
                        id: item.id,
                        type: 'voucher',
                        title: item.code,
                        subtitle: item.type === 'PERCENTAGE' ? `Giảm ${item.discountValue}%` : `Giảm ${formatCurrency(item.discountValue)}`,
                        description: `${item.description || 'Mã giảm giá'} | ${item.active ? 'Đang hoạt động' : 'Đã tắt'} | Áp dụng từ ${formatDate(item.validFrom)} đến ${formatDate(item.validTo)}`,
                        route: '/vouchers',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            type: item.type,
                            active: item.active,
                            validFrom: item.validFrom,
                            validTo: item.validTo,
                            usageLimit: item.usageLimit,
                            usedCount: item.usedCount
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Vouchers search failed', err)
                })
            )
        }

        // Search users/staff
        if (entities.includes('users')) {
            promises.push(
                userService.getUsers({
                    page: 0,
                    size: limit * 2
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    const filtered = items.filter(item => {
                        const username = String(item.username || '').toLowerCase()
                        const fullName = String(item.fullName || '').toLowerCase()
                        const keywordLower = trimmedKeyword.toLowerCase()
                        return username.includes(keywordLower) || fullName.includes(keywordLower)
                    }).slice(0, limit)

                    results.users = filtered.map(item => ({
                        id: item.id,
                        type: 'user',
                        title: item.fullName || item.username,
                        subtitle: item.username || 'Người dùng',
                        description: `Email: ${item.email || 'N/A'} | SĐT: ${item.phone || 'N/A'} | Vai trò: ${getRolesLabel(item.roles)}`,
                        route: '/staff',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            username: item.username,
                            roles: item.roles,
                            email: item.email,
                            phone: item.phone,
                            enabled: item.enabled
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Users search failed', err)
                })
            )
        }

        // Search suppliers
        if (entities.includes('suppliers')) {
            promises.push(
                supplierService.getSuppliers({
                    keyword: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.suppliers = items.map(item => ({
                        id: item.id,
                        type: 'supplier',
                        title: item.name,
                        subtitle: item.contactPerson || 'Nhà cung cấp',
                        description: `SĐT: ${item.phone || 'N/A'} | Email: ${item.email || 'N/A'} | Địa chỉ: ${item.address || 'N/A'}`,
                        route: '/suppliers',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            phone: item.phone,
                            email: item.email,
                            address: item.address,
                            contactPerson: item.contactPerson
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Suppliers search failed', err)
                })
            )
        }

        // Search ingredients
        if (entities.includes('ingredients')) {
            promises.push(
                ingredientService.getIngredients({
                    name: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.ingredients = items.map(item => ({
                        id: item.id,
                        type: 'ingredient',
                        title: item.name,
                        subtitle: item.unit || 'Nguyên liệu',
                        description: `Tồn kho: ${item.quantityOnHand || 0} ${item.unit || ''} | Mức đặt lại: ${item.reorderLevel || 'N/A'} ${item.unit || ''}`,
                        route: '/ingredients',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            unit: item.unit,
                            quantityOnHand: item.quantityOnHand,
                            reorderLevel: item.reorderLevel,
                            supplierName: item.supplierName
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Ingredients search failed', err)
                })
            )
        }

        // Search files
        if (entities.includes('files')) {
            promises.push(
                fileService.getFiles({
                    keyword: trimmedKeyword,
                    page: 0,
                    size: limit
                }).then(data => {
                    const items = Array.isArray(data) ? data : (data?.content || [])
                    results.files = items.map(item => ({
                        id: item.id,
                        type: 'file',
                        title: item.fileName || item.name,
                        subtitle: item.fileType || 'File',
                        description: `Kích thước: ${item.fileSize ? formatFileSize(item.fileSize) : 'N/A'} | Upload: ${formatDate(item.uploadedAt)}`,
                        route: '/file-management',
                        query: { highlight: item.id, search: searchKeyword },
                        metadata: {
                            fileType: item.fileType,
                            fileSize: item.fileSize,
                            uploadedAt: item.uploadedAt,
                            uploadedBy: item.uploadedBy
                        }
                    }))
                }).catch(err => {
                    logger.error('[UniversalSearch] Files search failed', err)
                })
            )
        }

        await Promise.all(promises)

        // Calculate total
        results.total =
            results.products.length +
            results.customers.length +
            results.orders.length +
            results.vouchers.length +
            results.users.length +
            results.suppliers.length +
            results.ingredients.length +
            results.files.length

        return results
    } catch (err) {
        logger.error('[UniversalSearch] Search failed', err)
        return results
    }
}

/**
 * Format currency
 */
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
}).format(value || 0)

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format date
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return dateString
    }
}

/**
 * Get status label
 */
const getStatusLabel = (status) => {
    const labels = {
        PENDING: 'Chờ xử lý',
        CONFIRMED: 'Đã xác nhận',
        PREPARING: 'Đang chuẩn bị',
        READY: 'Sẵn sàng',
        SERVED: 'Đã phục vụ',
        CANCELLED: 'Đã hủy',
        PAID: 'Đã thanh toán'
    }
    return labels[status] || status
}

/**
 * Get roles label
 */
const getRolesLabel = (roles) => {
    if (!roles || !Array.isArray(roles)) return 'N/A'
    const roleLabels = {
        ROLE_ADMIN: 'Quản trị viên',
        ROLE_MANAGER: 'Quản lý',
        ROLE_STAFF: 'Nhân viên'
    }
    return roles.map(r => roleLabels[r] || r).join(', ') || 'N/A'
}

