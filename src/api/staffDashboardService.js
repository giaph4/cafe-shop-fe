import api from './axios'

export const getStaffDashboard = async (userId, params = {}) => {
    const url = userId ? `/api/staff/dashboard/${userId}` : '/api/staff/dashboard'
    const {data} = await api.get(url, {params})
    return data
}
