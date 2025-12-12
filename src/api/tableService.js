import api from './axios'

const BASE_URL = '/api/v1/tables'

export const buildTablePayload = (payload = {}) => {
    const name = typeof payload.name === 'string' ? payload.name.trim() : ''
    const capacity = Number(payload.capacity)

    return {
        name,
        capacity: Number.isFinite(capacity) ? capacity : 0
    }
}

export const getTables = async () => {
    const { data } = await api.get(BASE_URL)
    return data
}

export const getTableById = async (id) => {
    const { data } = await api.get(`${BASE_URL}/${id}`)
    return data
}

export const createTable = async (tableData) => {
    const payload = buildTablePayload(tableData)
    const { data } = await api.post(BASE_URL, payload)
    return data
}

export const updateTable = async ({ id, data: tableData }) => {
    const payload = buildTablePayload(tableData)
    const { data } = await api.put(`${BASE_URL}/${id}`, payload)
    return data
}

export const updateTableStatus = async ({ id, status }) => {
    const { data } = await api.patch(`${BASE_URL}/${id}/status`, { status })
    return data
}

export const deleteTable = async (id) => {
    await api.delete(`${BASE_URL}/${id}`)
}

export const TABLE_STATUS_OPTIONS = [
    { value: 'EMPTY', label: 'Còn trống' },
    { value: 'AVAILABLE', label: 'Sẵn sàng' },
    { value: 'SERVING', label: 'Đang phục vụ' },
    { value: 'RESERVED', label: 'Đã đặt trước' },
    { value: 'PENDING', label: 'Đang chờ' }
]
