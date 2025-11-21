import {isPlainObject} from '@/utils/object'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

const coerceBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback)

const extractItems = (page) => {
    if (!page) return []
    if (Array.isArray(page.content)) return page.content
    if (Array.isArray(page.items)) return page.items
    return []
}

const ensureSort = (sort) => {
    if (!isPlainObject(sort)) return null
    return {
        empty: Boolean(sort.empty),
        sorted: Boolean(sort.sorted),
        unsorted: Boolean(sort.unsorted)
    }
}

/**
 * Chuẩn hoá cấu trúc Page trả về từ Spring Data.
 * @param {import('axios').AxiosResponse['data']} data
 */
export const normalizePage = (data) => {
    const items = extractItems(data)
    const size = isNumber(data?.size) ? data.size : items.length
    const totalPages = isNumber(data?.totalPages) ? data.totalPages : (items.length ? 1 : 0)
    const page = isNumber(data?.number) ? data.number : data?.page ?? 0

    return Object.freeze({
        items,
        page,
        size,
        totalPages,
        totalElements: isNumber(data?.totalElements) ? data.totalElements : items.length,
        numberOfElements: isNumber(data?.numberOfElements) ? data.numberOfElements : items.length,
        first: coerceBoolean(data?.first, page <= 0),
        last: coerceBoolean(data?.last, page >= Math.max(totalPages - 1, 0)),
        empty: coerceBoolean(data?.empty, items.length === 0),
        sort: ensureSort(data?.sort),
        raw: data
    })
}

/**
 * Đảm bảo giá trị trả về luôn là mảng.
 * @template T
 * @param {T[] | null | undefined} value
 * @returns {T[]}
 */
export const ensureArray = (value) => (Array.isArray(value) ? value : [])
