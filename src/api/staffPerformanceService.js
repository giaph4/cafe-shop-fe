import { buildApiError } from '@/utils/errorHandler'
import * as userService from './userService'
import * as orderService from './orderService'
import * as shiftService from './shiftService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculatePerformanceScore = (metrics) => {
    const weights = {
        revenue: 0.3,
        orders: 0.2,
        attendance: 0.2,
        onTime: 0.15,
        tips: 0.1,
        adjustments: 0.05
    }

    const revenueScore = Math.min(metrics.revenue / (metrics.teamAvgRevenue || 1), 1.5) * 100
    const ordersScore = Math.min(metrics.ordersCount / (metrics.teamAvgOrders || 1), 1.5) * 100
    const attendanceScore = metrics.attendanceRate * 100
    const onTimeScore = metrics.onTimeRate * 100
    const tipsScore = Math.min(metrics.tipsEarned / (metrics.teamAvgTips || 1), 1.5) * 100
    const adjustmentsScore = metrics.bonuses > metrics.penalties ? 100 : 50

    return (
        revenueScore * weights.revenue +
        ordersScore * weights.orders +
        attendanceScore * weights.attendance +
        onTimeScore * weights.onTime +
        tipsScore * weights.tips +
        adjustmentsScore * weights.adjustments
    )
}

export const getStaffPerformance = async ({ startDate, endDate, userId = null } = {}) => {
    try {
        const staffList = await userService.getUsers({ role: 'STAFF', page: 0, size: 1000 })
        const staffArray = Array.isArray(staffList) ? staffList : (staffList?.content || [])

        const filteredStaff = userId
            ? staffArray.filter(s => s.id === userId)
            : staffArray

        const performanceData = await Promise.all(
            filteredStaff.map(async (staff) => {
                const [orders, assignments] = await Promise.all([
                    orderService.getOrdersByDateRange(startDate, endDate, 0, 1000),
                    shiftService.getAssignmentsByUserId(staff.id, { startDate, endDate })
                ])

                const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])
                const staffOrders = ordersList.filter(o => o.staffId === staff.id || o.createdBy === staff.id)

                const totalRevenue = staffOrders.reduce((sum, o) => sum + toNumber(o.totalAmount), 0)
                const ordersCount = staffOrders.length
                const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0

                const assignmentsList = Array.isArray(assignments) ? assignments : (assignments?.content || [])
                const totalShifts = assignmentsList.length
                let attendedShifts = 0
                let onTimeShifts = 0
                let totalTips = 0
                let totalBonuses = 0
                let totalPenalties = 0

                for (const assignment of assignmentsList) {
                    const attendance = await shiftService.getAttendanceByAssignment(assignment.id).catch(() => null)
                    if (attendance && attendance.checkedIn) {
                        attendedShifts++
                        if (attendance.onTime) onTimeShifts++
                    }

                    const adjustments = await shiftService.getAdjustmentsByAssignment(assignment.id).catch(() => [])
                    const adjustmentsList = Array.isArray(adjustments) ? adjustments : []
                    adjustmentsList.forEach(adj => {
                        if (adj.type === 'BONUS') totalBonuses += toNumber(adj.amount)
                        if (adj.type === 'PENALTY') totalPenalties += toNumber(adj.amount)
                    })

                    if (assignment.tips) totalTips += toNumber(assignment.tips)
                }

                const attendanceRate = totalShifts > 0 ? attendedShifts / totalShifts : 0
                const onTimeRate = attendedShifts > 0 ? onTimeShifts / attendedShifts : 0

                return {
                    userId: staff.id,
                    fullName: staff.fullName,
                    username: staff.username,
                    email: staff.email,
                    phone: staff.phone,
                    avatarUrl: staff.avatarUrl,
                    metrics: {
                        revenue: totalRevenue,
                        ordersCount,
                        avgOrderValue,
                        attendanceRate,
                        onTimeRate,
                        tipsEarned: totalTips,
                        bonuses: totalBonuses,
                        penalties: totalPenalties,
                        totalShifts,
                        attendedShifts,
                        onTimeShifts
                    },
                    orders: staffOrders.slice(0, 10),
                    assignments: assignmentsList
                }
            })
        )

        const teamMetrics = {
            avgRevenue: performanceData.reduce((sum, p) => sum + p.metrics.revenue, 0) / performanceData.length || 0,
            avgOrders: performanceData.reduce((sum, p) => sum + p.metrics.ordersCount, 0) / performanceData.length || 0,
            avgTips: performanceData.reduce((sum, p) => sum + p.metrics.tipsEarned, 0) / performanceData.length || 0
        }

        const enrichedData = performanceData.map(staff => ({
            ...staff,
            metrics: {
                ...staff.metrics,
                teamAvgRevenue: teamMetrics.avgRevenue,
                teamAvgOrders: teamMetrics.avgOrders,
                teamAvgTips: teamMetrics.avgTips,
                performanceScore: calculatePerformanceScore({
                    ...staff.metrics,
                    teamAvgRevenue: teamMetrics.avgRevenue,
                    teamAvgOrders: teamMetrics.avgOrders,
                    teamAvgTips: teamMetrics.avgTips
                })
            }
        }))

        return {
            staff: enrichedData.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore),
            teamMetrics,
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getPerformanceTrends = async ({ userId, startDate, endDate, period = 'week' } = {}) => {
    try {
        const trends = []
        const start = new Date(startDate)
        const end = new Date(endDate)

        for (
            let cursor = new Date(start.getTime());
            cursor <= end;
            cursor = new Date(cursor.getTime() + (period === 'week' ? 7 : period === 'month' ? 30 : period) * 24 * 60 * 60 * 1000)
        ) {
            const periodEnd = new Date(cursor)
            if (period === 'week') {
                periodEnd.setDate(periodEnd.getDate() + 6)
            } else if (period === 'month') {
                periodEnd.setMonth(periodEnd.getMonth() + 1)
                periodEnd.setDate(0)
            } else {
                periodEnd.setDate(periodEnd.getDate() + period - 1)
            }

            if (periodEnd > end) periodEnd.setTime(end.getTime())

            const performance = await getStaffPerformance({
                startDate: cursor.toISOString().split('T')[0],
                endDate: periodEnd.toISOString().split('T')[0],
                userId
            })

            const staffData = performance.staff[0]
            if (staffData) {
                trends.push({
                    period: cursor.toISOString().split('T')[0],
                    revenue: staffData.metrics.revenue,
                    ordersCount: staffData.metrics.ordersCount,
                    performanceScore: staffData.metrics.performanceScore,
                    attendanceRate: staffData.metrics.attendanceRate
                })
            }
        }

        return trends
    } catch (error) {
        throw buildApiError(error)
    }
}

export const getStaffComparison = async ({ userIds, startDate, endDate } = {}) => {
    try {
        const performance = await getStaffPerformance({ startDate, endDate })
        const comparedStaff = performance.staff.filter(s => userIds.includes(s.userId))

        return {
            staff: comparedStaff,
            teamMetrics: performance.teamMetrics,
            period: { startDate, endDate }
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

export const exportPerformanceReport = (performanceData) => {
    const data = [
        ['BÁO CÁO HIỆU SUẤT NHÂN VIÊN'],
        ['Thời gian:', `${performanceData.period.startDate} - ${performanceData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['Họ tên', 'Doanh thu', 'Số đơn', 'Đơn TB', 'Điểm chuyên cần', 'Đúng giờ', 'Tips', 'Thưởng', 'Phạt', 'Điểm tổng']
    ]

    performanceData.staff.forEach(staff => {
        data.push([
            staff.fullName,
            staff.metrics.revenue.toLocaleString('vi-VN'),
            staff.metrics.ordersCount,
            staff.metrics.avgOrderValue.toLocaleString('vi-VN'),
            `${(staff.metrics.attendanceRate * 100).toFixed(1)}%`,
            `${(staff.metrics.onTimeRate * 100).toFixed(1)}%`,
            staff.metrics.tipsEarned.toLocaleString('vi-VN'),
            staff.metrics.bonuses.toLocaleString('vi-VN'),
            staff.metrics.penalties.toLocaleString('vi-VN'),
            staff.metrics.performanceScore.toFixed(1)
        ])
    })

    return {
        data,
        sheetName: 'Hiệu suất nhân viên',
        filename: `hieu-suat-nhan-vien-${performanceData.period.startDate}-${performanceData.period.endDate}.xlsx`
    }
}

