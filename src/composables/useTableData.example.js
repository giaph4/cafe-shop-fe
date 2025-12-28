/**
 * VÍ DỤ SỬ DỤNG useTableData
 *
 * Composable này thay thế hoàn toàn usePagination cũ với các tính năng:
 * - Server-side Pagination
 * - Search với Debounce (500ms)
 * - Filters động
 * - URL Synchronization 2 chiều
 * - Auto reset page khi search/filter thay đổi
 */

import { useTableData } from './useTableData'
import { getCustomers } from '@/api/customerService'

// ========== VÍ DỤ 1: Sử dụng cơ bản ==========
export function example1 () {
    const {
        // State
        data,              // Dữ liệu từ API (response.content)
        loading,           // Trạng thái loading
        error,             // Lỗi nếu có
        page,              // Trang hiện tại (zero-based)
        displayPage,        // Trang hiển thị (one-based)
        pageSize,          // Số phần tử mỗi trang
        searchKeyword,     // Keyword tìm kiếm
        filters,           // Bộ lọc
        totalPages,        // Tổng số trang
        totalElements,     // Tổng số phần tử
        canGoPrevious,     // Có thể đi tới trang trước
        canGoNext,         // Có thể đi tới trang sau

        // Methods
        setPage,           // Thay đổi trang
        goToPrevious,     // Đi tới trang trước
        goToNext,          // Đi tới trang sau
        goToFirst,         // Đi tới trang đầu
        goToLast,          // Đi tới trang cuối
        setPageSize,       // Thay đổi pageSize
        setSearchKeyword,  // Cập nhật search keyword
        setFilter,         // Cập nhật 1 filter
        setFilters,        // Cập nhật nhiều filters
        resetFilters,      // Reset tất cả filters
        reset,             // Reset tất cả về ban đầu
        refresh            // Refresh dữ liệu
    } = useTableData({
        // Hàm gọi API - BẮT BUỘC
        fetchFn: async (params) =>
            // params sẽ tự động chứa: page, size, keyword, và các filters
            await getCustomers(params)
        ,

        // Bộ lọc ban đầu
        initialFilters: {
            status: '',
            minLoyaltyPoints: null,
            maxLoyaltyPoints: null
        },

        // Số phần tử mỗi trang
        initialPageSize: 15,

        // Thời gian debounce cho search (ms)
        debounceMs: 500,

        // Đồng bộ với URL (mặc định: true)
        syncUrl: true,

        // Tên các param trong URL
        pageParam: 'page',
        sizeParam: 'size',
        searchParam: 'search',

        // Sử dụng zero-based page (mặc định: true)
        zeroBasedPage: true
    })

    // Trong template:
    // - data.value chứa danh sách customers
    // - loading.value để hiển thị spinner
    // - searchKeyword.value để bind với input
    // - filters.value để bind với các filter inputs
}

// ========== VÍ DỤ 2: Với filters phức tạp ==========
export function example2 () {
    const tableData = useTableData({
        fetchFn: async (params) =>
            // API sẽ nhận được:
            // {
            //   page: 0,
            //   size: 15,
            //   keyword: "search text",
            //   status: "ACTIVE",
            //   minLoyaltyPoints: 100,
            //   maxLoyaltyPoints: 1000,
            //   startDate: "2024-01-01",
            //   endDate: "2024-12-31"
            // }
            await getCustomers(params)
        ,
        initialFilters: {
            status: '',
            minLoyaltyPoints: null,
            maxLoyaltyPoints: null,
            startDate: '',
            endDate: ''
        },
        initialPageSize: 20
    })

    // Cập nhật filter
    tableData.setFilter('status', 'ACTIVE')

    // Cập nhật nhiều filters cùng lúc
    tableData.setFilters({
        status: 'ACTIVE',
        minLoyaltyPoints: 100
    })

    // Reset filters
    tableData.resetFilters()
}

// ========== VÍ DỤ 3: Không đồng bộ URL ==========
export function example3 () {
    const tableData = useTableData({
        fetchFn: async (params) => await getCustomers(params),
        syncUrl: false  // Tắt đồng bộ URL
    })
}

// ========== VÍ DỤ 4: One-based page ==========
export function example4 () {
    const tableData = useTableData({
        fetchFn: async (params) => await getCustomers(params),
        zeroBasedPage: false  // Sử dụng one-based (1, 2, 3...)
    })

    // Khi setPage, truyền số one-based
    tableData.setPage(1)  // Trang đầu tiên
    tableData.setPage(2)  // Trang thứ hai
}

// ========== VÍ DỤ 5: Custom debounce ==========
export function example5 () {
    const tableData = useTableData({
        fetchFn: async (params) => await getCustomers(params),
        debounceMs: 1000  // Debounce 1 giây
    })
}

// ========== MIGRATION GUIDE: Từ usePagination sang useTableData ==========
/*
 * TRƯỚC (usePagination cũ):
 *
 * const {
 *     zeroBasedPage,
 *     pageSize,
 *     totalPages,
 *     setPageFromZero,
 *     updatePageSize,
 *     updateFromResponse,
 *     syncQuery
 * } = usePagination({
 *     mode: PaginationMode.ZERO_BASED,
 *     pageSize: 15
 * })
 *
 * syncQuery(route, router, {
 *     queryMode: PaginationMode.ZERO_BASED
 * })
 *
 * const fetchData = async () => {
 *     const response = await getCustomers({
 *         keyword: filters.keyword,
 *         page: zeroBasedPage.value,
 *         size: pageSize.value
 *     })
 *     updateFromResponse({
 *         page: response.number,
 *         totalPages: response.totalPages,
 *         totalElements: response.totalElements
 *     })
 * }
 *
 * watch([zeroBasedPage, pageSize], () => {
 *     fetchData()
 * })
 *
 *
 * SAU (useTableData mới):
 *
 * const {
 *     data,
 *     loading,
 *     page,
 *     pageSize,
 *     totalPages,
 *     searchKeyword,
 *     filters,
 *     setPage,
 *     setPageSize,
 *     setSearchKeyword,
 *     setFilters
 * } = useTableData({
 *     fetchFn: async (params) => {
 *         return await getCustomers(params)
 *     },
 *     initialFilters: {
 *         // filters của bạn
 *     },
 *     initialPageSize: 15
 * })
 *
 * // Không cần watch, không cần syncQuery, không cần updateFromResponse
 * // Tất cả đã được xử lý tự động!
 *
 * // Trong template:
 * // - data.value thay vì customers.value
 * // - searchKeyword.value thay vì filters.keyword
 * // - setPage(page) thay vì setPageFromZero(page)
 */

