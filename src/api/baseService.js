/**
 * Base Service Pattern
 * Base class/pattern cho tất cả API services
 */

import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './helpers'

/**
 * Base service class với các methods chung
 */
export class BaseService {
    constructor (baseUrl) {
        this.baseUrl = baseUrl
    }

    /**
     * Tạo URL đầy đủ
     * @param {string} path - Đường dẫn cần thêm
     * @returns {string} URL đầy đủ
     */
    buildUrl (path = '') {
        if (!path) return this.baseUrl
        return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    }

    /**
     * Xử lý lỗi API
     * @param {Error} error - Đối tượng lỗi
     * @throws {Object} Đối tượng lỗi đã chuẩn hóa
     */
    handleError (error) {
        throw buildApiError(error)
    }

    /**
     * GET request
     * @param {string} path - Đường dẫn cần thêm
     * @param {Object} params - Tham số query
     * @returns {Promise} Dữ liệu response
     */
    async get (path = '', params = {}) {
        try {
            const url = this.buildUrl(path)
            const cleanQuery = cleanParams(params)
            const { data } = await api.get(url, { params: cleanQuery })
            return data
        } catch (error) {
            this.handleError(error)
            return null
        }
    }

    /**
     * POST request
     * @param {string} path - Đường dẫn cần thêm
     * @param {Object} body - Body của request
     * @returns {Promise} Dữ liệu response
     */
    async post (path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.post(url, body)
            return data
        } catch (error) {
            this.handleError(error)
            return null
        }
    }

    /**
     * PUT request
     * @param {string} path - Đường dẫn cần thêm
     * @param {Object} body - Body của request
     * @returns {Promise} Dữ liệu response
     */
    async put (path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.put(url, body)
            return data
        } catch (error) {
            this.handleError(error)
            return null
        }
    }

    /**
     * PATCH request
     * @param {string} path - Đường dẫn cần thêm
     * @param {Object} body - Body của request
     * @returns {Promise} Dữ liệu response
     */
    async patch (path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.patch(url, body)
            return data
        } catch (error) {
            this.handleError(error)
            return null
        }
    }

    /**
     * DELETE request
     * @param {string} path - Đường dẫn cần thêm
     * @returns {Promise} Dữ liệu response
     */
    async delete (path = '') {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.delete(url)
            return data
        } catch (error) {
            this.handleError(error)
            return null
        }
    }
}

/**
 * Helper tạo service instance
 * @param {string} baseUrl - Base URL cho service
 * @returns {BaseService} Instance của service
 */
export const createService = (baseUrl) => new BaseService(baseUrl)

