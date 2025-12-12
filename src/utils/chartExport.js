// Dynamic imports to avoid issues if packages not installed
let html2canvas = null
let jsPDF = null

const loadHtml2Canvas = async () => {
    if (!html2canvas) {
        html2canvas = (await import('html2canvas')).default
    }
    return html2canvas
}

const loadJsPDF = async () => {
    if (!jsPDF) {
        const jsPDFModule = await import('jspdf')
        // jsPDF exports the class as default
        jsPDF = jsPDFModule.default
    }
    return jsPDF
}

/**
 * Export chart to PNG
 */
export const exportChartToPNG = async (element, filename = 'chart') => {
    try {
        const html2canvasLib = await loadHtml2Canvas()
        const canvas = await html2canvasLib(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        })

        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    } catch (error) {
        throw new Error(`Không thể xuất PNG: ${  error.message}`)
    }
}

/**
 * Export chart to SVG
 */
export const exportChartToSVG = async (element, filename = 'chart') => {
    try {
        // Get SVG from ApexCharts
        const svgElement = element.querySelector('svg')
        if (!svgElement) {
            throw new Error('Không tìm thấy SVG element')
        }

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)

        const link = document.createElement('a')
        link.download = `${filename}.svg`
        link.href = svgUrl
        link.click()

        URL.revokeObjectURL(svgUrl)
    } catch (error) {
        throw new Error(`Không thể xuất SVG: ${  error.message}`)
    }
}

/**
 * Export chart to PDF
 */
export const exportChartToPDF = async (element, filename = 'chart') => {
    try {
        const html2canvasLib = await loadHtml2Canvas()
        const jsPDFLib = await loadJsPDF()

        const canvas = await html2canvasLib(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDFLib({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        })

        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
        }

        pdf.save(`${filename}.pdf`)
    } catch (error) {
        throw new Error(`Không thể xuất PDF: ${  error.message}`)
    }
}

/**
 * Main export function
 */
export const exportChart = async (element, format = 'png', filename = 'chart') => {
    switch (format) {
        case 'svg':
            await exportChartToSVG(element, filename)
            break
        case 'pdf':
            await exportChartToPDF(element, filename)
            break
        case 'png':
        default:
            await exportChartToPNG(element, filename)
            break
    }
}

