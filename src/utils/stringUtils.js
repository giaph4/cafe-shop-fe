/**
 * String utility functions
 * DRY FIX: Tách string formatting logic ra khỏi components
 * 
 * Usage:
 * import { formatFieldName, getInitials } from '@/utils/stringUtils'
 */

/**
 * Format field name từ camelCase sang readable format
 * DRY FIX: Tách logic formatting ra khỏi useErrorHandler
 * 
 * @param {string} field - Field name (camelCase)
 * @returns {string} - Formatted field name (Readable Format)
 * 
 * @example
 * formatFieldName('firstName') // 'First Name'
 * formatFieldName('userName') // 'User Name'
 */
export const formatFieldName = (field) => {
    if (!field || typeof field !== 'string') return field
    
    return field
        .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim()
}

/**
 * Get initials from name
 * MAINTAINABILITY FIX: Implement logic lấy initials thật sự
 * 
 * @param {string} name - Full name
 * @returns {string} - Initials (tối đa 2 chữ cái đầu của 2 từ đầu tiên)
 * 
 * @example
 * getInitials('Nguyễn Văn A') // 'NV'
 * getInitials('John Doe') // 'JD'
 * getInitials('Single') // 'S'
 */
export const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U'
    
    const words = name
        .trim()
        .split(/\s+/) // Split by whitespace
        .filter(Boolean) // Remove empty strings
    
    if (words.length === 0) return 'U'
    
    if (words.length === 1) {
        // Chỉ có một từ, lấy chữ cái đầu
        return words[0][0]?.toUpperCase() || 'U'
    }
    
    // Có nhiều từ, lấy chữ cái đầu của 2 từ đầu tiên
    return words
        .slice(0, 2) // Lấy 2 từ đầu tiên
        .map(word => word[0]?.toUpperCase() || '') // Lấy chữ cái đầu mỗi từ
        .join('') // Join lại
        .substring(0, 2) // Đảm bảo tối đa 2 ký tự
}

