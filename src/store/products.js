import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProducts } from '@/api/productService'
import logger from '@/utils/logger'

/**
 * Pinia store quản lý product state và caching
 * Store này cung cấp:
 * - Cache cho products để tránh refetch không cần thiết
 * - Truy cập nhanh products theo ID
 * - Các methods để load và quản lý products
 */
export const useProductStore = defineStore('products', () => {
    // State
    const products = ref([])
    const productsMap = ref(new Map()) // Map<productId, product> để tra cứu nhanh
    const loading = ref(false)
    const error = ref(null)
    const lastUpdated = ref(null)

    // Lấy product theo ID
    const getProductById = (id) => productsMap.value.get(id) || null

    // Lấy products theo category
    const getProductsByCategory = (categoryId) => products.value.filter(product => product?.categoryId === categoryId)

    // Lấy products đang hoạt động
    const activeProducts = computed(() => products.value.filter(product => product?.status === 'ACTIVE' || !product?.status))

    // Lấy products theo trạng thái
    const getProductsByStatus = (status) => products.value.filter(product => product?.status === status)

    /**
     * Load products từ API
     * @param {Object} params - Query parameters (page, size, categoryId, etc.)
     * @param {boolean} force - Bắt buộc reload
     */
    const loadProducts = async (params = {}, force = false) => {
        if (loading.value && !force) return

        // Nếu có dữ liệu gần đây và không bắt buộc, bỏ qua
        if (!force && products.value.length > 0 && lastUpdated.value) {
            const age = Date.now() - lastUpdated.value
            if (age < 60000) { // Cache 1 phút
                return
            }
        }

        loading.value = true
        error.value = null

        try {
            const data = await getProducts(params)
            const productsArray = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])

            // Cập nhật danh sách products
            products.value = productsArray

            // Cập nhật map
            productsArray.forEach(product => {
                if (product?.id) {
                    productsMap.value.set(product.id, product)
                }
            })

            lastUpdated.value = Date.now()
            return data
        } catch (err) {
            error.value = err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm.'
            logger.error('Không thể tải products:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Load một product theo ID
     * @param {number} productId - Product ID
     * @param {boolean} force - Bắt buộc reload từ API
     */
    const loadProduct = async (productId, force = false) => {
        if (!productId) return null

        // Kiểm tra cache trước
        if (!force) {
            const cached = getProductById(productId)
            if (cached && lastUpdated.value) {
                const age = Date.now() - lastUpdated.value
                if (age < 300000) { // Cache 5 phút cho từng product
                    return cached
                }
            }
        }

        try {
            const product = await getProductById(productId)
            if (product?.id) {
                // Cập nhật cache
                productsMap.value.set(product.id, product)

                // Cập nhật trong danh sách nếu có
                const index = products.value.findIndex(p => p.id === product.id)
                if (index !== -1) {
                    products.value[index] = product
                }

                lastUpdated.value = Date.now()
            }
            return product
        } catch (err) {
            logger.error('Không thể tải product:', err)
            throw err
        }
    }

    /**
     * Cập nhật product trong cache
     * @param {Object} product - Product object đã cập nhật
     */
    const updateProduct = (product) => {
        if (!product?.id) return

        // Cập nhật map
        productsMap.value.set(product.id, product)

        // Cập nhật trong danh sách
        const index = products.value.findIndex(p => p.id === product.id)
        if (index !== -1) {
            products.value[index] = product
        } else {
            products.value.push(product)
        }

        lastUpdated.value = Date.now()
    }

    /**
     * Xóa product khỏi cache
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
     * Xóa tất cả state
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
