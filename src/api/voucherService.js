import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './utils'

const BASE_URL = '/api/v1/vouchers'

const normalizeDecimal = (value) => {
    const numeric = Number(value)
    if (Number.isFinite(numeric) && numeric > 0) {
        return Number(numeric.toFixed(2))
    }
    return null
}

const normalizeDateTime = (value) => {
    if (!value) return null
    const str = value instanceof Date ? value.toISOString() : `${value}`.trim()
    if (!str) return null
    if (str.length >= 19) {
        return str.slice(0, 19)
    }
    if (str.length === 16) {
        return `${str}:00`
    }
    return str
}

export const buildVoucherPayload = (payload = {}) => {
    const normalizedCode = payload.code?.toString().trim().toUpperCase() || ''
    const discountValue = normalizeDecimal(payload.discountValue)
    const minimumOrderAmount = normalizeDecimal(payload.minimumOrderAmount)
    const maximumDiscountAmount = normalizeDecimal(payload.maximumDiscountAmount)
    const usageLimit = Number(payload.usageLimit)

    return {
        code: normalizedCode,
        description: payload.description?.toString().trim() || '',
        type: payload.type,
        discountValue,
        minimumOrderAmount,
        maximumDiscountAmount,
        validFrom: normalizeDateTime(payload.validFrom),
        validTo: normalizeDateTime(payload.validTo),
        usageLimit: Number.isFinite(usageLimit) ? usageLimit : null,
        active: typeof payload.active === 'boolean' ? payload.active : true
    }
}

export const searchVouchers = async ({
    page = 0,
    size = 10,
    sort = 'createdAt,desc',
    code = '',
    type = '',
    active = '',
    validFrom = '',
    validTo = ''
} = {}) => {
    const params = {
        page,
        size,
        sort
    }

    if (code) params.code = code
    if (type) params.type = type
    if (active !== '') params.active = active
    if (validFrom) params.validFrom = normalizeDateTime(validFrom)
    if (validTo) params.validTo = normalizeDateTime(validTo)

    const cleanQuery = cleanParams(params)
    const {data} = await api.get(BASE_URL, {params: cleanQuery})
    return data
}

export const getVoucherById = async (id) => {
    const {data} = await api.get(`${BASE_URL}/${id}`)
    return data
}

export const createVoucher = async (voucherData) => {
    const payload = buildVoucherPayload(voucherData)
    const {data} = await api.post(BASE_URL, payload)
    return data
}

export const updateVoucher = async ({id, data: voucherData}) => {
    const payload = buildVoucherPayload(voucherData)
    const {data} = await api.put(`${BASE_URL}/${id}`, payload)
    return data
}

export const toggleVoucher = async (id) => {
    const {data} = await api.patch(`${BASE_URL}/${id}/toggle`)
    return data
}

export const deleteVoucher = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}

export const getVoucherSummary = async () => {
    const {data} = await api.get(`${BASE_URL}/summary`)
    return data
}

export const checkVoucher = async (code, amount) => {
    const {data} = await api.get(`${BASE_URL}/check`, {
        params: {code, amount}
    })
    return data
}

export const VOUCHER_TYPES = Object.freeze([
    {value: 'FIXED_AMOUNT', label: 'Giảm cố định'},
    {value: 'PERCENTAGE', label: 'Giảm %'}
])
