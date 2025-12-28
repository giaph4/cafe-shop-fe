<template>
  <div
    class="page-container container-fluid payroll-page"
      
  >
    <div class="payroll-header">
      <div class="payroll-header__content">
        <div class="payroll-header__title-section">
          <h2 class="payroll-header__title">
            Quản lý Lương
          </h2>
          <p class="payroll-header__subtitle">
            Theo dõi chu kỳ lương, đồng bộ thống kê và tổng hợp thực lĩnh cho nhân viên.
          </p>
        </div>
        <div class="payroll-header__actions">
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="cyclesLoading"
            @click="fetchCycles"
          >
            <span
              v-if="cyclesLoading"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-arrow-clockwise me-2"
            />
            Làm mới
          </button>
          <button
            class="btn btn-primary"
            type="button"
            @click="openCreateModal"
          >
            <i class="bi bi-plus-lg me-2" />
            Tạo chu kỳ
          </button>
        </div>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-3 col-sm-6">
            <label class="form-label">Trạng thái</label>
            <select
              v-model="cycleFilters.status"
              class="form-select"
              :disabled="cyclesLoading"
            >
              <option value="">
                Tất cả
              </option>
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="cycleFilters.from"
              type="date"
              class="form-control"
              :disabled="cyclesLoading"
            >
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="cycleFilters.to"
              type="date"
              class="form-control"
              :disabled="cyclesLoading"
            >
          </div>
          <div class="col-md-3 col-sm-6 text-md-end text-sm-start d-grid d-md-block">
            <button
              class="btn btn-outline-secondary me-md-2 mb-2 mb-md-0"
              type="button"
              :disabled="cyclesLoading"
              @click="resetFilters"
            >
              Đặt lại
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="cyclesLoading"
              @click="fetchCycles"
            >
              <span
                v-if="cyclesLoading"
                class="spinner-border spinner-border-sm me-1"
              />
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card cycles-card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <h5 class="mb-0">
            Chu kỳ lương
          </h5>
          <div class="text-muted small">
            {{ cycles.length }} chu kỳ
          </div>
        </div>

        <LoadingState v-if="cyclesLoading" />
        <ErrorState
          v-else-if="cyclesError"
          :message="cyclesError"
          @retry="fetchCycles"
        />
        <EmptyState
          v-else-if="!cycles.length"
          title="Chưa có chu kỳ"
          message="Hãy tạo chu kỳ lương đầu tiên để bắt đầu tính lương."
        >
          <template #action>
            <button
              class="btn btn-primary"
              type="button"
              @click="openCreateModal"
            >
              <i class="bi bi-plus-lg me-2" />
              Tạo chu kỳ
            </button>
          </template>
        </EmptyState>
        <div
          v-else
          class="table-responsive"
        >
          <table class="table align-middle">
            <thead class="table-light">
              <tr>
                <th>Mã chu kỳ</th>
                <th>Tên</th>
                <th>Khoảng thời gian</th>
                <th>Trạng thái</th>
                <th>Phê duyệt</th>
                <th class="text-end">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="cycle in cycles"
                :key="cycle.id"
                :class="{'table-active': cycle.id === selectedCycleId}"
              >
                <td class="fw-semibold">
                  {{ cycle.code }}
                </td>
                <td>{{ cycle.name || '—' }}</td>
                <td>{{ formatDate(cycle.startDate) }} → {{ formatDate(cycle.endDate) }}</td>
                <td>
                  <span
                    class="badge"
                    :class="statusBadgeClass(cycle.status)"
                  >
                    {{ translateStatus(cycle.status) }}
                  </span>
                </td>
                <td>
                  <div
                    v-if="cycle.approvedBy"
                    class="d-flex flex-column"
                  >
                    <span class="fw-semibold">{{ cycle.approvedBy }}</span>
                    <span class="text-muted small">{{ formatDateTime(cycle.approvedAt) }}</span>
                  </div>
                  <span
                    v-else
                    class="text-muted small"
                  >Chưa phê duyệt</span>
                </td>
                <td class="text-end">
                  <div class="action-buttons">
                    <button
                      class="btn btn-sm btn-outline-primary"
                      type="button"
                      title="Xem chi tiết"
                      @click="selectCycle(cycle)"
                    >
                      <i class="bi bi-eye me-1" />
                      <span class="d-none d-md-inline">Chi tiết</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <section
      v-if="selectedCycle"
      class="cycle-detail card mb-4"
    >
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-3">
          <div>
            <h5 class="mb-1">
              Chu kỳ {{ selectedCycle.code }}
            </h5>
            <div class="text-muted small">
              Tạo bởi {{ selectedCycle.createdBy || 'Hệ thống' }} • Cập nhật {{ formatDateTime(selectedCycle.updatedAt) }}
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button
              class="btn btn-outline-success"
              type="button"
              :disabled="summariesLoading || !canRegenerate"
              @click="handleRegenerate"
            >
              <span
                v-if="summariesLoading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-arrow-repeat me-2"
              />
              Đồng bộ dữ liệu
            </button>
            <button
              class="btn btn-outline-secondary"
              type="button"
              @click="deselectCycle"
            >
              <i class="bi bi-x-lg me-2" />
              Bỏ chọn
            </button>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-3 col-sm-6">
            <label class="text-muted small">Khoảng thời gian</label>
            <div class="fw-semibold">
              {{ formatDate(selectedCycle.startDate) }} → {{ formatDate(selectedCycle.endDate) }}
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="text-muted small">Trạng thái</label>
            <div class="cycle-status-display">
              <span
                class="badge"
                :class="statusBadgeClass(selectedCycle.status)"
              >
                {{ translateStatus(selectedCycle.status) }}
              </span>
            </div>
          </div>
          <div class="col-md-3 col-sm-6">
            <label class="text-muted small">Phê duyệt</label>
            <div class="fw-semibold">
              {{ selectedCycle.approvedBy || '–' }}
            </div>
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
        <div
          class="input-group summary-search-input"
          style="max-width: 300px;"
        >
          <span class="input-group-text"><i class="bi bi-search" /></span>
          <input
            v-model="summarySearch"
            type="text"
            class="form-control"
            placeholder="Tìm theo tên hoặc username"
            :disabled="summariesLoading"
          >
        </div>
        <div
          v-if="selectedCycle"
          class="badge summary-total-badge ms-auto"
        >
          Tổng thực lĩnh: <span class="fw-semibold">{{ formatCurrency(totalNetPayroll) }}</span>
        </div>
      </template>
    </PayrollSummaryTable>

    <PayrollCycleFormModal
      ref="cycleModalRef"
      :status-options="statusOptions"
      :submitting="formSubmitting"
      @submit="handleModalSubmit"
    />

    <!-- Regenerate Confirmation Modal -->
    <Teleport to="body">
      <div
        id="regenerateConfirmModal"
        ref="regenerateModalElement"
        class="modal fade payroll-regenerate-modal"
        tabindex="-1"
        aria-labelledby="regenerateConfirmModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5
                id="regenerateConfirmModalLabel"
                class="modal-title"
              >
                Xác nhận đồng bộ
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="closeRegenerateModal"
              />
            </div>
            <div class="modal-body">
              <p>Việc đồng bộ sẽ tính lại toàn bộ lương trong khoảng thời gian chu kỳ. Bạn có chắc chắn muốn tiếp tục?</p>
              <div
                v-if="selectedCycle"
                class="alert alert-info mt-3"
              >
                <strong>Chu kỳ:</strong> {{ selectedCycle.code }}<br>
                <strong>Thời gian:</strong> {{ formatDate(selectedCycle.startDate) }} → {{ formatDate(selectedCycle.endDate) }}
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="closeRegenerateModal"
              >
                Hủy
              </button>
              <button
                type="button"
                class="btn btn-success"
                :disabled="summariesLoading"
                @click="confirmRegenerate"
              >
                <span
                  v-if="summariesLoading"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Đồng bộ
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { Teleport } from 'vue'
import { Modal } from 'bootstrap'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
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
import { toast } from 'vue3-toastify'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters'

const STATUS_MAP = {
    DRAFT: { label: 'Nháp', badge: 'bg-secondary' },
    IN_PROGRESS: { label: 'Đang xử lý', badge: 'bg-info text-dark' },
    READY_FOR_APPROVAL: { label: 'Chờ phê duyệt', badge: 'bg-warning text-dark' },
    APPROVED: { label: 'Đã phê duyệt', badge: 'bg-success' },
    CLOSED: { label: 'Đã chốt', badge: 'bg-dark' }
}

const statusOptions = Object.entries(STATUS_MAP).map(([value, meta]) => ({ value, label: meta.label }))

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
const regenerateModalElement = ref(null)
const regenerateBsModal = ref(null)
const regenerateConfirmModal = ref(false)

const filteredSummaries = computed(() => {
    if (!summarySearch.value) return summaries.value
    const keyword = summarySearch.value.trim().toLowerCase()
    return summaries.value.filter((item) => {
        const username = item.username?.toLowerCase() || ''
        const fullName = item.fullName?.toLowerCase() || ''
        return username.includes(keyword) || fullName.includes(keyword)
    })
})

const totalNetPayroll = computed(() => filteredSummaries.value.reduce((acc, item) => acc + Number(item.totalNetPayroll || 0), 0))

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
        const data = await listPayrollSummaries({ cycleId: selectedCycleId.value })
        summaries.value = Array.isArray(data) ? data : []
    } catch (err) {
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
        toast.error(err.response?.data?.message || 'Không thể lưu chu kỳ lương.')
    } finally {
        formSubmitting.value = false
    }
}

const handleRegenerate = () => {
    if (!selectedCycleId.value) return
    if (!canRegenerate.value) {
        toast.warning('Chu kỳ lương đã chốt nên không thể đồng bộ lại dữ liệu.')
        return
    }
    regenerateBsModal.value?.show()
}

const closeRegenerateModal = () => {
    regenerateBsModal.value?.hide()
}

const confirmRegenerate = async () => {
    if (!selectedCycleId.value) return
    closeRegenerateModal()
    summariesLoading.value = true
    try {
        await regeneratePayrollSummaries(selectedCycleId.value)
        toast.success('Đã đồng bộ dữ liệu lương.')
        await fetchSummaries()
    } catch (err) {
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

onMounted(() => {
    if (regenerateModalElement.value) {
        regenerateBsModal.value = new Modal(regenerateModalElement.value)
    }
    fetchCycles()
})

onUnmounted(() => {
    regenerateBsModal.value?.dispose()
})
</script>

<style scoped lang="scss">
.payroll-page {
    padding-bottom: var(--spacing-12);
}

.payroll-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.payroll-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.payroll-header__title-section {
    flex: 1;
    min-width: 0;
}

.payroll-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.payroll-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.payroll-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.payroll-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.payroll-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.payroll-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.payroll-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.payroll-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card,
.cycles-card,
.cycle-detail {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.cycles-card :global(.card-body),
.cycle-detail :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.cycles-card :global(.table) {
    margin-bottom: 0;
}

.cycles-card :global(.table thead),
.cycles-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.cycles-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.cycles-card :global(.table tbody td),
.cycles-card :global(.table tbody th) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.cycles-card :global(.table tbody tr:last-child td),
.cycles-card :global(.table tbody tr:last-child th) {
    border-bottom: none;
}

.cycles-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.cycles-card :global(.table tbody tr.table-active) {
    background: var(--color-primary-soft);
}

.cycles-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.cycles-card :global(.badge) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    min-width: 120px;
    text-align: center;
    display: inline-block;
    border: 2px solid transparent;
}

.cycles-card :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border-color: var(--color-border);
}

.cycles-card :global(.badge.bg-info) {
    background: var(--color-info-soft, #d1ecf1);
    color: var(--color-info-dark, #0c5460);
    border-color: var(--color-info, #0dcaf0);
}

.cycles-card :global(.badge.bg-warning) {
    background: var(--color-warning-soft, #fff3cd);
    color: var(--color-warning-dark, #856404);
    border-color: var(--color-warning, #ffc107);
}

.cycles-card :global(.badge.bg-success) {
    background: var(--color-success-soft, #d1e7dd);
    color: var(--color-success-dark, #0f5132);
    border-color: var(--color-success, #198754);
}

.cycles-card :global(.badge.bg-dark) {
    background: var(--color-heading);
    color: var(--color-text-inverse);
    border-color: var(--color-heading);
}

.cycles-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-1);
    justify-content: flex-end;
    align-items: center;
}

.action-buttons .btn-sm {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.action-buttons .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.action-buttons .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.cycle-detail :global(h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    font-family: var(--font-family-sans);
}

.cycle-detail :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.cycle-detail :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.cycle-detail :global(.btn-outline-success) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.cycle-detail :global(.btn-outline-success:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.cycle-detail :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.cycle-detail :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.cycle-status-display {
    margin-top: var(--spacing-1);
}

.cycle-status-display :global(.badge) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    min-width: 120px;
    text-align: center;
    display: inline-block;
    border: 2px solid transparent;
}

.cycle-status-display :global(.badge.bg-secondary) {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border-color: var(--color-border);
}

.cycle-status-display :global(.badge.bg-info) {
    background: var(--color-info-soft, #d1ecf1);
    color: var(--color-info-dark, #0c5460);
    border-color: var(--color-info, #0dcaf0);
}

.cycle-status-display :global(.badge.bg-warning) {
    background: var(--color-warning-soft, #fff3cd);
    color: var(--color-warning-dark, #856404);
    border-color: var(--color-warning, #ffc107);
}

.cycle-status-display :global(.badge.bg-success) {
    background: var(--color-success-soft, #d1e7dd);
    color: var(--color-success-dark, #0f5132);
    border-color: var(--color-success, #198754);
}

.cycle-status-display :global(.badge.bg-dark) {
    background: var(--color-heading);
    color: var(--color-text-inverse);
    border-color: var(--color-heading);
}

.payroll-regenerate-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.payroll-regenerate-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.payroll-regenerate-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.payroll-regenerate-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.payroll-regenerate-modal :global(.modal-body p) {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
}

.payroll-regenerate-modal :global(.alert-info) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-heading);
    padding: var(--spacing-3);
}

.payroll-regenerate-modal :global(.alert-info strong) {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.payroll-regenerate-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.payroll-regenerate-modal :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.payroll-regenerate-modal :global(.modal-footer .btn-success) {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-text-inverse);
}

.payroll-regenerate-modal :global(.modal-footer .btn-success:hover:not(:disabled)) {
    background: var(--color-success-dark, #198754);
}

.payroll-regenerate-modal :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.payroll-regenerate-modal :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.summary-search-input :global(.input-group-text) {
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.summary-search-input :global(.form-control) {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.summary-search-input :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.summary-total-badge {
    background: var(--color-card-muted);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-total-badge .fw-semibold {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

@media (max-width: 768px) {
    .payroll-header {
        padding: var(--spacing-3);
    }

    .payroll-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .payroll-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .payroll-header__actions .btn {
        flex: 1;
    }

    .action-buttons {
        flex-direction: column;
        width: 100%;
    }

    .action-buttons .btn {
        width: 100%;
    }
}
</style>
