import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProducts } from '@/api/productService'
import logger from '@/utils/logger'

/**
 * Pinia store để quản lý product state và caching
 * Store này cung cấp:
 * - Cache cho products để tránh refetch không cần thiết
 * - Quick access to products by ID
 * - Methods để load và manage products
 */
export const useProductStore = defineStore('products', () => {
    // State
    const products = ref([])
    const productsMap = ref(new Map()) // Map<productId, product> for quick lookup
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    // Computed: Get product by ID
    const getProductById = (id) => productsMap.value.get(id) || null

    // Computed: Get products by category
    const getProductsByCategory = (categoryId) => products.value.filter(product => product?.categoryId === categoryId)

    // Computed: Get active products
    const activeProducts = computed(() => products.value.filter(product => product?.status === 'ACTIVE' || !product?.status))

    // Computed: Get products by status
    const getProductsByStatus = (status) => products.value.filter(product => product?.status === status)

    /**
     * Load products from API
     * @param {Object} params - Query parameters (page, size, categoryId, etc.)
     * @param {boolean} force - Force reload
     */
    const loadProducts = async (params = {}, force = false) => {
        if (loading.value && !force) return

        // If we have recent data and not forcing, skip
        if (!force && products.value.length > 0 && lastUpdated.value) {
            const age = Date.now() - lastUpdated.value
            if (age < 60000) { // 1 minute cache
                return
            }
        }

        loading.value = true
        error.value = null

        try {
            const data = await getProducts(params)
            const productsArray = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])

            // Update products list
            products.value = productsArray

            // Update map
            productsArray.forEach(product => {
                if (product?.id) {
                    productsMap.value.set(product.id, product)
                }
            })

            lastUpdated.value = Date.now()
            return data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm.'
            logger.error('Failed to load products:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Load single product by ID
     * @param {number} productId - Product ID
     * @param {boolean} force - Force reload from API
     */
    const loadProduct = async (productId, force = false) => {
        if (!productId) return null

        // Check cache first
        if (!force) {
            const cached = getProductById(productId)
            if (cached && lastUpdated.value) {
                const age = Date.now() - lastUpdated.value
                if (age < 300000) { // 5 minutes cache for individual products
                    return cached
                }
            }
        }

        try {
            const product = await getProductById(productId)
            if (product?.id) {
                // Update cache
                productsMap.value.set(product.id, product)

                // Update in list if exists
                const index = products.value.findIndex(p => p.id === product.id)
                if (index !== -1) {
                    products.value[index] = product
                }

                lastUpdated.value = Date.now()
            }
            return product
        } catch (err) {
            logger.error('Failed to load product:', err)
            throw err
        }
    }

    /**
     * Update product in cache
     * @param {Object} product - Updated product object
     */
    const updateProduct = (product) => {
        if (!product?.id) return

        // Update map
        productsMap.value.set(product.id, product)

        // Update in list
        const index = products.value.findIndex(p => p.id === product.id)
        if (index !== -1) {
            products.value[index] = product
        } else {
            products.value.push(product)
        }

        lastUpdated.value = Date.now()
    }

    /**
     * Remove product from cache
     * @param {number} productId - Product ID
     */
    const removeProduct = (productId) => {
        productsMap.value.delete(productId)
        const index = products.value.findIndex(p => p.id === productId)
        if (index !== -1) {
            products.value.splice(index, 1)
        }
        lastUpdated.value = Date.now()
    }

    /**
     * Clear all state
     */
    const clear = () => {
        products.value = []
        productsMap.value.clear()
        loading.value = false
        error.value = null
        lastUpdated.value = null
    }

    return {
        // State
        products,
        loading,
        error,
        lastUpdated,

        // Computed
        activeProducts,

        // Methods
        getProductById,
        getProductsByCategory,
        getProductsByStatus,
        loadProducts,
        loadProduct,
        updateProduct,
        removeProduct,
        clear
    }
})

