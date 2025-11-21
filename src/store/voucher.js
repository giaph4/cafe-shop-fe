import {defineStore} from 'pinia'
import {computed, reactive, ref} from 'vue'
import {
    buildVoucherPayload,
    createVoucher,
    deleteVoucher,
    getVoucherById,
    getVoucherSummary,
    searchVouchers,
    toggleVoucher,
    updateVoucher
} from '@/api/voucherService'

const buildInitialFilters = () => ({
    code: '',
    type: '',
    active: '',
    validFrom: '',
    validTo: ''
})

const defaultSummary = () => ({
    activeCount: 0,
    inactiveCount: 0,
    expiringSoonCount: 0,
    redeemedCount: 0
})

const extractErrorMessage = (err) => {
    if (err?.response?.data?.message) return err.response.data.message
    if (err?.response?.data?.details) return err.response.data.details
    if (typeof err?.message === 'string') return err.message
    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export const useVoucherStore = defineStore('voucher', () => {
    const items = ref([])
    const pagination = reactive({
        page: 1,
        size: 10,
        totalPages: 0,
        totalElements: 0,
        sort: 'createdAt,desc'
    })
    const filters = reactive(buildInitialFilters())

    const loading = ref(false)
    const summaryLoading = ref(false)
    const saving = ref(false)
    const toggling = ref(false)
    const deleting = ref(false)
    const errorMessage = ref('')

    const summary = ref(defaultSummary())

    const hasData = computed(() => Array.isArray(items.value) && items.value.length > 0)

    const resetFilters = () => {
        Object.assign(filters, buildInitialFilters())
    }

    const setPage = (page) => {
        pagination.page = Math.max(1, page)
    }

    const setPageSize = (size) => {
        pagination.size = Math.max(1, size)
        pagination.page = 1
    }

    const setSort = (sort) => {
        pagination.sort = sort || 'createdAt,desc'
        pagination.page = 1
    }

    const parseActiveValue = (value) => {
        if (value === '' || value === null || value === undefined) return ''
        if (value === true || value === false) return value
        if (typeof value === 'string') {
            const lowered = value.trim().toLowerCase()
            if (lowered === 'true') return true
            if (lowered === 'false') return false
        }
        return ''
    }

    const setFilters = (nextFilters) => {
        if (!nextFilters) return
        Object.assign(filters, {
            code: nextFilters.code ?? filters.code,
            type: nextFilters.type ?? filters.type,
            active: parseActiveValue(nextFilters.active ?? filters.active),
            validFrom: nextFilters.validFrom ?? filters.validFrom,
            validTo: nextFilters.validTo ?? filters.validTo
        })
        pagination.page = 1
    }

    const loadVouchers = async () => {
        loading.value = true
        errorMessage.value = ''
        try {
            const activeFilter = parseActiveValue(filters.active)
            const response = await searchVouchers({
                page: pagination.page - 1,
                size: pagination.size,
                sort: pagination.sort,
                code: filters.code?.trim(),
                type: filters.type || '',
                active: activeFilter,
                validFrom: filters.validFrom || '',
                validTo: filters.validTo || ''
            })

            const content = response?.content ?? []
            items.value = content

            pagination.totalPages = response?.totalPages ?? 0
            pagination.totalElements = response?.totalElements ?? content.length
            pagination.page = (response?.number ?? 0) + 1
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const loadSummary = async () => {
        summaryLoading.value = true
        try {
            const response = await getVoucherSummary()
            summary.value = {
                activeCount: response?.activeCount ?? 0,
                inactiveCount: response?.inactiveCount ?? 0,
                expiringSoonCount: response?.expiringSoonCount ?? 0,
                redeemedCount: response?.redeemedCount ?? 0
            }
        } catch (err) {
            // giữ summary hiện tại và bubble error để UI hiển thị cảnh báo
            throw err
        } finally {
            summaryLoading.value = false
        }
    }

    const fetchVoucher = async (id) => {
        try {
            return await getVoucherById(id)
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        }
    }

    const create = async (payload) => {
        saving.value = true
        errorMessage.value = ''
        try {
            const body = buildVoucherPayload(payload)
            const created = await createVoucher(body)
            await loadVouchers()
            await loadSummary()
            return created
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        } finally {
            saving.value = false
        }
    }

    const update = async (id, payload) => {
        saving.value = true
        errorMessage.value = ''
        try {
            const body = buildVoucherPayload(payload)
            const updated = await updateVoucher({id, data: body})
            await loadVouchers()
            await loadSummary()
            return updated
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        } finally {
            saving.value = false
        }
    }

    const toggle = async (id) => {
        toggling.value = true
        errorMessage.value = ''
        try {
            const result = await toggleVoucher(id)
            await loadVouchers()
            await loadSummary()
            return result
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        } finally {
            toggling.value = false
        }
    }

    const remove = async (id) => {
        deleting.value = true
        errorMessage.value = ''
        try {
            await deleteVoucher(id)
            await loadVouchers()
            await loadSummary()
        } catch (err) {
            errorMessage.value = extractErrorMessage(err)
            throw err
        } finally {
            deleting.value = false
        }
    }

    return {
        items,
        filters,
        pagination,
        loading,
        summaryLoading,
        saving,
        toggling,
        deleting,
        summary,
        hasData,
        errorMessage,
        resetFilters,
        setFilters,
        setPage,
        setPageSize,
        setSort,
        loadVouchers,
        loadSummary,
        fetchVoucher,
        create,
        update,
        toggle,
        remove
    }
})
