import api from '@/api/axios'
import { cleanParams } from '@/api/utils'

const BASE_URL = '/api/v1/shifts/sessions'

const SESSION_EVENTS = Object.freeze({
    STARTED: 'SESSION_STARTED',
    ENDED: 'SESSION_ENDED',
    FORCED: 'SESSION_FORCED'
})

const toNumberOrNull = (value) => {
    if (value === null || value === undefined) return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

const toBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value
    if (value === null || value === undefined) return fallback
    return Boolean(value)
}

const toNullableString = (value) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
}

export const normalizeShiftSession = (payload) => {
    if (!payload || typeof payload !== 'object') return null

    return {
        id: toNumberOrNull(payload.id),
        workShiftId: toNumberOrNull(payload.workShiftId),
        userId: toNumberOrNull(payload.userId),
        username: toNullableString(payload.username),
        fullName: toNullableString(payload.fullName),
        startAt: toNullableString(payload.startAt),
        endAt: toNullableString(payload.endAt),
        status: typeof payload.status === 'string' ? payload.status.toUpperCase() : null,
        adminOverride: toBoolean(payload.adminOverride, false),
        forceReason: toNullableString(payload.forceReason),
        forceByUserId: toNumberOrNull(payload.forceByUserId),
        createdAt: toNullableString(payload.createdAt),
        updatedAt: toNullableString(payload.updatedAt)
    }
}

export const normalizeShiftSessionList = (items) => Array.isArray(items)
    ? items.map(normalizeShiftSession).filter(Boolean)
    : []

const buildError = (error) => {
    const { response } = error || {}
    const status = response?.status
    const data = response?.data || {}
    return {
        status,
        code: data.code || null,
        message: data.message || error?.message || 'Đã xảy ra lỗi không xác định.',
        details: data.details || null
    }
}

export const listShiftSessions = async (filters = {}) => {
    try {
        const params = cleanParams(filters)
        const { data } = await api.get(BASE_URL, { params })
        if (Array.isArray(data)) {
            return normalizeShiftSessionList(data)
        }
        if (data && Array.isArray(data.items)) {
            return {
                ...data,
                items: normalizeShiftSessionList(data.items)
            }
        }
        return normalizeShiftSessionList(data?.content)
    } catch (error) {
        throw buildError(error)
    }
}

export const getShiftSession = async (sessionId) => {
    try {
        const { data } = await api.get(`${BASE_URL}/${sessionId}`)
        return normalizeShiftSession(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const getCurrentShiftSession = async () => {
    try {
        const { data } = await api.get(`${BASE_URL}/current`)
        return normalizeShiftSession(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const listActiveSessionsByWorkShift = async (workShiftId) => {
    try {
        const { data } = await api.get(`${BASE_URL}/work-shifts/${workShiftId}/active`)
        return normalizeShiftSessionList(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const startShiftSession = async ({ workShiftId, adminOverride = false } = {}) => {
    try {
        const body = {
            workShiftId,
            adminOverride
        }
        const { data } = await api.post(`${BASE_URL}/start`, body)
        return normalizeShiftSession(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const endCurrentShiftSession = async () => {
    try {
        const { data } = await api.post(`${BASE_URL}/end`)
        return normalizeShiftSession(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const forceEndShiftSession = async (sessionId, reason) => {
    try {
        const payload = { reason }
        const { data } = await api.post(`${BASE_URL}/${sessionId}/force`, payload)
        return normalizeShiftSession(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const shiftSessionEvents = SESSION_EVENTS
