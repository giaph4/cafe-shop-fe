import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as inventoryManagementService from '@/api/inventoryManagementService'
import logger from '@/utils/logger'

export const useInventoryManagementStore = defineStore('inventoryManagement', () => {
    const loading = ref(false)
    const error = ref(null)
    const analysisData = ref(null)
    const stockHistory = ref(null)
    const suppliers = ref([])
    
    const hasData = computed(() => !!analysisData.value)
    const hasHistory = computed(() => !!stockHistory.value)
    
    const summary = computed(() => {
        if (!analysisData.value) return null
        return analysisData.value.summary
    })
    
    const items = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.items || []
    })
    
    const criticalItems = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.alerts?.critical || []
    })
    
    const warningItems = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.alerts?.warning || []
    })
    
    const infoItems = computed(() => {
        if (!analysisData.value) return []
        return analysisData.value.alerts?.info || []
    })
    
    const analyzeInventory = async ({ includeStable = false } = {}) => {
        loading.value = true
        error.value = null
        
        try {
            const data = await inventoryManagementService.analyzeInventory({ includeStable })
            
            analysisData.value = data
            logger.log('[InventoryManagement] Analysis completed', data.meta)
            return data
        } catch (err) {
            error.value = err.message || 'Không thể phân tích tồn kho'
            logger.error('[InventoryManagement] Failed to analyze', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const getStockHistory = async (ingredientId, days = 30) => {
        loading.value = true
        error.value = null
        
        try {
            // Try to get ingredient data from analysisData as fallback
            const fallbackData = analysisData.value?.items?.find(
                item => item.ingredientId === ingredientId
            )
            
            const data = await inventoryManagementService.getStockLevelHistory(
                ingredientId, 
                days, 
                fallbackData
            )
            
            stockHistory.value = data
            logger.log('[InventoryManagement] Stock history loaded', { ingredientId, days, count: data.length })
            return data
        } catch (err) {
            error.value = err.message || 'Không thể lấy lịch sử tồn kho'
            logger.error('[InventoryManagement] Failed to get stock history', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const getSuppliers = async (ingredientId) => {
        try {
            const data = await inventoryManagementService.getSuppliersForIngredient(ingredientId)
            suppliers.value = data
            return data
        } catch (err) {
            logger.error('[InventoryManagement] Failed to get suppliers', err)
            return []
        }
    }
    
    const createPurchaseOrder = async (orderData) => {
        loading.value = true
        error.value = null
        
        try {
            const { createPurchaseOrder: createPO } = await import('@/api/purchaseOrderService')
            const data = await createPO(orderData)
            logger.log('[InventoryManagement] Purchase order created', data)
            return data
        } catch (err) {
            error.value = err.message || 'Không thể tạo đơn đặt hàng'
            logger.error('[InventoryManagement] Failed to create purchase order', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    
    const reset = () => {
        analysisData.value = null
        stockHistory.value = null
        suppliers.value = []
        error.value = null
    }
    
    return {
        loading,
        error,
        analysisData,
        stockHistory,
        suppliers,
        hasData,
        hasHistory,
        summary,
        items,
        criticalItems,
        warningItems,
        infoItems,
        analyzeInventory,
        getStockHistory,
        getSuppliers,
        createPurchaseOrder,
        reset
    }
})

