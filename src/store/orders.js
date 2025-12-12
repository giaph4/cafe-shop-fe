import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getOrders, getOrderById } from '@/api/orderService'
import logger from '@/utils/logger'

/**
 * Pinia store để quản lý order state và caching
 * Store này cung cấp:
 * - Cache cho orders để tránh refetch không cần thiết
 * - Quick access to orders by ID
 * - Methods để load và manage orders
 */
export const useOrderStore = defineStore('orders', () => {
    // State
    const orders = ref([])
    const ordersMap = ref(new Map()) // Map<orderId, order> for quick lookup
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    // Computed: Get order by ID
    const getOrderById = (id) => ordersMap.value.get(id) || null

    // Computed: Get orders by status
    const getOrdersByStatus = (status) => orders.value.filter(order => order?.status === status)

    // Computed: Get pending orders
    const pendingOrders = computed(() => orders.value.filter(order => order?.status === 'PENDING'))

    // Computed: Get paid orders
    const paidOrders = computed(() => orders.value.filter(order => order?.status === 'PAID'))

    /**
     * Load orders from API
     * @param {Object} params - Query parameters (page, size, status, etc.)
     * @param {boolean} force - Force reload
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

            // Update orders list
            orders.value = ordersArray

            // Update map
            ordersArray.forEach(order => {
                if (order?.id) {
                    ordersMap.value.set(order.id, order)
                }
            })

            lastUpdated.value = Date.now()
            return data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng.'
            logger.error('Failed to load orders:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Load single order by ID
     * @param {number} orderId - Order ID
     * @param {boolean} force - Force reload from API
     */
    const loadOrder = async (orderId, force = false) => {
        if (!orderId) return null

        // Check cache first
        if (!force) {
            const cached = getOrderById(orderId)
            if (cached && lastUpdated.value) {
                const age = Date.now() - lastUpdated.value
                if (age < 60000) { // 1 minute cache
                    return cached
                }
            }
        }

        try {
            const order = await getOrderById(orderId)
            if (order?.id) {
                // Update cache
                ordersMap.value.set(order.id, order)

                // Update in list if exists
                const index = orders.value.findIndex(o => o.id === order.id)
                if (index !== -1) {
                    orders.value[index] = order
                }

                lastUpdated.value = Date.now()
            }
            return order
        } catch (err) {
            logger.error('Failed to load order:', err)
            throw err
        }
    }

    /**
     * Update order in cache
     * @param {Object} order - Updated order object
     */
    const updateOrder = (order) => {
        if (!order?.id) return

        // Update map
        ordersMap.value.set(order.id, order)

        // Update in list
        const index = orders.value.findIndex(o => o.id === order.id)
        if (index !== -1) {
            orders.value[index] = order
        } else {
            orders.value.push(order)
        }

        lastUpdated.value = Date.now()
    }

    /**
     * Remove order from cache
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
     * Clear all state
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
        getOrderById,
        getOrdersByStatus,
        loadOrders,
        loadOrder,
        updateOrder,
        removeOrder,
        clear
    }
})

