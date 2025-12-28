/**
 * API Helpers
 * Các hàm helper để giảm code duplication trong API services
 * Tái sử dụng code thay vì duplicate để tối ưu performance
 */

/**
 * Tạo FormData với JSON payload và files tùy chọn
 * @param {Object} jsonData - Dữ liệu JSON cần thêm
 * @param {string} jsonFieldName - Tên field cho JSON (mặc định: 'data')
 * @param {File|File[]|null} files - File(s) cần thêm (tùy chọn)
 * @param {string} fileFieldName - Tên field cho file(s) (mặc định: 'file')
 * @returns {FormData} Instance FormData
 */
export const createFormData = (jsonData, jsonFieldName = 'data', files = null, fileFieldName = 'file') => {
    const formData = new FormData()

    // Thêm dữ liệu JSON
    if (jsonData) {
        formData.append(jsonFieldName, new Blob([JSON.stringify(jsonData)], { type: 'application/json' }))
    }

    // Thêm file(s)
    if (files) {
        if (Array.isArray(files)) {
            files.forEach((file) => {
                if (file) {
                    formData.append(fileFieldName, file)
                }
            })
        } else {
            formData.append(fileFieldName, files)
        }
    }

    return formData
}

/**
 * Tạo FormData chỉ với files (không có JSON)
 * @param {File|File[]} files - File(s) cần thêm
 * @param {string} fieldName - Tên field cho file(s) (mặc định: 'file')
 * @returns {FormData} Instance FormData
 */
export const createFileFormData = (files, fieldName = 'file') => {
    const formData = new FormData()

    if (Array.isArray(files)) {
        files.forEach((file) => {
            if (file) {
                formData.append(fieldName, file)
            }
        })
    } else if (files) {
        formData.append(fieldName, files)
    }

    return formData
}

/**
 * Lấy headers cho multipart/form-data
 * @returns {Object} Đối tượng headers
 */
export const getMultipartHeaders = () => ({
    'Content-Type': 'multipart/form-data'
})

/**
 * Làm sạch params, loại bỏ các giá trị undefined, null, hoặc rỗng
 * @param {Object} params - Object chứa params
 * @returns {Object} Object đã được làm sạch
 */
export const cleanParams = (params = {}) => {
    const result = {}
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        result[key] = value
    })
    return result
}

