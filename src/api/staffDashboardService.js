import api from './axios'
import { buildApiError } from './utils/errorHandler'
import { cleanParams } from './utils'

export const getStaffDashboard = async (userId, params = {}) => {
    const url = userId ? `/api/staff/dashboard/${userId}` : '/api/staff/dashboard'
    const cleanQuery = cleanParams(params)
    const {data} = await api.get(url, {params: cleanQuery})
    return data
}
