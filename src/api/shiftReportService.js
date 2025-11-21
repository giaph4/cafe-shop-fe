import api from './axios'
import { cleanParams } from './utils'

const BASE_URL = '/api/v1/shifts/reports'

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

const toInteger = (value, fallback = null) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePaymentBreakdown = (items) => {
    if (!Array.isArray(items)) return []
    return items.map((item) => ({
        paymentMethod: typeof item?.paymentMethod === 'string' ? item.paymentMethod : 'UNKNOWN',
        orderCount: toInteger(item?.orderCount, 0),
        totalAmount: toNumber(item?.totalAmount, 0)
    }))
}

const normalizeTopProducts = (items) => {
    if (!Array.isArray(items)) return []
    return items.map((item) => ({
        productId: toInteger(item?.productId),
        productName: typeof item?.productName === 'string' ? item.productName : 'Chưa rõ',
        quantity: toInteger(item?.quantity, 0),
        totalAmount: toNumber(item?.totalAmount, 0)
    }))
}

export const normalizeShiftReport = (payload) => {
    if (!payload || typeof payload !== 'object') return null
    return {
        reportId: toInteger(payload.reportId),
        sessionId: toInteger(payload.sessionId),
        workShiftId: toInteger(payload.workShiftId),
        userId: toInteger(payload.userId),
        username: typeof payload.username === 'string' ? payload.username : null,
        status: typeof payload.status === 'string' ? payload.status : null,
        startAt: payload.startAt ?? null,
        endAt: payload.endAt ?? null,
        totalOrders: toInteger(payload.totalOrders, 0),
        totalPaidAmount: toNumber(payload.totalPaidAmount, 0),
        totalUnpaidAmount: toNumber(payload.totalUnpaidAmount, 0),
        transferredOrders: toInteger(payload.transferredOrders, 0),
        paymentBreakdown: normalizePaymentBreakdown(payload.paymentBreakdown),
        topProducts: normalizeTopProducts(payload.topProducts),
        generatedAt: payload.generatedAt ?? null,
        meta: payload.meta ?? null
    }
}

const buildError = (error) => {
    const status = error?.response?.status
    const { code, message, details } = error?.response?.data || {}
    return {
        status,
        code,
        message: message || error?.message || 'Đã xảy ra lỗi không xác định.',
        details: details || null
    }
}

export const getShiftReport = async (sessionId, { refresh = false } = {}) => {
    try {
        const params = cleanParams({ refresh })
        const { data } = await api.get(`${BASE_URL}/sessions/${sessionId}`, { params })
        return normalizeShiftReport(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const regenerateShiftReport = async (sessionId) => {
    try {
        const { data } = await api.post(`${BASE_URL}/sessions/${sessionId}/regenerate`)
        return normalizeShiftReport(data)
    } catch (error) {
        throw buildError(error)
    }
}

export const listShiftReportsByWorkShift = async (workShiftId) => {
    try {
        const { data } = await api.get(`${BASE_URL}/work-shifts/${workShiftId}`)
        if (!Array.isArray(data)) {
            return []
        }
        return data.map(normalizeShiftReport).filter(Boolean)
    } catch (error) {
        throw buildError(error)
    }
}
