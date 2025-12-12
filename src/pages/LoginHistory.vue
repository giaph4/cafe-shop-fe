<template>
  <div
    class="page-container container-fluid login-history-page"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="login-history-header">
      <div class="login-history-header__content">
        <div class="login-history-header__title-section">
          <h2 class="page-title">
            Lịch sử đăng nhập
          </h2>
          <p class="page-subtitle">
            Theo dõi và quản lý lịch sử đăng nhập của tất cả người dùng trong hệ thống.
          </p>
        </div>
        <div class="login-history-header__actions">
          <button
            class="btn btn-outline-secondary"
            type="button"
            :disabled="loading"
            @click="fetchHistory"
          >
            <span
              v-if="loading"
              class="spinner-border spinner-border-sm me-2"
            />
            <i
              v-else
              class="bi bi-arrow-clockwise me-2"
            />
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <div class="card filter-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Tên người dùng</label>
            <input
              v-model="filters.username"
              type="text"
              class="form-control"
              placeholder="Nhập username"
            >
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="form-label">Kết quả</label>
            <select
              v-model="filters.success"
              class="form-select"
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
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Từ ngày</label>
            <input
              v-model="filters.startDate"
              type="datetime-local"
              class="form-control"
            >
          </div>
          <div class="col-lg-3 col-md-6">
            <label class="form-label">Đến ngày</label>
            <input
              v-model="filters.endDate"
              type="datetime-local"
              class="form-control"
            >
          </div>
          <div class="col-lg-1 col-md-12">
            <button
              class="btn btn-primary w-100"
              type="button"
              :disabled="loading"
              @click="applyFilters"
            >
              <i class="bi bi-search" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-body">
        <LoadingState v-if="loading" />
        <ErrorState
          v-else-if="error"
          :message="error"
          @retry="fetchHistory"
        />
        <EmptyState
          v-else-if="!history.length"
          title="Chưa có dữ liệu đăng nhập"
          message="Chưa có lịch sử đăng nhập nào được ghi nhận."
        />
        <div v-else>
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Thời gian</th>
                  <th>Username</th>
                  <th>IP Address</th>
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
                  <td>
                    <strong>{{ entry.username || '—' }}</strong>
                  </td>
                  <td>
                    <code class="text-muted">{{ entry.ipAddress || '—' }}</code>
                  </td>
                  <td>
                    <small class="text-muted">{{ entry.userAgent || '—' }}</small>
                  </td>
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

          <div class="d-flex justify-content-between align-items-center mt-4">
            <div class="text-muted">
              Hiển thị {{ (page.number * page.size) + 1 }} - {{ Math.min((page.number + 1) * page.size, page.totalElements) }}
              trong tổng số {{ page.totalElements }} bản ghi
            </div>
            <nav>
              <ul class="pagination mb-0">
                <li
                  class="page-item"
                  :class="{ disabled: page.number === 0 }"
                >
                  <button
                    class="page-link"
                    :disabled="page.number === 0"
                    @click="changePage(page.number - 1)"
                  >
                    Trước
                  </button>
                </li>
                <li
                  v-for="pageNum in visiblePages"
                  :key="pageNum"
                  class="page-item"
                  :class="{ active: pageNum === page.number + 1 }"
                >
                  <button
                    class="page-link"
                    @click="changePage(pageNum - 1)"
                  >
                    {{ pageNum }}
                  </button>
                </li>
                <li
                  class="page-item"
                  :class="{ disabled: page.number + 1 >= page.totalPages }"
                >
                  <button
                    class="page-link"
                    :disabled="page.number + 1 >= page.totalPages"
                    @click="changePage(page.number + 1)"
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { toast } from 'vue3-toastify'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatDateTime } from '@/utils/formatters'
import { getLoginHistory } from '@/api/loginHistoryService'

const loading = ref(false)
const error = ref('')
const history = ref([])
const page = reactive({
    number: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0
})

const filters = reactive({
    username: '',
    success: '',
    startDate: '',
    endDate: ''
})

const visiblePages = computed(() => {
    const pages = []
    const total = page.totalPages
    const current = page.number + 1

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i)
        }
    } else {
        if (current <= 3) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i)
            }
            pages.push('...')
            pages.push(total)
        } else if (current >= total - 2) {
            pages.push(1)
            pages.push('...')
            for (let i = total - 4; i <= total; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            pages.push('...')
            for (let i = current - 1; i <= current + 1; i++) {
                pages.push(i)
            }
            pages.push('...')
            pages.push(total)
        }
    }

    return pages
})

const buildParams = () => {
    const params = {
        page: page.number,
        size: page.size
    }

    if (filters.username) {
        params.username = filters.username
    }

    if (filters.success !== '') {
        params.success = filters.success === 'true'
    }

    if (filters.startDate) {
        params.startDate = filters.startDate
    }

    if (filters.endDate) {
        params.endDate = filters.endDate
    }

    return params
}

const fetchHistory = async () => {
    loading.value = true
    error.value = ''
    try {
        const data = await getLoginHistory(buildParams())
        history.value = data?.content || []
        page.number = data?.number ?? 0
        page.totalPages = data?.totalPages ?? 0
        page.size = data?.size ?? 20
        page.totalElements = data?.totalElements ?? 0
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải lịch sử đăng nhập.'
        history.value = []
    } finally {
        loading.value = false
    }
}

const applyFilters = () => {
    page.number = 0
    fetchHistory()
}

const changePage = (newPage) => {
    if (newPage < 0 || (page.totalPages && newPage >= page.totalPages)) return
    page.number = newPage
    fetchHistory()
}

onMounted(() => {
    fetchHistory()
})
</script>

<style scoped lang="scss">
.login-history-page {
    padding-bottom: var(--spacing-12);
}

.login-history-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.login-history-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.login-history-header__title-section {
    flex: 1;
    min-width: 0;
}

.login-history-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.login-history-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.login-history-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.login-history-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.page-subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.filter-card,
.table-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body),
.table-card :global(.card-body) {
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

.table-card :global(.table) {
    margin-bottom: 0;
}

.table-card :global(.table thead),
.table-card :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.table-card :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody td),
.table-card :global(.table tbody th) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td),
.table-card :global(.table tbody tr:last-child th) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(code) {
    color: var(--color-text-muted);
    font-family: var(--font-family-mono, monospace);
    font-size: var(--font-size-sm);
}

.table-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.table-card :global(.badge.bg-success) {
    background: var(--color-success-soft, #d1e7dd);
    color: var(--color-success-dark, #0f5132);
    border: 1px solid var(--color-success, #198754);
}

.table-card :global(.badge.bg-danger) {
    background: var(--color-soft-rose);
    color: var(--color-danger-dark, #a0281d);
    border: 1px solid var(--color-danger);
}

.table-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.table-card :global(.pagination) {
    margin-bottom: 0;
}

.table-card :global(.pagination .page-item.active .page-link) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.table-card :global(.pagination .page-link) {
    color: var(--color-heading);
    border-color: var(--color-border);
    background: var(--color-card);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
}

.table-card :global(.pagination .page-link:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.table-card :global(.pagination .page-item.disabled .page-link) {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-card-muted);
}

@media (max-width: 768px) {
    .login-history-header {
        padding: var(--spacing-4);
    }

    .login-history-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .login-history-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>

