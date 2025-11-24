/**
 * Shared Response Normalizers
 * Chuẩn hóa response mapping cho toàn bộ API services
 */

/**
 * Normalize paginated response (Page object)
 * @param {Object|Array} data - Response data
 * @param {Function} itemNormalizer - Function to normalize each item
 * @returns {Object} Normalized page object
 */
export const normalizePageResponse = (data, itemNormalizer = null) => {
    // If data is already a Page object
    if (data && typeof data === 'object' && 'content' in data) {
        const normalized = {
            content: Array.isArray(data.content) ? data.content : [],
            totalElements: data.totalElements || 0,
            totalPages: data.totalPages || 0,
            number: data.number ?? data.page ?? 0,
            size: data.size || data.pageSize || 10,
            first: data.first ?? (data.number === 0),
            last: data.last ?? false
        }
        
        // Apply item normalizer if provided
        if (itemNormalizer && typeof itemNormalizer === 'function') {
            normalized.content = normalized.content.map(itemNormalizer).filter(Boolean)
        }
        
        return normalized
    }
    
    // If data is an array, convert to Page format
    if (Array.isArray(data)) {
        const normalized = {
            content: data,
            totalElements: data.length,
            totalPages: 1,
            number: 0,
            size: data.length,
            first: true,
            last: true
        }
        
        // Apply item normalizer if provided
        if (itemNormalizer && typeof itemNormalizer === 'function') {
            normalized.content = normalized.content.map(itemNormalizer).filter(Boolean)
            normalized.totalElements = normalized.content.length
        }
        
        return normalized
    }
    
    // Default empty page
    return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 10,
        first: true,
        last: true
    }
}

/**
 * Normalize array response
 * @param {Array|Object} data - Response data
 * @param {Function} itemNormalizer - Function to normalize each item
 * @returns {Array} Normalized array
 */
export const normalizeArrayResponse = (data, itemNormalizer = null) => {
    // If data is already an array
    if (Array.isArray(data)) {
        if (itemNormalizer && typeof itemNormalizer === 'function') {
            return data.map(itemNormalizer).filter(Boolean)
        }
        return data
    }
    
    // If data is a Page object, extract content
    if (data && typeof data === 'object' && 'content' in data) {
        const items = Array.isArray(data.content) ? data.content : []
        if (itemNormalizer && typeof itemNormalizer === 'function') {
            return items.map(itemNormalizer).filter(Boolean)
        }
        return items
    }
    
    // If data has items property
    if (data && typeof data === 'object' && 'items' in data) {
        const items = Array.isArray(data.items) ? data.items : []
        if (itemNormalizer && typeof itemNormalizer === 'function') {
            return items.map(itemNormalizer).filter(Boolean)
        }
        return items
    }
    
    // Default empty array
    return []
}

/**
 * Normalize single item response
 * @param {Object} data - Response data
 * @param {Function} normalizer - Function to normalize the item
 * @returns {Object|null} Normalized item or null
 */
export const normalizeItemResponse = (data, normalizer = null) => {
    if (!data || typeof data !== 'object') {
        return null
    }
    
    if (normalizer && typeof normalizer === 'function') {
        return normalizer(data)
    }
    
    return data
}

