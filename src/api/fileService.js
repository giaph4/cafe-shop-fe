import api from './axios'
import { buildApiError } from './utils/errorHandler'
import { cleanParams } from './utils'

const BASE_URL = '/api/v1/files'

const getFormData = (fieldName, files) => {
    const formData = new FormData()
    if (Array.isArray(files)) {
        files.forEach((file) => {
            formData.append(fieldName, file)
        })
        return formData
    }

    formData.append(fieldName, files)
    return formData
}

const postMultipart = async (url, formData) => {
    const {data} = await api.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    return data
}

export const uploadFile = async (file) => {
    return postMultipart(`${BASE_URL}/upload`, getFormData('file', file))
}

export const uploadMultipleFiles = async (files) => {
    return postMultipart(`${BASE_URL}/upload-multiple`, getFormData('files', files))
}

export const getFile = async (fileName) => {
    const response = await api.get(`${BASE_URL}/${fileName}`, {
        responseType: 'blob'
    })
    return response.data
}

export const deleteFile = async (fileName) => {
    if (!fileName) return
    await api.delete(`${BASE_URL}/${encodeURIComponent(fileName)}`)
}

export const extractFileName = (fileUrl) => {
    if (!fileUrl) return ''
    try {
        const url = new URL(fileUrl)
        return url.pathname.split('/').filter(Boolean).pop() || ''
    } catch (err) {
        return fileUrl.split('?')[0]?.split('/').filter(Boolean).pop() || ''
    }
}

/**
 * Lấy danh sách tất cả files
 * @param {Object} params - Query parameters (page, size, keyword, etc.)
 * @returns {Promise<Array|Object>} Danh sách files hoặc paginated response
 */
export const listFiles = async (params = {}) => {
    const queryParams = cleanParams({
        page: params.page,
        size: params.size,
        keyword: params.keyword?.trim(),
        fileType: params.fileType
    })
    
    const {data} = await api.get(`${BASE_URL}/list`, {params: queryParams})
    return data
}