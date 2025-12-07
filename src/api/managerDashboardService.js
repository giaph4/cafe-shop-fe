import api from './axios'
import { cleanParams } from './utils'
import { buildApiError } from '@/utils/errorHandler'

const BASE_URL = '/api/manager/dashboard'

const toNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

const normalizeShiftOverview = (overview) => {
    if (!overview) return null
    return {
        scheduledToday: toNumber(overview.scheduledToday, 0),
        inProgress: toNumber(overview.inProgress, 0),
        completed: toNumber(overview.completed, 0),
        cancelled: toNumber(overview.cancelled, 0),
        upcomingShifts: Array.isArray(overview.upcomingShifts)
            ? overview.upcomingShifts.map(normalizeShiftCard)
            : []
    }
}

const normalizeShiftCard = (card) => ({
    shiftId: card?.shiftId ?? null,
    shiftDate: card?.shiftDate ?? null,
    timeRange: card?.timeRange ?? null,
    status: card?.status ?? null,
    assignedStaff: toNumber(card?.assignedStaff, 0),
    capacity: toNumber(card?.capacity, 0)
})

const normalizeTeamPerformance = (performance) => {
    if (!performance) return null
    return {
        totalRevenue: toNumber(performance.totalRevenue),
        totalOrders: toNumber(performance.totalOrders, 0),
        averageOrderValue: toNumber(performance.averageOrderValue),
        topStaff: Array.isArray(performance.topStaff)
            ? performance.topStaff.map(normalizeStaffLeaderboardItem)
            : []
    }
}

const normalizeStaffLeaderboardItem = (item) => ({
    staffId: item?.staffId ?? null,
    staffName: item?.staffName ?? null,
    orders: toNumber(item?.orders, 0),
    revenue: toNumber(item?.revenue, 0),
    averageOrderValue: toNumber(item?.averageOrderValue, 0)
})

const normalizeInventoryFocus = (inventory) => {
    if (!inventory) return null
    return {
        lowStockItems: toNumber(inventory.lowStockItems, 0),
        criticalStockItems: toNumber(inventory.criticalStockItems, 0),
        alerts: Array.isArray(inventory.alerts) ? inventory.alerts.map(normalizeInventoryAlert) : []
    }
}

const normalizeInventoryAlert = (alert) => ({
    ingredientId: alert?.ingredientId ?? null,
    ingredientName: alert?.ingredientName ?? null,
    quantityOnHand: toNumber(alert?.quantityOnHand, 0),
    reorderLevel: toNumber(alert?.reorderLevel, 0)
})

const normalizePayrollOverview = (payroll) => {
    if (!payroll) return null
    return {
        estimatedPayroll: toNumber(payroll.estimatedPayroll),
        bonusTotal: toNumber(payroll.bonusTotal),
        penaltyTotal: toNumber(payroll.penaltyTotal),
        adjustmentNet: toNumber(payroll.adjustmentNet),
        staffCount: toNumber(payroll.staffCount, 0)
    }
}

const normalizePendingApproval = (approval) => ({
    module: approval?.module ?? null,
    description: approval?.description ?? null,
    requestedBy: approval?.requestedBy ?? null,
    requestedAt: approval?.requestedAt ?? null,
    status: approval?.status ?? null
})

const normalizeAttendanceAlert = (alert) => ({
    assignmentId: alert?.assignmentId ?? null,
    staffId: alert?.staffId ?? null,
    staffName: alert?.staffName ?? null,
    issueType: alert?.issueType ?? null,
    note: alert?.note ?? null
})

const normalizeServiceIssue = (issue) => ({
    orderId: issue?.orderId ?? null,
    tableName: issue?.tableName ?? null,
    issue: issue?.issue ?? null,
    severity: issue?.severity ?? null,
    createdDate: issue?.createdDate ?? null
})

export const getManagerDashboard = async () => {
    const { data } = await api.get(BASE_URL)

    if (!data) return null

    return {
        shiftOverview: normalizeShiftOverview(data.shiftOverview),
        teamPerformance: normalizeTeamPerformance(data.teamPerformance),
        inventory: normalizeInventoryFocus(data.inventory),
        payroll: normalizePayrollOverview(data.payroll),
        pendingApprovals: Array.isArray(data.pendingApprovals)
            ? data.pendingApprovals.map(normalizePendingApproval)
            : [],
        attendanceAlerts: Array.isArray(data.attendanceAlerts)
            ? data.attendanceAlerts.map(normalizeAttendanceAlert)
            : [],
        serviceIssues: Array.isArray(data.serviceIssues)
            ? data.serviceIssues.map(normalizeServiceIssue)
            : []
    }
}

