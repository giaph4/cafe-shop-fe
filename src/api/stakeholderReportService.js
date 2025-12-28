import api from './axios'
import { cleanParams } from './helpers'
import logger from '@/utils/logger'

const BASE_URL = '/api/stakeholder/reports'

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

const normalizeFinancialData = (data) => {
    if (!data) return null
    return {
        revenue: toNumber(data.revenue),
        profit: toNumber(data.profit),
        expenses: toNumber(data.expenses),
        profitMargin: toNumber(data.profitMargin, 0),
        growthRate: toNumber(data.growthRate, 0)
    }
}

const normalizeOperationalMetrics = (data) => {
    if (!data) return null
    return {
        totalOrders: toNumber(data.totalOrders, 0),
        averageOrderValue: toNumber(data.averageOrderValue),
        totalCustomers: toNumber(data.totalCustomers, 0),
        newCustomers: toNumber(data.newCustomers, 0),
        repeatCustomers: toNumber(data.repeatCustomers, 0),
        cancellationRate: toNumber(data.cancellationRate, 0)
    }
}

const normalizeProductPerformance = (products) => {
    if (!Array.isArray(products)) return []
    return products.map(item => ({
        productId: item.productId || item.id,
        productName: item.productName || item.name,
        quantity: toNumber(item.quantity, 0),
        revenue: toNumber(item.revenue),
        profit: toNumber(item.profit),
        profitMargin: toNumber(item.profitMargin, 0)
    }))
}

const normalizeCustomerInsights = (customers) => {
    if (!Array.isArray(customers)) return []
    return customers.map(item => ({
        customerId: item.customerId || item.id,
        customerName: item.customerName || item.name,
        totalOrders: toNumber(item.totalOrders, 0),
        totalSpent: toNumber(item.totalSpent),
        averageOrderValue: toNumber(item.averageOrderValue),
        lastOrderDate: item.lastOrderDate
    }))
}

const normalizeStaffPerformance = (staff) => {
    if (!Array.isArray(staff)) return []
    return staff.map(item => ({
        staffId: item.staffId || item.id,
        staffName: item.staffName || item.name,
        totalOrders: toNumber(item.totalOrders, 0),
        totalRevenue: toNumber(item.totalRevenue),
        averageOrderValue: toNumber(item.averageOrderValue),
        efficiency: toNumber(item.efficiency, 0)
    }))
}

export const generateStakeholderReport = async ({
    startDate,
    endDate,
    sections = {
        executiveSummary: true,
        financialPerformance: true,
        operationalMetrics: true,
        productPerformance: true,
        customerInsights: true,
        staffPerformance: true,
        trends: true
    },
    format = 'json'
}) => {
    try {
        // Try sending as request body (POST typically uses body)
        const requestBody = {
            startDate,
            endDate,
            sections,
            format
        }

        logger.log('[StakeholderReport] Generating report with:', { startDate, endDate, sections, format })

        const { data } = await api.post(`${BASE_URL}/generate`, requestBody)

        if (!data) {
            throw new Error('Không nhận được dữ liệu từ server')
        }

        return {
            reportId: data.reportId || `report-${Date.now()}`,
            generatedAt: data.generatedAt || new Date().toISOString(),
            period: {
                startDate: data.period?.startDate || startDate,
                endDate: data.period?.endDate || endDate
            },
            executiveSummary: data.executiveSummary || null,
            financialPerformance: normalizeFinancialData(data.financialPerformance),
            operationalMetrics: normalizeOperationalMetrics(data.operationalMetrics),
            productPerformance: normalizeProductPerformance(data.productPerformance || []),
            customerInsights: normalizeCustomerInsights(data.customerInsights || []),
            staffPerformance: normalizeStaffPerformance(data.staffPerformance || []),
            trends: data.trends || null,
            meta: {
                generatedAt: new Date().toISOString(),
                sections,
                format
            }
        }
    } catch (err) {
        // Extract error message from backend if available
        const errorMessage = err.response?.data?.message ||
                           err.response?.data?.error ||
                           err.message ||
                           'Không thể tạo báo cáo. Vui lòng kiểm tra lại thông tin và thử lại.'

        logger.error('[StakeholderReport] Failed to generate report', {
            message: errorMessage,
            status: err.response?.status,
            data: err.response?.data,
            request: { startDate, endDate, sections, format }
        })

        const error = new Error(errorMessage)
        error.status = err.response?.status
        error.response = err.response
        throw error
    }
}

export const exportReportToPDF = async (reportData) => {
    try {
        const { data } = await api.post(`${BASE_URL}/export/pdf`, reportData, {
            responseType: 'blob'
        })
        return data
    } catch (err) {
        logger.error('[StakeholderReport] Failed to export PDF', err)
        throw err
    }
}

export const exportReportToExcel = async (reportData) => {
    try {
        const { data } = await api.post(`${BASE_URL}/export/excel`, reportData, {
            responseType: 'blob'
        })
        return data
    } catch (err) {
        logger.error('[StakeholderReport] Failed to export Excel', err)
        throw err
    }
}

export const scheduleReport = async ({ reportConfig, schedule }) => {
    try {
        const params = cleanParams({
            reportConfig: JSON.stringify(reportConfig),
            schedule: JSON.stringify(schedule)
        })
        const { data } = await api.post(`${BASE_URL}/schedule`, params)
        return data
    } catch (err) {
        logger.error('[StakeholderReport] Failed to schedule report', err)
        throw err
    }
}

