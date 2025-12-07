/**
 * Base Service Pattern
 * Base class/pattern cho tất cả API services
 */

import api from './axios'
import { buildApiError } from '@/utils/errorHandler'
import { cleanParams } from './utils'

/**
 * Base service class với common methods
 */
export class BaseService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
    }

    /**
     * Build full URL
     * @param {string} path - Path to append
     * @returns {string} Full URL
     */
    buildUrl(path = '') {
        if (!path) return this.baseUrl
        return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    }

    /**
     * Handle API error
     * @param {Error} error - Error object
     * @throws {Object} Standardized error object
     */
    handleError(error) {
        throw buildApiError(error)
    }

    /**
     * GET request
     * @param {string} path - Path to append
     * @param {Object} params - Query parameters
     * @returns {Promise} Response data
     */
    async get(path = '', params = {}) {
        try {
            const url = this.buildUrl(path)
            const cleanQuery = cleanParams(params)
            const { data } = await api.get(url, { params: cleanQuery })
            return data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * POST request
     * @param {string} path - Path to append
     * @param {Object} body - Request body
     * @returns {Promise} Response data
     */
    async post(path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.post(url, body)
            return data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * PUT request
     * @param {string} path - Path to append
     * @param {Object} body - Request body
     * @returns {Promise} Response data
     */
    async put(path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.put(url, body)
            return data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * PATCH request
     * @param {string} path - Path to append
     * @param {Object} body - Request body
     * @returns {Promise} Response data
     */
    async patch(path = '', body = {}) {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.patch(url, body)
            return data
        } catch (error) {
            this.handleError(error)
        }
    }

    /**
     * DELETE request
     * @param {string} path - Path to append
     * @returns {Promise} Response data
     */
    async delete(path = '') {
        try {
            const url = this.buildUrl(path)
            const { data } = await api.delete(url)
            return data
        } catch (error) {
            this.handleError(error)
        }
    }
}

/**
 * Create service instance helper
 * @param {string} baseUrl - Base URL for the service
 * @returns {BaseService} Service instance
 */
export const createService = (baseUrl) => {
    return new BaseService(baseUrl)
}

