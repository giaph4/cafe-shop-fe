<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Chi tiết Báo cáo Ca làm</h2>
                <p class="page-subtitle">Xem chi tiết báo cáo ca làm #{{ reportId }}</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <router-link to="/shift-report" class="btn btn-outline-secondary">
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

        <div v-else-if="report" class="card">
            <div class="card-body">
                <div class="row g-4">
                    <div class="col-md-6">
                        <h5 class="mb-3">Thông tin cơ bản</h5>
                        <table class="table table-borderless">
                            <tr>
                                <th width="40%">ID Báo cáo:</th>
                                <td>#{{ report.id }}</td>
                            </tr>
                            <tr>
                                <th>Ca làm việc:</th>
                                <td>{{ report.workShiftName || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Nhân viên:</th>
                                <td>{{ report.staffName || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Ngày bắt đầu:</th>
                                <td>{{ formatDateTime(report.startTime) || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Ngày kết thúc:</th>
                                <td>{{ formatDateTime(report.endTime) || 'N/A' }}</td>
                            </tr>
                            <tr>
                                <th>Trạng thái:</th>
                                <td>
                                    <span :class="['badge', getStatusClass(report.status)]">
                                        {{ getStatusLabel(report.status) }}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5 class="mb-3">Thống kê</h5>
                        <table class="table table-borderless">
                            <tr>
                                <th width="40%">Tổng đơn hàng:</th>
                                <td class="fw-semibold">{{ report.totalOrders || 0 }}</td>
                            </tr>
                            <tr>
                                <th>Tổng doanh thu:</th>
                                <td class="fw-semibold text-success">{{ formatCurrency(report.totalRevenue || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Tổng chi phí:</th>
                                <td class="fw-semibold text-danger">{{ formatCurrency(report.totalCost || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Lợi nhuận:</th>
                                <td class="fw-semibold text-primary">{{ formatCurrency(report.totalProfit || 0) }}</td>
                            </tr>
                            <tr>
                                <th>Thời gian làm việc:</th>
                                <td>{{ formatDuration(report.duration) || 'N/A' }}</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div v-if="report.notes" class="mt-4">
                    <h5 class="mb-3">Ghi chú</h5>
                    <div class="alert alert-info mb-0">
                        {{ report.notes }}
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="card">
            <div class="card-body text-center py-5">
                <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                <p class="text-muted">Không tìm thấy báo cáo với ID này.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const route = useRoute()
const reportId = route.params.id

const report = ref(null)
const loading = ref(true)
const error = ref(null)

const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'CANCELLED') return 'bg-danger'
    return 'bg-warning'
}

const getStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Hoàn thành'
    if (status === 'CANCELLED') return 'Đã hủy'
    return 'Đang xử lý'
}

const formatDuration = (seconds) => {
    if (!seconds || typeof seconds !== 'number') return null
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

onMounted(async () => {
    loading.value = true
    error.value = null

    try {
        // Backend endpoint chưa có sẵn, hiển thị thông báo
        error.value = 'Chức năng này cần hỗ trợ từ backend. Vui lòng liên hệ quản trị viên.'
    } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Không thể tải chi tiết báo cáo.'
        logger.error('Failed to load shift report detail:', err)
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

