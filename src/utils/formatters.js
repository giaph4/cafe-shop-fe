/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam (VND).
 * @param {number} value - Số cần định dạng.
 * @returns {string} - Chuỗi đã định dạng (ví dụ: "12.000 ₫").
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') {
        return '';
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
}

/**
 * Định dạng một chuỗi ngày hoặc đối tượng Date thành dạng "dd/MM/yyyy".
 * @param {string | Date} date - Ngày cần định dạng.
 * @returns {string} - Chuỗi ngày đã định dạng.
 */
export function formatDate(date) {
    if (!date) return '';
    try {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '';
    }
}

/**
 * Định dạng một chuỗi ngày hoặc đối tượng Date thành dạng "dd/MM/yyyy HH:mm".
 * @param {string | Date} dateTime - Ngày giờ cần định dạng.
 * @returns {string} - Chuỗi đã định dạng.
 */
export function formatDateTime(dateTime) {
    if (!dateTime) return '';
    try {
        const d = new Date(dateTime);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        return '';
    }
}

/**
 * Định dạng số với locale vi-VN, cho phép tuỳ chỉnh phần thập phân.
 * @param {number|string} value - Số cần định dạng.
 * @param {Intl.NumberFormatOptions} options - Tuỳ chọn định dạng.
 * @returns {string}
 */
export function formatNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') return '';
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return '';

    const formatter = new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
        ...options
    });

    return formatter.format(numericValue);
}

/**
 * Định dạng số thành phần trăm với locale vi-VN.
 * @param {number|string} value - Số cần định dạng (0-100).
 * @param {Intl.NumberFormatOptions} options - Tuỳ chọn định dạng.
 * @returns {string} - Chuỗi đã định dạng với ký hiệu % (ví dụ: "75,5%").
 */
export function formatPercent(value, options = {}) {
    if (value === null || value === undefined || value === '') return '0%';
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) return '0%';

    const formatter = new Intl.NumberFormat('vi-VN', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
        ...options
    });

    // Convert to decimal (0.755 -> 75.5%)
    return formatter.format(numericValue / 100);
}

/**
 * Định dạng thời gian thành "HH:mm".
 * @param {string | Date} dateTime - Ngày giờ cần định dạng.
 * @returns {string} - Chuỗi thời gian đã định dạng.
 */
export function formatTime(dateTime) {
    if (!dateTime) return '';
    try {
        const d = new Date(dateTime);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        return '';
    }
}