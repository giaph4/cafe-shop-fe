import { formatCurrency, formatDateTime } from '@/utils/formatters'

export const INVOICE_PRINT_STYLES = `
    * { font-family: 'Inter', Arial, sans-serif; box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #0f172a; background: #ffffff; }
    .invoice-print { max-width: 360px; margin: 0 auto; }
    .invoice-print__header { margin-bottom: 16px; }
    .invoice-print__header h4 { margin: 0; font-size: 18px; }
    .invoice-print__header p { margin: 0; font-size: 12px; color: #64748b; }
    .invoice-print__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; margin-bottom: 16px; }
    .invoice-print__meta .label { display: block; font-weight: 600; color: #475569; }
    .invoice-print__table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    .invoice-print__table th, .invoice-print__table td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
    .invoice-print__table th { text-align: left; background: #f8fafc; }
    .invoice-print__table .text-end { text-align: right; }
    .invoice-print__total { font-size: 12px; margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
    .invoice-print__total div { display: flex; justify-content: space-between; }
    .invoice-print__total .grand-total { font-size: 14px; font-weight: 700; }
    .invoice-print__footer { margin-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
`

const DEFAULT_OPTIONS = Object.freeze({
    storeName: 'Coffee GP',
    subtitle: 'Hóa đơn bán hàng',
    footerMessage: 'Cảm ơn và hẹn gặp lại!',
    autoClose: true
})

const escapeHtml = (input) => {
    const value = input ?? ''
    return String(value).replace(/[&<>"']/g, (match) => {
        switch (match) {
            case '&': return '&amp;'
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '"': return '&quot;'
            case "'": return '&#39;'
            default: return match
        }
    })
}

const toNumber = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
}

const formatCurrencySafe = (value) => formatCurrency(toNumber(value))

const resolveTableLabel = (order) => {
    if (!order) return '—'
    if (order.tableName) return order.tableName
    if (order.table?.name) return order.table.name
    if (order.orderType === 'TAKEAWAY' || order.type === 'TAKEAWAY') return 'Mang đi'
    return '—'
}

const resolvePaymentMethod = (order, fallback = 'CASH') => {
    if (!order) return fallback
    const method = order.paymentMethod || order.latestPaymentMethod || fallback
    return String(method || fallback).toUpperCase()
}

const buildItemRows = (items) => {
    if (!Array.isArray(items) || !items.length) {
        return '<tr><td colspan="4" class="text-muted">Không có sản phẩm.</td></tr>'
    }

    return items.map((item) => {
        const quantity = toNumber(item?.quantity || item?.qty)
        const unitPrice = toNumber(item?.priceAtOrder || item?.price)
        const total = quantity * unitPrice
        return `
            <tr>
                <td>${escapeHtml(item?.productName || item?.name || '—')}</td>
                <td class="text-end">${escapeHtml(quantity)}</td>
                <td class="text-end">${escapeHtml(formatCurrencySafe(unitPrice))}</td>
                <td class="text-end">${escapeHtml(formatCurrencySafe(total))}</td>
            </tr>
        `
    }).join('')
}

const resolveItems = (order) => {
    if (!order) return []
    if (Array.isArray(order.orderDetails) && order.orderDetails.length) return order.orderDetails
    if (Array.isArray(order.items) && order.items.length) return order.items
    return []
}

const resolveSubTotal = (order, items) => {
    const backendSubTotal = toNumber(order?.subTotal)
    if (backendSubTotal > 0) return backendSubTotal
    return items.reduce((sum, item) => {
        const quantity = toNumber(item?.quantity || item?.qty)
        const unitPrice = toNumber(item?.priceAtOrder || item?.price)
        return sum + quantity * unitPrice
    }, 0)
}

export const buildInvoiceDocument = (order, options = {}) => {
    if (!order) return ''

    const config = { ...DEFAULT_OPTIONS, ...options }
    const items = resolveItems(order)
    const subTotalValue = resolveSubTotal(order, items)
    const discountValue = Math.max(0, toNumber(order?.discountAmount))
    const tipValue = Math.max(0, toNumber(order?.tipAmount))
    const totalValueRaw = toNumber(order?.totalAmount)
    // Công thức: (Tổng tiền hàng - Giảm giá) + Tiền típ
    const calculatedTotal = Math.max(subTotalValue - discountValue, 0) + tipValue
    const totalValue = totalValueRaw > 0 ? totalValueRaw : calculatedTotal

    const createdAt = order?.paidAt || order?.createdAt
    const metaRows = [
        { label: 'Mã đơn', value: `#${escapeHtml(order?.code || order?.id || '—')}` },
        { label: 'Ngày tạo', value: createdAt ? escapeHtml(formatDateTime(createdAt)) : '—' },
        { label: 'Bàn', value: escapeHtml(resolveTableLabel(order)) },
        { label: 'Nhân viên', value: escapeHtml(order?.staffUsername || order?.staffName || '—') },
        { label: 'Khách hàng', value: escapeHtml(order?.customerName || 'Khách lẻ') },
        { label: 'Thanh toán', value: escapeHtml(resolvePaymentMethod(order, options?.fallbackPaymentMethod)) }
    ]

    const metaHtml = metaRows.map((row) => `
        <div>
            <span class="label">${row.label}</span>
            <span>${row.value}</span>
        </div>
    `).join('')

    const itemRows = buildItemRows(items)

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Hóa đơn #${escapeHtml(order?.code || order?.id || '—')}</title>
    <style>${INVOICE_PRINT_STYLES}</style>
</head>
<body>
    <article class="invoice-print">
        <header class="invoice-print__header text-center">
            <h4 class="mb-1">${escapeHtml(config.storeName)}</h4>
            <p class="mb-0 text-muted">${escapeHtml(config.subtitle)}</p>
        </header>
        <section class="invoice-print__meta">
            ${metaHtml}
        </section>
        <table class="invoice-print__table">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th class="text-end">SL</th>
                    <th class="text-end">Đơn giá</th>
                    <th class="text-end">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows}
            </tbody>
        </table>
        <section class="invoice-print__total">
            <div>
                <span>Tổng phụ</span>
                <span>${escapeHtml(formatCurrencySafe(subTotalValue))}</span>
            </div>
            ${discountValue > 0 ? `
            <div>
                <span>Giảm giá</span>
                <span>- ${escapeHtml(formatCurrencySafe(discountValue))}</span>
            </div>
            ` : ''}
            ${tipValue > 0 ? `
            <div style="color: #15803d;">
                <span>Tiền típ</span>
                <span>+ ${escapeHtml(formatCurrencySafe(tipValue))}</span>
            </div>
            ` : ''}
            <div class="grand-total">
                <span>Tổng cộng</span>
                <span>${escapeHtml(formatCurrencySafe(totalValue))}</span>
            </div>
        </section>
        <footer class="invoice-print__footer">
            <p class="mb-0">${escapeHtml(config.footerMessage)}</p>
        </footer>
    </article>
</body>
</html>`
}

export const printInvoiceToWindow = (order, options = {}) => {
    if (typeof window === 'undefined') {
        throw new Error('Print is not available in the current environment.')
    }

    const documentContent = buildInvoiceDocument(order, options)
    if (!documentContent) {
        throw new Error('Không có dữ liệu hóa đơn để in.')
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer')
    if (!printWindow) {
        return null
    }

    printWindow.document.open()
    printWindow.document.write(documentContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()

    if (options.autoClose ?? DEFAULT_OPTIONS.autoClose) {
        printWindow.close()
    }

    return printWindow
}
