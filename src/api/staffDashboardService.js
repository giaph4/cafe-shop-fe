import api from './axios'
import { cleanParams } from './helpers'

export const getStaffDashboard = async (userId, params = {}) => {
    const url = userId ? `/api/staff/dashboard/${userId}` : '/api/staff/dashboard'
    const cleanQuery = cleanParams(params)
    const { data } = await api.get(url, { params: cleanQuery })
    return data
}
