/**
 * === SECTION: API HELPERS ===
 * Helper functions để giảm code duplication trong API services
 * PERFORMANCE FIX: Tái sử dụng code thay vì duplicate
 */

/**
 * Create FormData với JSON payload và optional files
 * @param {Object} jsonData - JSON data to append
 * @param {string} jsonFieldName - Field name for JSON (default: 'data')
 * @param {File|File[]|null} files - File(s) to append (optional)
 * @param {string} fileFieldName - Field name for file(s) (default: 'file')
 * @returns {FormData} FormData instance
 */
export const createFormData = (jsonData, jsonFieldName = 'data', files = null, fileFieldName = 'file') => {
    const formData = new FormData()

    // Append JSON data
    if (jsonData) {
        formData.append(jsonFieldName, new Blob([JSON.stringify(jsonData)], { type: 'application/json' }))
    }

    // Append file(s)
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
 * Create FormData chỉ với files (không có JSON)
 * @param {File|File[]} files - File(s) to append
 * @param {string} fieldName - Field name for file(s) (default: 'file')
 * @returns {FormData} FormData instance
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
 * Get multipart/form-data headers
 * @returns {Object} Headers object
 */
export const getMultipartHeaders = () => ({
    'Content-Type': 'multipart/form-data'
})

