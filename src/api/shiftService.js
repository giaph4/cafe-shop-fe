import api from './axios'
import {cleanParams} from './utils'

const BASE_URL = '/api/v1/shifts'

export const SHIFT_STATUSES = [
    {value: 'PLANNED', label: 'Lên kế hoạch'},
    {value: 'LOCKED', label: 'Đã khóa'},
    {value: 'IN_PROGRESS', label: 'Đang diễn ra'},
    {value: 'DONE', label: 'Hoàn thành'},
    {value: 'CANCELLED', label: 'Đã hủy'}
]

export const ASSIGNMENT_STATUSES = [
    {value: 'SCHEDULED', label: 'Đã xếp'},
    {value: 'CONFIRMED', label: 'Đã xác nhận'},
    {value: 'IN_PROGRESS', label: 'Đang làm'},
    {value: 'COMPLETED', label: 'Hoàn thành'},
    {value: 'CANCELLED', label: 'Đã hủy'}
]

export const ADJUSTMENT_TYPES = [
    {value: 'BONUS', label: 'Thưởng'},
    {value: 'PENALTY', label: 'Phạt'}
]

export const ATTENDANCE_SOURCES = [
    {value: 'QR', label: 'QR'},
    {value: 'APP', label: 'Ứng dụng'},
    {value: 'WEB', label: 'Web'},
    {value: 'MANUAL', label: 'Thủ công'}
]

// --- Shift templates ---
export const getShiftTemplates = async (params = {}) => {
    const {data} = await api.get(`${BASE_URL}/templates`, {params: cleanParams(params)})
    return data
}

export const getShiftTemplate = async (id) => {
    const {data} = await api.get(`${BASE_URL}/templates/${id}`)
    return data
}

export const createShiftTemplate = async (payload) => {
    const {data} = await api.post(`${BASE_URL}/templates`, payload)
    return data
}

export const updateShiftTemplate = async (id, payload) => {
    const {data} = await api.put(`${BASE_URL}/templates/${id}`, payload)
    return data
}

export const deleteShiftTemplate = async (id) => {
    await api.delete(`${BASE_URL}/templates/${id}`)
}

// --- Shift instances ---
export const listShiftInstances = async (filters = {}) => {
    const params = cleanParams(filters)
    const {data} = await api.get(`${BASE_URL}/instances`, {params})
    return data
}

export const getShiftInstance = async (id) => {
    const {data} = await api.get(`${BASE_URL}/instances/${id}`)
    return data
}

export const createShiftInstances = async (payload) => {
    const {data} = await api.post(`${BASE_URL}/instances`, payload)
    return data
}

export const updateShiftInstance = async (id, payload) => {
    const {data} = await api.put(`${BASE_URL}/instances/${id}`, payload)
    return data
}

export const updateShiftInstanceStatus = async (id, payload) => {
    const {data} = await api.patch(`${BASE_URL}/instances/${id}/status`, payload)
    return data
}

export const deleteShiftInstance = async (id) => {
    await api.delete(`${BASE_URL}/instances/${id}`)
}

// --- Shift assignments ---
export const getAssignmentsForCurrentUser = async () => {
    const {data} = await api.get(`${BASE_URL}/assignments/me`)
    return data
}

export const getAssignmentsForShift = async (shiftId) => {
    const {data} = await api.get(`${BASE_URL}/assignments/shift/${shiftId}`)
    return data
}

export const createShiftAssignment = async (payload) => {
    const {data} = await api.post(`${BASE_URL}/assignments`, payload)
    return data
}

export const updateShiftAssignment = async (assignmentId, payload) => {
    const body = {
        assignmentId,
        ...payload
    }
    const {data} = await api.put(`${BASE_URL}/assignments/${assignmentId}`, body)
    return data
}

export const updateShiftAssignmentStatus = async (assignmentId, payload) => {
    const {data} = await api.patch(`${BASE_URL}/assignments/${assignmentId}/status`, payload)
    return data
}

export const deleteShiftAssignment = async (assignmentId) => {
    await api.delete(`${BASE_URL}/assignments/${assignmentId}`)
}

// --- Payroll cycles ---
export const listPayrollCycles = async (params = {}) => {
    const query = cleanParams(params)
    const {data} = await api.get(`${BASE_URL}/payroll/cycles`, {params: query})
    return Array.isArray(data) ? data : []
}

export const getPayrollCycle = async (cycleId) => {
    const {data} = await api.get(`${BASE_URL}/payroll/cycles/${cycleId}`)
    return data
}

export const createPayrollCycle = async (payload) => {
    const body = normalizePayrollCyclePayload(payload)
    const {data} = await api.post(`${BASE_URL}/payroll/cycles`, body)
    return data
}

export const updatePayrollCycle = async (cycleId, payload) => {
    const body = normalizePayrollCyclePayload(payload)
    const {data} = await api.put(`${BASE_URL}/payroll/cycles/${cycleId}`, body)
    return data
}

export const regeneratePayrollSummaries = async (cycleId) => {
    const {data} = await api.post(`${BASE_URL}/payroll/cycles/${cycleId}/regenerate`)
    return Array.isArray(data) ? data : []
}

export const listPayrollSummaries = async (params = {}) => {
    const query = cleanParams(params)
    const {data} = await api.get(`${BASE_URL}/payroll/summaries`, {params: query})
    return Array.isArray(data) ? data : []
}

const normalizePayrollCyclePayload = (payload = {}) => ({
    code: typeof payload.code === 'string' ? payload.code.trim() : '',
    name: payload.name?.trim() || null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: payload.status || null,
    notes: payload.notes?.trim() || null
})

// --- Performance adjustments ---
export const getAdjustmentsByAssignment = async (assignmentId) => {
    const {data} = await api.get(`${BASE_URL}/adjustments/assignment/${assignmentId}`)
    return data
}

export const createAdjustment = async (payload) => {
    const {data} = await api.post(`${BASE_URL}/adjustments`, payload)
    return data
}

export const revokeAdjustment = async (adjustmentId, payload) => {
    const {data} = await api.post(`${BASE_URL}/adjustments/${adjustmentId}/revoke`, payload)
    return data
}

export const deleteAdjustment = async (adjustmentId) => {
    await api.delete(`${BASE_URL}/adjustments/${adjustmentId}`)
}

// --- Attendance ---
export const getAttendanceByAssignment = async (assignmentId) => {
    const {data} = await api.get(`/api/v1/attendance/assignment/${assignmentId}`)
    return data
}

export const getAttendanceByShift = async (shiftId) => {
    const {data} = await api.get(`/api/v1/attendance/shift/${shiftId}`)
    return data
}

export const checkInAttendance = async (payload) => {
    const {data} = await api.post('/api/v1/attendance/check-in', payload)
    return data
}

export const checkOutAttendance = async (payload) => {
    const {data} = await api.post('/api/v1/attendance/check-out', payload)
    return data
}
