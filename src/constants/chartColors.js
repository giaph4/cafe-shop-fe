/**
 * Chart color palettes
 */

// Primary color palette
export const PRIMARY_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1'  // Indigo
]

// Revenue/Financial colors
export const REVENUE_COLORS = [
    '#10B981', // Green
    '#059669', // Dark Green
    '#34D399', // Light Green
    '#6EE7B7'  // Lighter Green
]

// Order colors
export const ORDER_COLORS = [
    '#3B82F6', // Blue
    '#2563EB', // Dark Blue
    '#60A5FA', // Light Blue
    '#93C5FD'  // Lighter Blue
]

// Category colors (for pie charts)
export const CATEGORY_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7'  // Violet
]

// Payment method colors
export const PAYMENT_COLORS = [
    '#10B981', // Green (Cash)
    '#3B82F6', // Blue (Card)
    '#8B5CF6', // Purple (E-Wallet)
    '#F59E0B', // Amber (Other)
    '#EF4444', // Red
    '#06B6D4'  // Cyan
]

// Default colors based on chart type
export const getDefaultColors = (chartType, dataSource) => {
    if (chartType === 'pie' || chartType === 'donut') {
        if (dataSource === 'categoryRevenue') {
            return CATEGORY_COLORS
        }
        if (dataSource === 'paymentMethods') {
            return PAYMENT_COLORS
        }
        return PRIMARY_COLORS
    }

    if (dataSource === 'revenue' || dataSource === 'categoryRevenue') {
        return REVENUE_COLORS
    }

    if (dataSource === 'orders') {
        return ORDER_COLORS
    }

    return PRIMARY_COLORS
}

