import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as stakeholderReportService from '@/api/stakeholderReportService'
import logger from '@/utils/logger'

export const useStakeholderReportStore = defineStore('stakeholderReport', () => {
    const loading = ref(false)
    const error = ref(null)
    const reportData = ref(null)
    const reportConfig = ref({
        startDate: '',
        endDate: '',
        sections: {
            executiveSummary: true,
            financialPerformance: true,
            operationalMetrics: true,
            productPerformance: true,
            customerInsights: true,
            staffPerformance: true,
            trends: true
        },
        format: 'json'
    })

    const hasReport = computed(() => Boolean(reportData.value))

    const generateReport = async (config) => {
        loading.value = true
        error.value = null

        try {
            const data = await stakeholderReportService.generateStakeholderReport(config)
            reportData.value = data
            reportConfig.value = config
            logger.log('[StakeholderReport] Report generated successfully', data.meta)
            return data
        } catch (err) {
            // Use error message from service (already extracted from backend)
            const errorMessage = err.message || 'Không thể tạo báo cáo'
            error.value = errorMessage

            // Show more detailed error if available
            if (err.status === 500) {
                error.value = `Lỗi server: ${  errorMessage  }. Vui lòng kiểm tra backend hoặc thử lại sau.`
            } else if (err.status === 404) {
                error.value = 'API không tìm thấy. Vui lòng kiểm tra endpoint backend.'
            } else if (err.status === 400) {
                error.value = `Dữ liệu không hợp lệ: ${  errorMessage}`
            }

            logger.error('[StakeholderReport] Failed to generate report', {
                message: errorMessage,
                status: err.status,
                error: err
            })
            throw err
        } finally {
            loading.value = false
        }
    }

    const exportToPDF = async () => {
        if (!reportData.value) {
            throw new Error('Chưa có dữ liệu báo cáo để xuất')
        }

        try {
            const blob = await stakeholderReportService.exportReportToPDF(reportData.value)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `stakeholder-report-${reportData.value.reportId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            logger.log('[StakeholderReport] PDF exported successfully')
        } catch (err) {
            logger.error('[StakeholderReport] Failed to export PDF', err)
            throw err
        }
    }

    const exportToExcel = async () => {
        if (!reportData.value) {
            throw new Error('Chưa có dữ liệu báo cáo để xuất')
        }

        try {
            const blob = await stakeholderReportService.exportReportToExcel(reportData.value)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `stakeholder-report-${reportData.value.reportId}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            logger.log('[StakeholderReport] Excel exported successfully')
        } catch (err) {
            logger.error('[StakeholderReport] Failed to export Excel', err)
            throw err
        }
    }

    const scheduleReport = async (schedule) => {
        if (!reportData.value) {
            throw new Error('Chưa có dữ liệu báo cáo để lên lịch')
        }

        try {
            const data = await stakeholderReportService.scheduleReport({
                reportConfig: reportConfig.value,
                schedule
            })
            logger.log('[StakeholderReport] Report scheduled successfully', data)
            return data
        } catch (err) {
            logger.error('[StakeholderReport] Failed to schedule report', err)
            throw err
        }
    }

    const reset = () => {
        reportData.value = null
        error.value = null
        reportConfig.value = {
            startDate: '',
            endDate: '',
            sections: {
                executiveSummary: true,
                financialPerformance: true,
                operationalMetrics: true,
                productPerformance: true,
                customerInsights: true,
                staffPerformance: true,
                trends: true
            },
            format: 'json'
        }
    }

    return {
        loading,
        error,
        reportData,
        reportConfig,
        hasReport,
        generateReport,
        exportToPDF,
        exportToExcel,
        scheduleReport,
        reset
    }
})

