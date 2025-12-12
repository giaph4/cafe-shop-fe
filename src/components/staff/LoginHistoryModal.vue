<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title">
                Lịch sử đăng nhập
              </h5>
              <p class="text-muted mb-0">
                Theo dõi các lần đăng nhập của nhân viên.
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              @click="hide"
            />
          </div>

          <div class="modal-body">
            <div class="filter-bar d-flex flex-wrap gap-3 align-items-end mb-3">
              <div>
                <label class="form-label">Kết quả</label>
                <select
                  v-model="filters.success"
                  class="form-select form-select-sm"
                  :disabled="loading"
                >
                  <option value="">
                    Tất cả
                  </option>
                  <option value="true">
                    Thành công
                  </option>
                  <option value="false">
                    Thất bại
                  </option>
                </select>
              </div>
              <div>
                <label class="form-label">Từ ngày</label>
                <input
                  v-model="filters.startDate"
                  type="datetime-local"
                  class="form-control form-control-sm"
                  :disabled="loading"
                >
              </div>
              <div>
                <label class="form-label">Đến ngày</label>
                <input
                  v-model="filters.endDate"
                  type="datetime-local"
                  class="form-control form-control-sm"
                  :disabled="loading"
                >
              </div>
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="loading"
                  @click="resetFilters"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="loading"
                  @click="fetchHistory"
                >
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-1"
                  />
                  Áp dụng
                </button>
              </div>
            </div>

            <div
              v-if="loading"
              class="text-center py-4"
            >
              <div class="spinner-border text-primary" />
            </div>
            <div
              v-else-if="error"
              class="alert alert-warning"
            >
              {{ error }}
            </div>
            <div
              v-else-if="!history.length"
              class="text-muted text-center py-4"
            >
              Chưa có dữ liệu đăng nhập.
            </div>
            <div
              v-else
              class="table-responsive"
            >
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Thời gian</th>
                    <th>IP</th>
                    <th>Thiết bị</th>
                    <th>Kết quả</th>
                    <th>Thông điệp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="entry in history"
                    :key="entry.id"
                  >
                    <td>{{ formatDateTime(entry.loginAt) }}</td>
                    <td>{{ entry.ipAddress || '—' }}</td>
                    <td>{{ entry.userAgent || '—' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="entry.success ? 'bg-success' : 'bg-danger'"
                      >
                        {{ entry.success ? 'Thành công' : 'Thất bại' }}
                      </span>
                    </td>
                    <td>{{ entry.message || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="modal-footer justify-content-between">
            <div class="text-muted small">
              Trang {{ page.number + 1 }} / {{ page.totalPages || 1 }}
            </div>
            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-outline-secondary"
                :disabled="loading || page.number === 0"
                @click="changePage(page.number - 1)"
              >
                Trước
              </button>
              <button
                class="btn btn-outline-secondary"
                :disabled="loading || page.number + 1 >= page.totalPages"
                @click="changePage(page.number + 1)"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { formatDateTime } from '@/utils/formatters'
import { getLoginHistory } from '@/api/loginHistoryService'
import logger from '@/utils/logger'

const props = defineProps({
    username: { type: String, default: '' }
})

defineEmits(['close'])

const modal = ref(null)
let modalInstance = null

const loading = ref(false)
const error = ref('')
const history = ref([])
const page = reactive({ number: 0, totalPages: 0, size: 20 })

const filters = reactive({
    success: '',
    startDate: '',
    endDate: ''
})

const resetFilters = () => {
    filters.success = ''
    filters.startDate = ''
    filters.endDate = ''
}

const buildParams = () => {
    const params = {
        page: page.number,
        size: page.size,
        username: props.username
    }
    if (filters.success !== '') {
        params.success = filters.success === 'true'
    }
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    return params
}

const fetchHistory = async () => {
    if (!props.username) {
        toast.warning('Chưa xác định username để truy vấn log đăng nhập.')
        return
    }
    loading.value = true
    error.value = ''
    try {
        const data = await getLoginHistory(buildParams())
        history.value = data?.content || []
        page.number = data?.number ?? 0
        page.totalPages = data?.totalPages ?? 0
        page.size = data?.size ?? 20
    } catch (err) {
        logger.error('Failed to load login history:', err)
        error.value = err.response?.data?.message || 'Không thể tải lịch sử đăng nhập.'
        history.value = []
    } finally {
        loading.value = false
    }
}

const changePage = (newPage) => {
    if (newPage < 0 || (page.totalPages && newPage >= page.totalPages)) return
    page.number = newPage
    fetchHistory()
}

const show = async () => {
    page.number = 0
    await fetchHistory()
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
}

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
.filter-bar {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    background: var(--color-card-muted);
}

:deep(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-header .modal-title) {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xl);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

:deep(.modal-header .text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

:deep(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

:deep(.modal-body .form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control),
:deep(.modal-body .form-select) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .form-control:focus),
:deep(.modal-body .form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

:deep(.modal-body .table) {
    margin-bottom: 0;
}

:deep(.modal-body .table thead),
:deep(.modal-body .table thead.table-light) {
    background: var(--color-card-muted);
}

:deep(.modal-body .table thead th) {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .table tbody tr:last-child td) {
    border-bottom: none;
}

:deep(.modal-body .table tbody tr:hover) {
    background: var(--color-card-muted);
}

:deep(.modal-body .badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .badge.bg-success) {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

:deep(.modal-body .badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

:deep(.modal-body .alert-warning) {
    background: var(--color-soft-amber);
    border: 1px solid var(--color-warning);
    color: var(--color-warning);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

:deep(.modal-body .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-body .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

:deep(.modal-body .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:deep(.modal-body .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

:deep(.modal-footer .btn) {
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

:deep(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

:deep(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

:deep(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

:deep(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}
</style>
