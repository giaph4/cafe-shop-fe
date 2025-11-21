import api from './axios'
import {cleanParams} from './utils'

const BASE_URL = '/api/v1/users'

export const getAllRoles = async () => {
    const {data} = await api.get(`${BASE_URL}/roles`)
    return data
}

export const getUsers = async (params = {}) => {
    const query = cleanParams({page: 0, size: 15, sort: 'username,asc', ...params})
    const {data} = await api.get(BASE_URL, {params: query})
    return data
}

export const getUserById = async (id) => {
    const {data} = await api.get(`${BASE_URL}/${id}`)
    return data
}

export const buildUserUpdatePayload = (payload = {}) => {
    const safeTrim = (value) => (typeof value === 'string' ? value.trim() : value)

    const body = {
        fullName: safeTrim(payload.fullName) || '',
        phone: safeTrim(payload.phone) || '',
        email: safeTrim(payload.email) || null,
        status: payload.status,
        roleIds: Array.isArray(payload.roleIds) ? payload.roleIds : [],
        avatarUrl: safeTrim(payload.avatarUrl) || null,
        address: safeTrim(payload.address) || null,
        removeAvatar: Boolean(payload.removeAvatar)
    }

    if (body.removeAvatar) {
        body.avatarUrl = null
    }

    return body
}

export const updateUser = async (idOrPayload, maybePayload) => {
    const {id, payload} = (() => {
        if (typeof idOrPayload === 'object' && idOrPayload !== null && 'id' in idOrPayload) {
            return {id: idOrPayload.id, payload: idOrPayload.data ?? idOrPayload.payload ?? {}}
        }
        return {id: idOrPayload, payload: maybePayload ?? {}}
    })()

    const body = buildUserUpdatePayload(payload)
    const {data} = await api.put(`${BASE_URL}/${id}`, body)
    return data
}

export const changePassword = async (passwordData) => {
    const {data} = await api.post(`${BASE_URL}/change-password`, passwordData)
    return data
}
