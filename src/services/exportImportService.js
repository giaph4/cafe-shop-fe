import logger from '@/utils/logger'

// Dynamic import for XLSX (to avoid bundle size issues)
let XLSX = null
const loadXLSX = async () => {
    if (!XLSX) {
        XLSX = await import('xlsx')
    }
    return XLSX
}

/**
 * Export data to various formats
 */
export class ExportImportService {
    /**
     * Export to Excel
     */
    static async exportToExcel (data, options = {}) {
        try {
            const XLSX = await loadXLSX()
            const {
                filename = 'export.xlsx',
                sheetName = 'Sheet1',
                columns = null,
                includeHeaders = true,
                formatting = {}
            } = options

            // Prepare data
            let exportData = data
            if (columns) {
                exportData = data.map(item => {
                    const row = {}
                    columns.forEach(col => {
                        row[col.label] = col.value ? col.value(item) : item[col.key]
                    })
                    return row
                })
            }

            // Create workbook
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Apply formatting
            if (formatting.widths) {
                ws['!cols'] = formatting.widths.map(w => ({ wch: w }))
            }

            // Add worksheet
            XLSX.utils.book_append_sheet(wb, ws, sheetName)

            // Write file
            XLSX.writeFile(wb, filename)

            return { success: true, filename }
        } catch (err) {
            logger.error('[ExportImportService] Excel export failed', err)
            throw err
        }
    }

    /**
     * Export to CSV
     */
    static exportToCSV (data, options = {}) {
        try {
            const {
                filename = 'export.csv',
                columns = null,
                delimiter = ',',
                includeHeaders = true
            } = options

            // Prepare data
            let exportData = data
            if (columns) {
                exportData = data.map(item => {
                    const row = {}
                    columns.forEach(col => {
                        row[col.label] = col.value ? col.value(item) : item[col.key]
                    })
                    return row
                })
            }

            // Convert to CSV
            const headers = includeHeaders && exportData.length > 0
                ? `${Object.keys(exportData[0]).join(delimiter)  }\n`
                : ''

            const rows = exportData.map(item =>
                Object.values(item).map(val => {
                    // Escape values containing delimiter
                    const str = String(val || '')
                    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`
                    }
                    return str
                }).join(delimiter)
            ).join('\n')

            const csv = headers + rows

            // Download
            const blob = new Blob([`\uFEFF${  csv}`], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
            URL.revokeObjectURL(link.href)

            return { success: true, filename }
        } catch (err) {
            logger.error('[ExportImportService] CSV export failed', err)
            throw err
        }
    }

    /**
     * Export to JSON
     */
    static exportToJSON (data, options = {}) {
        try {
            const {
                filename = 'export.json',
                pretty = true
            } = options

            const json = pretty
                ? JSON.stringify(data, null, 2)
                : JSON.stringify(data)

            const blob = new Blob([json], { type: 'application/json' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
            URL.revokeObjectURL(link.href)

            return { success: true, filename }
        } catch (err) {
            logger.error('[ExportImportService] JSON export failed', err)
            throw err
        }
    }

    /**
     * Export to PDF (requires jsPDF and html2canvas)
     */
    static async exportToPDF (data, options = {}) {
        try {
            const {
                filename = 'export.pdf',
                title = 'Export',
                columns = null,
                orientation = 'portrait'
            } = options

            // Dynamic import
            const jsPDF = (await import('jspdf')).default
            const html2canvas = (await import('html2canvas')).default

            // Create PDF
            const doc = new jsPDF(orientation)

            // Add title
            doc.setFontSize(16)
            doc.text(title, 14, 20)

            // Prepare data
            let exportData = data
            if (columns) {
                exportData = data.map(item => {
                    const row = {}
                    columns.forEach(col => {
                        row[col.label] = col.value ? col.value(item) : item[col.key]
                    })
                    return row
                })
            }

            // Add table (simplified - you may want to use a table plugin)
            let y = 30
            const lineHeight = 7
            const pageHeight = doc.internal.pageSize.height

            if (exportData.length > 0) {
                const headers = Object.keys(exportData[0])

                // Headers
                doc.setFontSize(10)
                headers.forEach((header, index) => {
                    doc.text(header, 14 + (index * 50), y)
                })
                y += lineHeight

                // Data rows
                exportData.forEach((row, rowIndex) => {
                    if (y > pageHeight - 20) {
                        doc.addPage()
                        y = 20
                    }

                    Object.values(row).forEach((value, colIndex) => {
                        doc.text(String(value || ''), 14 + (colIndex * 50), y)
                    })
                    y += lineHeight
                })
            }

            doc.save(filename)
            return { success: true, filename }
        } catch (err) {
            logger.error('[ExportImportService] PDF export failed', err)
            throw err
        }
    }

    /**
     * Import from Excel/CSV
     */
    static async importFromFile (file, options = {}) {
        try {
            const XLSX = await loadXLSX()
            const {
                sheetIndex = 0,
                headerRow = 0,
                validate = null
            } = options

            return new Promise((resolve, reject) => {
                const reader = new FileReader()

                reader.onload = (e) => {
                    try {
                        const data = e.target.result
                        const workbook = XLSX.read(data, { type: 'binary' })
                        const sheetName = workbook.SheetNames[sheetIndex]
                        const worksheet = workbook.Sheets[sheetName]

                        // Convert to JSON
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            header: headerRow,
                            defval: null
                        })

                        // Validate if validator provided
                        if (validate) {
                            const validation = validate(jsonData)
                            if (!validation.valid) {
                                reject(new Error(validation.message || 'Validation failed'))
                                return
                            }
                        }

                        resolve({
                            success: true,
                            data: jsonData,
                            rowCount: jsonData.length
                        })
                    } catch (err) {
                        reject(err)
                    }
                }

                reader.onerror = () => {
                    reject(new Error('Failed to read file'))
                }

                if (file.name.endsWith('.csv')) {
                    reader.readAsText(file)
                } else {
                    reader.readAsBinaryString(file)
                }
            })
        } catch (err) {
            logger.error('[ExportImportService] Import failed', err)
            throw err
        }
    }

    /**
     * Validate import data
     */
    static validateImportData (data, rules) {
        const errors = []
        const warnings = []

        data.forEach((row, index) => {
            rules.forEach(rule => {
                const value = row[rule.field]

                // Required check
                if (rule.required && (value === null || value === undefined || value === '')) {
                    errors.push({
                        row: index + 1,
                        field: rule.field,
                        message: `${rule.label || rule.field} is required`
                    })
                }

                // Type check
                if (value !== null && value !== undefined && value !== '' && rule.type) {
                    if (rule.type === 'number' && isNaN(Number(value))) {
                        errors.push({
                            row: index + 1,
                            field: rule.field,
                            message: `${rule.label || rule.field} must be a number`
                        })
                    } else if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push({
                            row: index + 1,
                            field: rule.field,
                            message: `${rule.label || rule.field} must be a valid email`
                        })
                    }
                }

                // Custom validator
                if (rule.validator && value !== null && value !== undefined && value !== '') {
                    const result = rule.validator(value, row)
                    if (result !== true) {
                        if (rule.severity === 'warning') {
                            warnings.push({
                                row: index + 1,
                                field: rule.field,
                                message: result || `${rule.label || rule.field} validation failed`
                            })
                        } else {
                            errors.push({
                                row: index + 1,
                                field: rule.field,
                                message: result || `${rule.label || rule.field} validation failed`
                            })
                        }
                    }
                }
            })
        })

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    /**
     * Map imported columns to entity fields
     */
    static mapColumns (importData, columnMapping) {
        return importData.map(row => {
            const mapped = {}
            Object.keys(columnMapping).forEach(importKey => {
                const entityKey = columnMapping[importKey]
                if (typeof entityKey === 'function') {
                    Object.assign(mapped, entityKey(row))
                } else {
                    mapped[entityKey] = row[importKey]
                }
            })
            return mapped
        })
    }
}

