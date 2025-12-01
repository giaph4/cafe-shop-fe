<template>
    <div class="page-container container-fluid login-history-page" data-aos="fade-up">
        <div class="login-history-header">
            <div class="login-history-header__content">
                <div class="login-history-header__title-section">
                    <h2 class="page-title">Lịch sử đăng nhập</h2>
                    <p class="page-subtitle">Theo dõi và quản lý lịch sử đăng nhập của tất cả người dùng trong hệ thống.</p>
                </div>
                <div class="login-history-header__actions">
                    <button class="btn btn-outline-secondary" type="button" @click="fetchHistory" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
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
                            type="text"
                            class="form-control"
                            v-model="filters.username"
                            placeholder="Nhập username"
                        />
                    </div>
                    <div class="col-lg-2 col-md-4">
                        <label class="form-label">Kết quả</label>
                        <select class="form-select" v-model="filters.success">
                            <option value="">Tất cả</option>
                            <option value="true">Thành công</option>
                            <option value="false">Thất bại</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Từ ngày</label>
                        <input
                            type="datetime-local"
                            class="form-control"
                            v-model="filters.startDate"
                        />
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Đến ngày</label>
                        <input
                            type="datetime-local"
                            class="form-control"
                            v-model="filters.endDate"
                        />
                    </div>
                    <div class="col-lg-1 col-md-12">
                        <button class="btn btn-primary w-100" type="button" @click="applyFilters" :disabled="loading">
                            <i class="bi bi-search"></i>
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
                                <tr v-for="entry in history" :key="entry.id">
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
                                        <span class="badge" :class="entry.success ? 'bg-success' : 'bg-danger'">
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
                                <li class="page-item" :class="{ disabled: page.number === 0 }">
                                    <button class="page-link" @click="changePage(page.number - 1)" :disabled="page.number === 0">
                                        Trước
                                    </button>
                                </li>
                                <li class="page-item" v-for="pageNum in visiblePages" :key="pageNum" :class="{ active: pageNum === page.number + 1 }">
                                    <button class="page-link" @click="changePage(pageNum - 1)">{{ pageNum }}</button>
                                </li>
                                <li class="page-item" :class="{ disabled: page.number + 1 >= page.totalPages }">
                                    <button class="page-link" @click="changePage(page.number + 1)" :disabled="page.number + 1 >= page.totalPages">
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
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.login-history-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.login-history-header__title-section {
    flex: 1;
    min-width: 0;
}

.login-history-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
}

.page-subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.filter-card,
.table-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.table {
    margin-bottom: 0;
}

.table thead th {
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wide);
    border-bottom: 2px solid var(--color-border);
}

.table tbody tr {
    transition: background-color var(--transition-base);
}

.table tbody tr:hover {
    background-color: var(--color-card-muted);
}

.pagination .page-item.active .page-link {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.pagination .page-link {
    color: var(--color-heading);
    border-color: var(--color-border);
    transition: all var(--transition-base);
}

.pagination .page-link:hover {
    background-color: var(--color-primary-soft);
    border-color: var(--color-primary);
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

