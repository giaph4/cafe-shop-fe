import { defineStore } from 'pinia'
import { ref, computed, shallowReactive } from 'vue'
import * as categoryService from '@/api/categoryService'

const CATEGORY_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Pinia store để quản lý category state và caching
 * Store này cung cấp:
 * - Danh sách categories với caching
 * - Methods để CRUD categories
 * - Quick lookup by ID
 */
export const useCategoryStore = defineStore('categories', () => {
    // State
    const categories = ref([])
    const categoriesMap = shallowReactive(new Map())
    const loading = ref(false)
    const error = ref(null)
    const lastFetch = ref(0)

    /**
     * Load categories từ API
     * @param {boolean} force - Force reload even if cache is valid
     * @returns {Promise<Array>} Danh sách categories
     */
    const loadCategories = async (force = false) => {
        // Kiểm tra cache nếu không force
        if (!force && categories.value.length > 0 && (Date.now() - lastFetch.value < CATEGORY_CACHE_DURATION)) {
            return categories.value
        }

        loading.value = true
        error.value = null
        try {
            const data = await categoryService.getCategories()
            const categoriesList = Array.isArray(data) ? data : []
            
            categories.value = categoriesList
            categoriesMap.clear()
            categoriesList.forEach(category => {
                if (category?.id) {
                    categoriesMap.set(category.id, category)
                }
            })
            
            lastFetch.value = Date.now()
            return categories.value
        } catch (err) {
            error.value = err.response?.data?.message || 'Không thể tải danh sách danh mục.'
            return []
        } finally {
            loading.value = false
        }
    }

    /**
     * Get category by ID
     * @param {number|string} id - Category ID
     * @returns {Object|null} Category object hoặc null
     */
    const getCategoryById = (id) => {
        if (!id) return null
        return categoriesMap.get(Number(id)) || null
    }

    /**
     * Create new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<Object>} Created category
     */
    const createCategory = async (categoryData) => {
        try {
            const created = await categoryService.createCategory(categoryData)
            categories.value.push(created)
            if (created?.id) {
                categoriesMap.set(created.id, created)
            }
            lastFetch.value = Date.now()
            return created
        } catch (err) {
            error.value = err.response?.data?.message || 'Không thể tạo danh mục.'
            throw err
        }
    }

    /**
     * Update category
     * @param {number|string} id - Category ID
     * @param {Object} categoryData - Category data
     * @returns {Promise<Object>} Updated category
     */
    const updateCategory = async (id, categoryData) => {
        try {
            const updated = await categoryService.updateCategory(id, categoryData)
            const index = categories.value.findIndex(c => c.id === Number(id))
            if (index !== -1) {
                categories.value[index] = updated
            }
            if (updated?.id) {
                categoriesMap.set(updated.id, updated)
            }
            lastFetch.value = Date.now()
            return updated
        } catch (err) {
            error.value = err.response?.data?.message || 'Không thể cập nhật danh mục.'
            throw err
        }
    }

    /**
     * Delete category
     * @param {number|string} id - Category ID
     * @returns {Promise<void>}
     */
    const deleteCategory = async (id) => {
        try {
            await categoryService.deleteCategory(id)
            const index = categories.value.findIndex(c => c.id === Number(id))
            if (index !== -1) {
                categories.value.splice(index, 1)
            }
            categoriesMap.delete(Number(id))
            lastFetch.value = Date.now()
        } catch (err) {
            error.value = err.response?.data?.message || 'Không thể xóa danh mục.'
            throw err
        }
    }

    /**
     * Clear store state
     */
    const clear = () => {
        categories.value = []
        categoriesMap.clear()
        loading.value = false
        error.value = null
        lastFetch.value = 0
    }

    // Computed properties
    const activeCategories = computed(() => {
        return categories.value.filter(c => c.status !== 'INACTIVE')
    })

    const categoryCount = computed(() => categories.value.length)

    return {
        // State
        categories,
        loading,
        error,
        
        // Methods
        loadCategories,
        getCategoryById,
        createCategory,
        updateCategory,
        deleteCategory,
        clear,
        
        // Computed
        activeCategories,
        categoryCount
    }
})

