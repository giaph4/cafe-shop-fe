import api from './axios'
import { buildApiError } from '@/utils/errorHandler'

const BASE_URL = '/api/v1/categories'

const normalizeCategoryPayload = (payload = {}) => {
    const name = typeof payload.name === 'string' ? payload.name.trim() : ''
    const descriptionRaw = typeof payload.description === 'string' ? payload.description.trim() : ''

    return {
        name,
        description: descriptionRaw || null
    }
}

export const getCategories = async () => {
    const {data} = await api.get(BASE_URL)
    return Array.isArray(data) ? data : []
}

export const createCategory = async (payload) => {
    const body = normalizeCategoryPayload(payload)
    const {data} = await api.post(BASE_URL, body)
    return data
}

export const updateCategory = async (id, payload) => {
    const body = normalizeCategoryPayload(payload)
    const {data} = await api.put(`${BASE_URL}/${id}`, body)
    return data
}

export const deleteCategory = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}
