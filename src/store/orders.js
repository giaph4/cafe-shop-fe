import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getOrders, getOrderById } from '@/api/orderService'
import logger from '@/utils/logger'

/**
 * Pinia store quản lý order state và caching
 * Store này cung cấp:
 * - Cache cho orders để tránh refetch không cần thiết
 * - Truy cập nhanh orders theo ID
 * - Các methods để load và quản lý orders
 */
export const useOrderStore = defineStore('orders', () => {
    // State
    const orders = ref([])
    const ordersMap = ref(new Map()) // Map<orderId, order> để tra cứu nhanh
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    // Lấy order theo ID
    const getOrderByIdFn = (id) => ordersMap.value.get(id) || null

    // Lấy orders theo trạng thái
    const getOrdersByStatus = (status) => orders.value.filter(order => order?.status === status)

    // Orders đang chờ xử lý
    const pendingOrders = computed(() => orders.value.filter(order => order?.status === 'PENDING'))

    // Orders đã thanh toán
    const paidOrders = computed(() => orders.value.filter(order => order?.status === 'PAID'))

    /**
     * Load orders từ API
     * @param {Object} params - Query parameters (page, size, status, etc.)
     * @param {boolean} force - Bắt buộc reload
     */
    const loadOrders = async (params = {}, force = false) => {
        if (loading.value && !force) return

        loading.value = true
        error.value = null

        try {
            const { page = 0, size = 10, status, startDate, endDate } = params
            let data

            if (status) {
                const { getOrdersByStatus } = await import('@/api/orderService')
                data = await getOrdersByStatus(status, page, size)
            } else if (startDate && endDate) {
                const { getOrdersByDateRange } = await import('@/api/orderService')
                data = await getOrdersByDateRange(startDate, endDate, page, size)
            } else {
                data = await getOrders(page, size)
            }

            const ordersArray = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])

            // Cập nhật danh sách orders
            orders.value = ordersArray

            // Cập nhật map
            ordersArray.forEach(order => {
                if (order?.id) {
                    ordersMap.value.set(order.id, order)
                }
            })

            lastUpdated.value = Date.now()
            return data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng.'
            logger.error('Không thể tải orders:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Load một order theo ID
     * @param {number} orderId - Order ID
     * @param {boolean} force - Bắt buộc reload từ API
     */
    const loadOrder = async (orderId, force = false) => {
        if (!orderId) return null

        // Kiểm tra cache trước
        if (!force) {
            const cached = getOrderByIdFn(orderId)
            if (cached && lastUpdated.value) {
                const age = Date.now() - lastUpdated.value
                if (age < 60000) { // Cache 1 phút
                    return cached
                }
            }
        }

        try {
            const order = await getOrderById(orderId)
            if (order?.id) {
                // Cập nhật cache
                ordersMap.value.set(order.id, order)

                // Cập nhật trong danh sách nếu có
                const index = orders.value.findIndex(o => o.id === order.id)
                if (index !== -1) {
                    orders.value[index] = order
                }

                lastUpdated.value = Date.now()
            }
            return order
        } catch (err) {
            logger.error('Không thể tải order:', err)
            throw err
        }
    }

    /**
     * Cập nhật order trong cache
     * @param {Object} order - Order object đã cập nhật
     */
    const updateOrder = (order) => {
        if (!order?.id) return

        // Cập nhật map
        ordersMap.value.set(order.id, order)

        // Cập nhật trong danh sách
        const index = orders.value.findIndex(o => o.id === order.id)
        if (index !== -1) {
            orders.value[index] = order
        } else {
            orders.value.push(order)
        }

        lastUpdated.value = Date.now()
    }

    /**
     * Xóa order khỏi cache
     * @param {number} orderId - Order ID
     */
    const removeOrder = (orderId) => {
        ordersMap.value.delete(orderId)
        const index = orders.value.findIndex(o => o.id === orderId)
        if (index !== -1) {
            orders.value.splice(index, 1)
        }
        lastUpdated.value = Date.now()
    }

    /**
     * Xóa tất cả state
     */
    const clear = () => {
        orders.value = []
        ordersMap.value.clear()
        loading.value = false
        error.value = null
        lastUpdated.value = null
    }

    return {
        // State
        orders,
        loading,
        error,
        lastUpdated,

        // Computed
        pendingOrders,
        paidOrders,

        // Methods
        getOrderById: getOrderByIdFn,
        getOrdersByStatus,
        loadOrders,
        loadOrder,
        updateOrder,
        removeOrder,
        clear
    }
})
