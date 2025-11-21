<template>
    <div class="payroll-page" data-aos="fade-up">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <h2 class="page-title mb-1">Quản lý Lương</h2>
                <p class="text-muted mb-0">Theo dõi chu kỳ lương, đồng bộ thống kê và tổng hợp thực lĩnh cho nhân viên.</p>
            </div>
            <button class="btn btn-primary" type="button" @click="openCreateModal">
                <i class="bi bi-plus-lg me-2"></i> Tạo chu kỳ
            </button>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="cycleFilters.status" :disabled="cyclesLoading">
                            <option value="">Tất cả</option>
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label">Từ ngày</label>
                        <input type="date" class="form-control" v-model="cycleFilters.from" :disabled="cyclesLoading" />
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="form-label">Đến ngày</label>
                        <input type="date" class="form-control" v-model="cycleFilters.to" :disabled="cyclesLoading" />
                    </div>
                    <div class="col-md-3 col-sm-6 text-md-end text-sm-start d-grid d-md-block">
                        <button class="btn btn-outline-secondary me-md-2 mb-2 mb-md-0" type="button" @click="resetFilters" :disabled="cyclesLoading">
                            Đặt lại
                        </button>
                        <button class="btn btn-primary" type="button" @click="fetchCycles" :disabled="cyclesLoading">
                            <span v-if="cyclesLoading" class="spinner-border spinner-border-sm me-1"></span>
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card cycles-card mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <h5 class="mb-0">Chu kỳ lương</h5>
                    <div class="text-muted small">{{ cycles.length }} chu kỳ</div>
                </div>

                <div v-if="cyclesLoading" class="text-center py-4">
                    <div class="spinner-border text-primary"></div>
                </div>
                <div v-else-if="cyclesError" class="alert alert-warning">
                    {{ cyclesError }}
                </div>
                <EmptyState
                    v-else-if="!cycles.length"
                    title="Chưa có chu kỳ"
                    message="Hãy tạo chu kỳ lương đầu tiên để bắt đầu tính lương."
                />
                <div v-else class="table-responsive">
                    <table class="table align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Mã chu kỳ</th>
                                <th>Tên</th>
                                <th>Khoảng thời gian</th>
                                <th>Trạng thái</th>
                                <th>Phê duyệt</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="cycle in cycles" :key="cycle.id" :class="{'table-active': cycle.id === selectedCycleId}">
                                <td class="fw-semibold">{{ cycle.code }}</td>
                                <td>{{ cycle.name || '—' }}</td>
                                <td>{{ formatDate(cycle.startDate) }} → {{ formatDate(cycle.endDate) }}</td>
                                <td>
                                    <span class="badge" :class="statusBadgeClass(cycle.status)">
                                        {{ translateStatus(cycle.status) }}
                                    </span>
                                </td>
                                <td>
                                    <div v-if="cycle.approvedBy" class="d-flex flex-column">
                                        <span class="fw-semibold">{{ cycle.approvedBy }}</span>
                                        <span class="text-muted small">{{ formatDateTime(cycle.approvedAt) }}</span>
                                    </div>
                                    <span v-else class="text-muted small">Chưa phê duyệt</span>
                                </td>
                                <td class="text-end">
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" type="button" @click="selectCycle(cycle)">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" type="button" @click="openEditModal(cycle)">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <section v-if="selectedCycle" class="cycle-detail card mb-4">
            <div class="card-body">
                <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-3">
                    <div>
                        <h5 class="mb-1">Chu kỳ {{ selectedCycle.code }}</h5>
                        <div class="text-muted small">Tạo bởi {{ selectedCycle.createdBy || 'Hệ thống' }} • Cập nhật {{ formatDateTime(selectedCycle.updatedAt) }}</div>
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        <button
                            class="btn btn-outline-success"
                            type="button"
                            @click="handleRegenerate"
                            :disabled="summariesLoading || !canRegenerate"
                        >
                            <span v-if="summariesLoading" class="spinner-border spinner-border-sm me-2"></span>
                            Đồng bộ dữ liệu
                        </button>
                        <button class="btn btn-outline-secondary" type="button" @click="deselectCycle">
                            Bỏ chọn
                        </button>
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-3 col-sm-6">
                        <label class="text-muted small">Khoảng thời gian</label>
                        <div class="fw-semibold">{{ formatDate(selectedCycle.startDate) }} → {{ formatDate(selectedCycle.endDate) }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="text-muted small">Trạng thái</label>
                        <div class="fw-semibold">{{ translateStatus(selectedCycle.status) }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="text-muted small">Phê duyệt</label>
                        <div class="fw-semibold">{{ selectedCycle.approvedBy || '–' }}</div>
                    </div>
                    <div class="col-md-3 col-sm-6">
                        <label class="text-muted small">Ghi chú</label>
                        <div>{{ selectedCycle.notes || '—' }}</div>
                    </div>
                </div>
            </div>
        </section>

        <PayrollSummaryTable
            :summaries="filteredSummaries"
            :loading="summariesLoading"
            :error="summariesError"
        >
            <template #filters>
                <div class="input-group" style="max-width: 300px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input
                        type="text"
                        class="form-control"
                        placeholder="Tìm theo tên hoặc username"
                        v-model="summarySearch"
                        :disabled="summariesLoading"
                    />
                </div>
                <div class="badge bg-light text-muted ms-auto" v-if="selectedCycle">
                    Tổng thực lĩnh: <span class="text-primary fw-semibold">{{ formatCurrency(totalNetPayroll) }}</span>
                </div>
            </template>
        </PayrollSummaryTable>

        <PayrollCycleFormModal
            ref="cycleModalRef"
            :status-options="statusOptions"
            :submitting="formSubmitting"
            @submit="handleModalSubmit"
        />
    </div>
</template>

<script setup>
import {computed, reactive, ref, watch} from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PayrollSummaryTable from '@/components/payroll/PayrollSummaryTable.vue'
import PayrollCycleFormModal from '@/components/payroll/PayrollCycleFormModal.vue'
import {
    listPayrollCycles,
    createPayrollCycle,
    updatePayrollCycle,
    listPayrollSummaries,
    regeneratePayrollSummaries,
    getPayrollCycle
} from '@/api/shiftService'
import {toast} from 'vue3-toastify'
import {formatDate, formatDateTime, formatCurrency} from '@/utils/formatters'

const STATUS_MAP = {
    DRAFT: {label: 'Nháp', badge: 'bg-secondary'},
    IN_PROGRESS: {label: 'Đang xử lý', badge: 'bg-info text-dark'},
    READY_FOR_APPROVAL: {label: 'Chờ phê duyệt', badge: 'bg-warning text-dark'},
    APPROVED: {label: 'Đã phê duyệt', badge: 'bg-success'},
    CLOSED: {label: 'Đã chốt', badge: 'bg-dark'}
}

const statusOptions = Object.entries(STATUS_MAP).map(([value, meta]) => ({value, label: meta.label}))

const cycles = ref([])
const cyclesLoading = ref(false)
const cyclesError = ref('')
const cycleFilters = reactive({
    status: '',
    from: '',
    to: ''
})

const selectedCycleId = ref(null)
const selectedCycle = computed(() => cycles.value.find((cycle) => cycle.id === selectedCycleId.value) || null)
const canRegenerate = computed(() => {
    if (!selectedCycle.value) return false
    return selectedCycle.value.status !== 'CLOSED'
})

const summaries = ref([])
const summariesLoading = ref(false)
const summariesError = ref('')
const summarySearch = ref('')

const cycleModalRef = ref(null)
const editingCycle = ref(null)
const formSubmitting = ref(false)

const filteredSummaries = computed(() => {
    if (!summarySearch.value) return summaries.value
    const keyword = summarySearch.value.trim().toLowerCase()
    return summaries.value.filter((item) => {
        const username = item.username?.toLowerCase() || ''
        const fullName = item.fullName?.toLowerCase() || ''
        return username.includes(keyword) || fullName.includes(keyword)
    })
})

const totalNetPayroll = computed(() => {
    return filteredSummaries.value.reduce((acc, item) => acc + Number(item.totalNetPayroll || 0), 0)
})

const statusBadgeClass = (status) => STATUS_MAP[status]?.badge || 'bg-secondary'
const translateStatus = (status) => STATUS_MAP[status]?.label || status

const buildCycleParams = () => {
    const params = {}
    if (cycleFilters.status) params.status = cycleFilters.status
    if (cycleFilters.from) params.from = cycleFilters.from
    if (cycleFilters.to) params.to = cycleFilters.to
    return params
}

const fetchCycles = async () => {
    cyclesLoading.value = true
    cyclesError.value = ''
    try {
        const data = await listPayrollCycles(buildCycleParams())
        cycles.value = Array.isArray(data) ? data : []
        if (selectedCycleId.value && !cycles.value.some((cycle) => cycle.id === selectedCycleId.value)) {
            selectedCycleId.value = null
        }
    } catch (err) {
        console.error(err)
        cyclesError.value = err.response?.data?.message || 'Không thể tải chu kỳ lương.'
        cycles.value = []
        selectedCycleId.value = null
    } finally {
        cyclesLoading.value = false
    }
}

const fetchSummaries = async () => {
    if (!selectedCycleId.value) {
        summaries.value = []
        return
    }
    summariesLoading.value = true
    summariesError.value = ''
    try {
        const data = await listPayrollSummaries({cycleId: selectedCycleId.value})
        summaries.value = Array.isArray(data) ? data : []
    } catch (err) {
        console.error(err)
        summariesError.value = err.response?.data?.message || 'Không thể tải tổng hợp lương.'
        summaries.value = []
    } finally {
        summariesLoading.value = false
    }
}

const resetFilters = () => {
    cycleFilters.status = ''
    cycleFilters.from = ''
    cycleFilters.to = ''
    fetchCycles()
}

const selectCycle = async (cycle) => {
    if (!cycle?.id) return
    selectedCycleId.value = cycle.id
    try {
        const fresh = await getPayrollCycle(cycle.id)
        if (fresh) {
            cycles.value = cycles.value.map((item) => (item.id === fresh.id ? fresh : item))
        }
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết chu kỳ lương.')
    }
}

const deselectCycle = () => {
    selectedCycleId.value = null
    summaries.value = []
}

const openCreateModal = () => {
    editingCycle.value = null
    cycleModalRef.value?.show()
}

const openEditModal = async (cycle) => {
    if (!cycle?.id) return
    try {
        const fresh = await getPayrollCycle(cycle.id)
        editingCycle.value = fresh
        cycleModalRef.value?.show(fresh)
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết chu kỳ lương.')
        editingCycle.value = cycle
        cycleModalRef.value?.show(cycle)
    }
}

const handleModalSubmit = async (payload) => {
    formSubmitting.value = true
    try {
        if (payload.id) {
            await updatePayrollCycle(payload.id, payload)
            toast.success('Đã cập nhật chu kỳ lương.')
        } else {
            const created = await createPayrollCycle(payload)
            toast.success('Đã tạo chu kỳ lương mới.')
            selectedCycleId.value = created?.id ?? selectedCycleId.value
        }
        cycleModalRef.value?.hide()
        await fetchCycles()
        if (selectedCycleId.value) {
            await fetchSummaries()
        }
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể lưu chu kỳ lương.')
    } finally {
        formSubmitting.value = false
    }
}

const handleRegenerate = async () => {
    if (!selectedCycleId.value) return
    if (!canRegenerate.value) {
        toast.warning('Chu kỳ lương đã chốt nên không thể đồng bộ lại dữ liệu.')
        return
    }
    const confirmed = window.confirm('Việc đồng bộ sẽ tính lại toàn bộ lương trong khoảng thời gian chu kỳ. Bạn có chắc chắn?')
    if (!confirmed) return
    summariesLoading.value = true
    try {
        await regeneratePayrollSummaries(selectedCycleId.value)
        toast.success('Đã đồng bộ dữ liệu lương.')
        await fetchSummaries()
    } catch (err) {
        console.error(err)
        const status = err.response?.status
        const backendMessage = err.response?.data?.message
        if (status === 409) {
            toast.error(backendMessage || 'Không thể đồng bộ vì dữ liệu lương hiện tại đang xung đột. Kiểm tra trạng thái chu kỳ và thử lại.')
        } else {
            toast.error(backendMessage || 'Không thể đồng bộ dữ liệu lương.')
        }
        await fetchSummaries()
    } finally {
        summariesLoading.value = false
    }
}

watch(selectedCycleId, () => {
    fetchSummaries()
})

fetchCycles()
</script>

<style scoped>
.payroll-page {
    padding-bottom: 3rem;
}


.page-title {
    color: var(--color-heading);
    font-weight: 700;
}

.filter-card,
.cycles-card,
.cycle-detail {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
}

.table-active {
    --bs-table-accent-bg: rgba(99, 102, 241, 0.08);
}
</style>
