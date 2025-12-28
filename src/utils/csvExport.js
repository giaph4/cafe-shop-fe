/**
 * Utility để export data ra CSV
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data, headers = null) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return ''
    }
    
    // Auto-detect headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0])
    
    // BOM for UTF-8 to support Vietnamese characters in Excel
    const BOM = '\uFEFF'
    
    // Create header row
    const headerRow = csvHeaders.map(header => escapeCSV(header)).join(',')
    
    // Create data rows
    const dataRows = data.map(row => {
        return csvHeaders.map(header => {
            const value = row[header]
            return escapeCSV(value !== undefined && value !== null ? String(value) : '')
        }).join(',')
    })
    
    return BOM + [headerRow, ...dataRows].join('\n')
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return ''
    }
    
    const stringValue = String(value)
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    
    return stringValue
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent, filename = 'export') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
}

/**
 * Export chart data to CSV
 */
export function exportChartDataToCSV(series, categories, filename = 'chart-data') {
    if (!series || !Array.isArray(series) || series.length === 0) {
        throw new Error('Không có dữ liệu để xuất')
    }
    
    if (!categories || !Array.isArray(categories)) {
        throw new Error('Không có categories để xuất')
    }
    
    // Build data array
    const data = categories.map((category, index) => {
        const row = { 'Thời gian': category }
        series.forEach((s, seriesIndex) => {
            const seriesName = s.name || `Series ${seriesIndex + 1}`
            row[seriesName] = s.data[index] || 0
        })
        return row
    })
    
    const csvContent = arrayToCSV(data)
    downloadCSV(csvContent, filename)
}

