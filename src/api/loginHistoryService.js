import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from '@/utils/errorHandler'

export const getLoginHistory = async (params = {}) => {
    const query = cleanParams(params)
    const {data} = await api.get('/api/v1/login-history', {params: query})
    return data
}
