import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import logger from '@/utils/logger'

export const useSearchStore = defineStore('search', () => {
    const searchHistory = ref({
        products: [],
        customers: [],
        orders: [],
        vouchers: [],
        users: [],
        suppliers: [],
        ingredients: [],
        files: []
    })

    const savedSearches = ref([])
    const savedFilterPresets = ref({})
    const recentSearches = ref([])

    // Load from localStorage
    const loadFromStorage = () => {
        try {
            const historyData = localStorage.getItem('searchHistory')
            if (historyData) {
                searchHistory.value = { ...searchHistory.value, ...JSON.parse(historyData) }
            }

            const savedData = localStorage.getItem('savedSearches')
            if (savedData) {
                savedSearches.value = JSON.parse(savedData)
            }

            const presetsData = localStorage.getItem('savedFilterPresets')
            if (presetsData) {
                savedFilterPresets.value = JSON.parse(presetsData)
            }

            const recentData = localStorage.getItem('recentSearches')
            if (recentData) {
                recentSearches.value = JSON.parse(recentData)
            }
        } catch (err) {
            logger.warn('[SearchStore] Failed to load from storage', err)
        }
    }

    // Save to localStorage
    const saveToStorage = () => {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
            localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
            localStorage.setItem('savedFilterPresets', JSON.stringify(savedFilterPresets.value))
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
        } catch (err) {
            logger.warn('[SearchStore] Failed to save to storage', err)
        }
    }

    // Thêm vào lịch sử tìm kiếm
    const addToHistory = (entity, keyword) => {
        if (!keyword || !keyword.trim()) return

        const trimmedKeyword = keyword.trim().toLowerCase()
        const history = searchHistory.value[entity] || []

        // Xóa bản sao
        const filtered = history.filter(k => k !== trimmedKeyword)

        // Thêm vào đầu
        filtered.unshift(trimmedKeyword)

        // Limit to 10
        searchHistory.value[entity] = filtered.slice(0, 10)
        saveToStorage()
    }

    // Thêm vào tìm kiếm gần đây (toàn cục)
    const addToRecent = (keyword, entity, resultCount = 0) => {
        if (!keyword || !keyword.trim()) return

        const search = {
            keyword: keyword.trim(),
            entity,
            resultCount,
            timestamp: new Date().toISOString()
        }

        // Xóa bản sao
        const filtered = recentSearches.value.filter(s =>
            s.keyword !== search.keyword || s.entity !== entity
        )

        // Thêm vào đầu
        filtered.unshift(search)

        // Limit to 20
        recentSearches.value = filtered.slice(0, 20)
        saveToStorage()
    }

    // Lấy gợi ý cho entity
    const getSuggestions = (entity, keyword = '') => {
        const history = searchHistory.value[entity] || []
        if (!keyword) return history.slice(0, 5)

        const lowerKeyword = keyword.toLowerCase()
        return history
            .filter(k => k.includes(lowerKeyword))
            .slice(0, 5)
    }

    // Save search
    const saveSearch = (name, keyword, entity, filters = {}) => {
        const search = {
            id: Date.now().toString(),
            name,
            keyword,
            entity,
            filters,
            createdAt: new Date().toISOString()
        }

        savedSearches.value.push(search)
        saveToStorage()
        return search
    }

    // Delete saved search
    const deleteSavedSearch = (id) => {
        const index = savedSearches.value.findIndex(s => s.id === id)
        if (index !== -1) {
            savedSearches.value.splice(index, 1)
            saveToStorage()
        }
    }

    // Save filter preset
    const saveFilterPreset = (pageName, presetName, filters) => {
        if (!savedFilterPresets.value[pageName]) {
            savedFilterPresets.value[pageName] = []
        }

        const preset = {
            id: Date.now().toString(),
            name: presetName,
            filters: { ...filters },
            createdAt: new Date().toISOString()
        }

        savedFilterPresets.value[pageName].push(preset)
        saveToStorage()
        return preset
    }

    // Delete filter preset
    const deleteFilterPreset = (pageName, presetId) => {
        if (!savedFilterPresets.value[pageName]) return

        const index = savedFilterPresets.value[pageName].findIndex(p => p.id === presetId)
        if (index !== -1) {
            savedFilterPresets.value[pageName].splice(index, 1)
            saveToStorage()
        }
    }

    // Lấy các preset filter cho trang
    const getFilterPresets = (pageName) => savedFilterPresets.value[pageName] || []

    // Xóa lịch sử cho entity
    const clearHistory = (entity) => {
        if (entity) {
            searchHistory.value[entity] = []
        } else {
            searchHistory.value = {
                products: [],
                customers: [],
                orders: [],
                vouchers: [],
                users: [],
                suppliers: [],
                ingredients: [],
                files: []
            }
        }
        saveToStorage()
    }

    // Clear recent searches
    const clearRecent = () => {
        recentSearches.value = []
        saveToStorage()
    }

    // Initialize
    loadFromStorage()

    return {
        // State
        searchHistory,
        savedSearches,
        savedFilterPresets,
        recentSearches,

        // Actions
        addToHistory,
        addToRecent,
        getSuggestions,
        saveSearch,
        deleteSavedSearch,
        saveFilterPreset,
        deleteFilterPreset,
        getFilterPresets,
        clearHistory,
        clearRecent
    }
})

