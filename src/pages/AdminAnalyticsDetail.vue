<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Chi tiết Phân tích AI</h2>
                <p class="page-subtitle">Xem chi tiết phân tích #{{ analyticsId }}</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <router-link to="/admin-analytics" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left me-2"></i>
                    Quay lại
                </router-link>
            </div>
        </div>

        <div v-if="loading" class="card">
            <div class="card-body text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 text-muted">Đang tải dữ liệu...</p>
            </div>
        </div>

        <div v-else-if="error" class="card">
            <div class="card-body">
                <div class="alert alert-danger mb-0">
                    {{ error }}
                </div>
            </div>
        </div>

        <div v-else-if="analytics" class="card">
            <div class="card-body">
                <div class="row g-4">
                    <div class="col-md-6">
                        <h5 class="mb-3">Thông tin cơ bản</h5>
                        <table class="table table-borderless">
                            <tr>
                                <th width="40%">ID Phân tích:</th>
                                <td>#{{ analytics.id }}</td>
                            </tr>
                            <tr>
                                <th>Loại phân tích:</th>
                                <td>{{ analytics.type || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Tiêu đề:</th>
                                <td>{{ analytics.title || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Ngày tạo:</th>
                                <td>{{ formatDateTime(analytics.createdAt) || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Trạng thái:</th>
                                <td>
                                    <span :class="['badge', getStatusClass(analytics.status)]">
                                        {{ getStatusLabel(analytics.status) }}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5 class="mb-3">Kết quả phân tích</h5>
                        <div v-if="analytics.results" class="border rounded p-3 bg-light">
                            <pre class="mb-0" style="white-space: pre-wrap; font-size: 0.9rem;">{{ formatResults(analytics.results) }}</pre>
                        </div>
                        <div v-else class="text-muted">
                            Chưa có kết quả phân tích
                        </div>
                    </div>
                </div>

                <div v-if="analytics.insights && analytics.insights.length > 0" class="mt-4">
                    <h5 class="mb-3">Insights</h5>
                    <div class="list-group">
                        <div 
                            v-for="(insight, index) in analytics.insights" 
                            :key="index"
                            class="list-group-item"
                        >
                            <div class="d-flex align-items-start">
                                <i class="bi bi-lightbulb text-warning me-2 mt-1"></i>
                                <div>
                                    <strong>{{ insight.title || `Insight ${index + 1}` }}</strong>
                                    <p class="mb-0 mt-1">{{ insight.description || insight }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="analytics.recommendations && analytics.recommendations.length > 0" class="mt-4">
                    <h5 class="mb-3">Khuyến nghị</h5>
                    <div class="list-group">
                        <div 
                            v-for="(recommendation, index) in analytics.recommendations" 
                            :key="index"
                            class="list-group-item"
                        >
                            <div class="d-flex align-items-start">
                                <i class="bi bi-check-circle text-success me-2 mt-1"></i>
                                <div>
                                    <strong>{{ recommendation.title || `Khuyến nghị ${index + 1}` }}</strong>
                                    <p class="mb-0 mt-1">{{ recommendation.description || recommendation }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="card">
            <div class="card-body text-center py-5">
                <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                <p class="text-muted">Không tìm thấy phân tích với ID này.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const route = useRoute()
const analyticsId = route.params.id

const analytics = ref(null)
const loading = ref(true)
const error = ref(null)

const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'PROCESSING') return 'bg-warning'
    if (status === 'FAILED') return 'bg-danger'
    return 'bg-secondary'
}

const getStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'PROCESSING') return 'Đang xử lý'
    if (status === 'FAILED') return 'Thất bại'
    return 'Chưa xác định'
}

const formatResults = (results) => {
    if (typeof results === 'string') return results
    if (typeof results === 'object') return JSON.stringify(results, null, 2)
    return String(results)
}

onMounted(async () => {
    loading.value = true
    error.value = null

    try {
        // Backend endpoint chưa có sẵn, hiển thị thông báo
        error.value = 'Chức năng này cần hỗ trợ từ backend. Vui lòng liên hệ quản trị viên.'
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tải chi tiết phân tích.'
        logger.error('Failed to load admin analytics detail:', err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.table th {
    color: #6c757d;
    font-weight: 500;
}
</style>

