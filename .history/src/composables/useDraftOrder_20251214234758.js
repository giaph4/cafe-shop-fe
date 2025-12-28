/**
 * Composable quản lý đơn nháp (Draft Orders) với localStorage
 * Hỗ trợ offline mode và sync khi online
 */

import { ref, watch } from 'vue'
import logger from '@/utils/logger'

const STORAGE_KEY = 'pos_draft_orders'
const MAX_DRAFTS = 10 // Giới hạn số lượng draft tối đa

/**
 * Lưu draft order vào localStorage
 */
export const saveDraftToStorage = (draft) => {
    try {
        const drafts = loadDraftsFromStorage()
        
        // Tạo draft object với metadata
        const draftWithMeta = {
            ...draft,
            savedAt: new Date().toISOString(),
            id: draft.id || `draft_${Date.now()}`
        }
        
        // Nếu draft đã có id, tìm và cập nhật
        const existingIndex = drafts.findIndex(d => d.id === draftWithMeta.id)
        if (existingIndex >= 0) {
            drafts[existingIndex] = draftWithMeta
        } else {
            // Thêm mới, giới hạn số lượng
            drafts.unshift(draftWithMeta)
            if (drafts.length > MAX_DRAFTS) {
                drafts.pop() // Xóa draft cũ nhất
            }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
        return draftWithMeta
    } catch (error) {
        logger.error('[useDraftOrder] Failed to save draft:', error)
        return null
    }
}

/**
 * Load tất cả drafts từ localStorage
 */
export const loadDraftsFromStorage = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) return []
        
        const drafts = JSON.parse(data)
        // Lọc bỏ drafts quá cũ (hơn 7 ngày)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        return drafts.filter(draft => {
            const savedAt = new Date(draft.savedAt)
            return savedAt >= sevenDaysAgo
        })
    } catch (error) {
        logger.error('[useDraftOrder] Failed to load drafts:', error)
        return []
    }
}

/**
 * Xóa draft khỏi localStorage
 */
export const removeDraftFromStorage = (draftId) => {
    try {
        const drafts = loadDraftsFromStorage()
        const filtered = drafts.filter(d => d.id !== draftId)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        return true
    } catch (error) {
        logger.error('[useDraftOrder] Failed to remove draft:', error)
        return false
    }
}

/**
 * Standalone function để remove draft (không cần composable instance)
 */
export const removeDraft = removeDraftFromStorage

/**
 * Xóa tất cả drafts
 */
export const clearAllDrafts = () => {
    try {
        localStorage.removeItem(STORAGE_KEY)
        return true
    } catch (error) {
        logger.error('[useDraftOrder] Failed to clear drafts:', error)
        return false
    }
}

/**
 * Composable để quản lý draft order trong component
 */
export const useDraftOrder = (orderRef, options = {}) => {
    const { autoSave = true, debounceMs = 2000 } = options
    let saveTimeout = null
    
    /**
     * Lưu draft tự động khi order thay đổi
     */
    const autoSaveDraft = () => {
        if (!autoSave) return
        
        if (saveTimeout) {
            clearTimeout(saveTimeout)
        }
        
        saveTimeout = setTimeout(() => {
            const order = orderRef.value
            if (!order) return
            
            // Chỉ lưu nếu là draft (chưa có id hoặc id bắt đầu bằng 'draft_')
            const isDraft = !order.id || String(order.id).startsWith('draft_')
            
            if (isDraft && order.items && order.items.length > 0) {
                saveDraftToStorage(order)
            }
        }, debounceMs)
    }
    
    /**
     * Load draft từ storage
     */
    const loadDraft = (draftId) => {
        const drafts = loadDraftsFromStorage()
        return drafts.find(d => d.id === draftId) || null
    }
    
    /**
     * Sync draft lên server khi online
     */
    const syncDraftToServer = async (draft, createOrderFn) => {
        if (!draft || !createOrderFn) return null
        
        try {
            // Tạo order từ draft
            const orderData = {
                tableId: draft.tableId || null,
                type: draft.type || 'TAKE_AWAY',
                customerId: draft.customerId || null,
                items: draft.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes || null
                }))
            }
            
            const newOrder = await createOrderFn(orderData)
            
            // Xóa draft sau khi sync thành công
            removeDraftFromStorage(draft.id)
            
            return newOrder
        } catch (error) {
            logger.error('[useDraftOrder] Failed to sync draft:', error)
            throw error
        }
    }
    
    // Watch order changes để auto-save
    if (autoSave && orderRef) {
        watch(
            () => orderRef.value,
            () => {
                autoSaveDraft()
            },
            { deep: true }
        )
    }
    
    return {
        saveDraft: saveDraftToStorage,
        loadDraft,
        loadAllDrafts: loadDraftsFromStorage,
        removeDraft: removeDraftFromStorage,
        clearAllDrafts,
        syncDraftToServer
    }
}
