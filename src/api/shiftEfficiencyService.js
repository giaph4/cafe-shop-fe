import { buildApiError } from '@/utils/errorHandler'
import logger from '@/utils/logger'
import * as shiftService from './shiftService'
import * as orderService from './orderService'

const toNumber = (value) => {
    if (value === null || value === undefined) return 0
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isNaN(parsed) ? 0 : parsed
}

const calculateEfficiencyScore = (revenue, staffCount, ordersCount, targetRevenuePerStaff = 500000, targetOrdersPerStaff = 20) => {
    if (staffCount === 0) return 0

    const revenuePerStaff = revenue / staffCount
    const ordersPerStaff = ordersCount / staffCount

    const revenueScore = Math.min(revenuePerStaff / targetRevenuePerStaff, 1.5) * 50
    const ordersScore = Math.min(ordersPerStaff / targetOrdersPerStaff, 1.5) * 50

    return Math.min(100, revenueScore + ordersScore)
}

export const analyzeShiftEfficiency = async ({ startDate, endDate } = {}) => {
    try {
        const [shiftInstances, orders] = await Promise.all([
            shiftService.listShiftInstances({ startDate, endDate }),
            orderService.getOrdersByDateRange(startDate, endDate, 0, 1000)
        ])

        const shiftsList = Array.isArray(shiftInstances) ? shiftInstances : (shiftInstances?.content || [])
        const ordersList = Array.isArray(orders) ? orders : (orders?.content || [])

        const shiftAnalysisResults = await Promise.all(
            shiftsList.map(async (shift) => {
                try {
                    if (!shift.startTime || !shift.endTime) {
                        return null
                    }

                    const startTime = new Date(shift.startTime)
                    const endTime = new Date(shift.endTime)

                    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                        return null
                    }

                    const assignments = await shiftService.getAssignmentsForShift(shift.id).catch(() => [])
                    const assignmentsList = Array.isArray(assignments) ? assignments : (assignments?.content || [])
                    const staffCount = assignmentsList.length

                    const shiftOrders = ordersList.filter(o => {
                        if (o.shiftSessionId === shift.id) return true
                        if (!o.createdAt) return false
                        const orderDate = new Date(o.createdAt)
                        return !isNaN(orderDate.getTime()) && orderDate >= startTime && orderDate <= endTime
                    })

                    const revenue = shiftOrders.reduce((sum, o) => sum + toNumber(o.totalAmount), 0)
                    const ordersCount = shiftOrders.length
                    const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0

                    const efficiencyScore = calculateEfficiencyScore(revenue, staffCount, ordersCount)
                    const duration = (endTime - startTime) / (1000 * 60 * 60)

                    return {
                        shiftId: shift.id,
                        shiftName: shift.name || `Ca ${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
                        date: startTime.toISOString().split('T')[0],
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        duration,
                        staffCount,
                        revenue,
                        ordersCount,
                        avgOrderValue,
                        efficiencyScore,
                        revenuePerStaff: staffCount > 0 ? revenue / staffCount : 0,
                        ordersPerStaff: staffCount > 0 ? ordersCount / staffCount : 0,
                        status: shift.status,
                        assignments: assignmentsList
                    }
                } catch (error) {
                    logger.warn('[ShiftEfficiency] Bỏ qua ca làm việc không hợp lệ:', shift.id, error)
                    return null
                }
            })
        )

        const shiftAnalysis = shiftAnalysisResults.filter(s => s !== null)

        const hourlyAnalysis = {}
        shiftAnalysis.forEach(shift => {
            const hour = new Date(shift.startTime).getHours()
            if (!hourlyAnalysis[hour]) {
                hourlyAnalysis[hour] = {
                    hour,
                    shifts: [],
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalStaff: 0,
                    avgEfficiency: 0
                }
            }
            hourlyAnalysis[hour].shifts.push(shift)
            hourlyAnalysis[hour].totalRevenue += shift.revenue
            hourlyAnalysis[hour].totalOrders += shift.ordersCount
            hourlyAnalysis[hour].totalStaff += shift.staffCount
        })

        Object.keys(hourlyAnalysis).forEach(hour => {
            const data = hourlyAnalysis[hour]
            data.avgEfficiency = data.shifts.length > 0
                ? data.shifts.reduce((sum, s) => sum + s.efficiencyScore, 0) / data.shifts.length
                : 0
        })

        const avgEfficiency = shiftAnalysis.length > 0
            ? shiftAnalysis.reduce((sum, s) => sum + s.efficiencyScore, 0) / shiftAnalysis.length
            : 0

        const topShifts = shiftAnalysis
            .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
            .slice(0, 5)

        const lowEfficiencyShifts = shiftAnalysis
            .filter(s => s.efficiencyScore < 60)
            .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
            .slice(0, 5)

        const recommendations = generateRecommendations(shiftAnalysis, hourlyAnalysis)

        return {
            shifts: shiftAnalysis.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
            hourlyAnalysis: Object.values(hourlyAnalysis).sort((a, b) => a.hour - b.hour),
            topShifts,
            lowEfficiencyShifts,
            recommendations,
            summary: {
                totalShifts: shiftAnalysis.length,
                avgEfficiency,
                totalRevenue: shiftAnalysis.reduce((sum, s) => sum + s.revenue, 0),
                totalOrders: shiftAnalysis.reduce((sum, s) => sum + s.ordersCount, 0),
                totalStaffHours: shiftAnalysis.reduce((sum, s) => sum + (s.staffCount * s.duration), 0)
            },
            period: { startDate, endDate },
            generatedAt: new Date().toISOString()
        }
    } catch (error) {
        throw buildApiError(error)
    }
}

const generateRecommendations = (shifts, hourlyAnalysis) => {
    const recommendations = []

    const peakHours = Object.values(hourlyAnalysis)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3)
        .map(h => h.hour)

    const lowHours = Object.values(hourlyAnalysis)
        .sort((a, b) => a.totalRevenue - b.totalRevenue)
        .slice(0, 3)
        .map(h => h.hour)

    if (peakHours.length > 0) {
        recommendations.push({
            type: 'increase_staffing',
            priority: 'high',
            message: `Tăng số lượng nhân viên trong các giờ cao điểm: ${peakHours.map(h => `${h}:00`).join(', ')}`,
            impact: 'Cải thiện service quality và tăng doanh thu',
            affectedHours: peakHours
        })
    }

    if (lowHours.length > 0) {
        recommendations.push({
            type: 'decrease_staffing',
            priority: 'medium',
            message: `Giảm số lượng nhân viên trong các giờ thấp: ${lowHours.map(h => `${h}:00`).join(', ')}`,
            impact: 'Giảm labor cost mà không ảnh hưởng service',
            affectedHours: lowHours
        })
    }

    const lowEfficiencyShifts = shifts.filter(s => s.efficiencyScore < 60)
    if (lowEfficiencyShifts.length > 0) {
        recommendations.push({
            type: 'optimize_shifts',
            priority: 'high',
            message: `${lowEfficiencyShifts.length} ca có hiệu quả thấp cần được tối ưu`,
            impact: 'Cải thiện efficiency và giảm waste',
            affectedShifts: lowEfficiencyShifts.map(s => s.shiftId)
        })
    }

    return recommendations
}

export const exportEfficiencyReport = (efficiencyData) => {
    const data = [
        ['BÁO CÁO PHÂN TÍCH HIỆU QUẢ CA LÀM VIỆC'],
        ['Thời gian:', `${efficiencyData.period.startDate} - ${efficiencyData.period.endDate}`],
        ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
        [],
        ['Ca', 'Ngày', 'Giờ bắt đầu', 'Số nhân viên', 'Doanh thu', 'Số đơn', 'Đơn TB', 'Doanh thu/NV', 'Đơn/NV', 'Điểm hiệu quả']
    ]

    efficiencyData.shifts.forEach(shift => {
        const startTime = new Date(shift.startTime)
        data.push([
            shift.shiftName,
            shift.date,
            startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            shift.staffCount,
            shift.revenue.toLocaleString('vi-VN'),
            shift.ordersCount,
            shift.avgOrderValue.toLocaleString('vi-VN'),
            shift.revenuePerStaff.toLocaleString('vi-VN'),
            shift.ordersPerStaff.toFixed(1),
            shift.efficiencyScore.toFixed(1)
        ])
    })

    return {
        data,
        sheetName: 'Hiệu quả ca làm việc',
        filename: `hieu-qua-ca-lam-viec-${efficiencyData.period.startDate}-${efficiencyData.period.endDate}.xlsx`
    }
}

