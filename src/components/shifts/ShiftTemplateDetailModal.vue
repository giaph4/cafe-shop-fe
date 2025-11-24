<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header align-items-start">
                        <div>
                            <h5 class="modal-title">Chi tiết Ca mẫu</h5>
                            <p class="text-muted mb-0">
                                Cập nhật lần cuối: {{ formatDate(template?.updatedAt) || '—' }}
                            </p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>

                    <div class="modal-body modal-body-scroll">
                        <div v-if="!template" class="detail-state text-muted">
                            Không có dữ liệu để hiển thị.
                        </div>
                        <div v-else class="detail-content">
                            <div class="info-section">
                                <h6 class="section-title">Thông tin cơ bản</h6>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Tên ca mẫu</span>
                                        <strong class="info-value">{{ template.name || '—' }}</strong>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">ID</span>
                                        <span class="info-value">{{ template.id || '—' }}</span>
                                    </div>
                                    <div class="info-item" v-if="template.description">
                                        <span class="info-label">Mô tả</span>
                                        <p class="info-value mb-0">{{ template.description }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <h6 class="section-title">Giờ làm việc</h6>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Giờ bắt đầu</span>
                                        <strong class="info-value text-primary">
                                            {{ formatTime(template.startTime) }}
                                        </strong>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Giờ kết thúc</span>
                                        <strong class="info-value text-primary">
                                            {{ formatTime(template.endTime) }}
                                        </strong>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Thời lượng</span>
                                        <strong class="info-value text-success">
                                            {{ calculateDuration(template.startTime, template.endTime) }} giờ
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section" v-if="template.requiredRoles?.length">
                                <h6 class="section-title">Vai trò yêu cầu</h6>
                                <div class="d-flex flex-wrap gap-2">
                                    <span
                                        class="badge bg-primary-subtle text-primary px-3 py-2"
                                        v-for="role in template.requiredRoles"
                                        :key="role"
                                    >
                                        {{ formatRole(role) }}
                                    </span>
                                </div>
                            </div>

                            <div class="info-section" v-if="template.defaultHourlyRate || template.defaultFixedAllowance">
                                <h6 class="section-title">Lương và Phụ cấp</h6>
                                <div class="info-grid">
                                    <div class="info-item" v-if="template.defaultHourlyRate">
                                        <span class="info-label">Lương theo giờ</span>
                                        <strong class="info-value text-success">
                                            {{ formatCurrency(template.defaultHourlyRate) }} / giờ
                                        </strong>
                                    </div>
                                    <div class="info-item" v-if="template.defaultFixedAllowance">
                                        <span class="info-label">Phụ cấp cố định</span>
                                        <strong class="info-value text-info">
                                            {{ formatCurrency(template.defaultFixedAllowance) }}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <h6 class="section-title">Thông tin hệ thống</h6>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Ngày tạo</span>
                                        <span class="info-value">{{ formatDateTime(template.createdAt) || '—' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Cập nhật lần cuối</span>
                                        <span class="info-value">{{ formatDateTime(template.updatedAt) || '—' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { formatDateTime, formatCurrency } from '@/utils/formatters'

const props = defineProps({
    template: {
        type: Object,
        default: null
    }
})

const modal = ref(null)
let modalInstance = null

const formatDate = (value) => (value ? formatDateTime(value) : '')

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.length === 5 ? time : time.slice(0, 5)
}

const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '0'
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const start = startHour * 60 + startMin
    const end = endHour * 60 + endMin
    const duration = end - start
    if (duration < 0) return '0'
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}.${Math.round((minutes / 60) * 10)}` : hours.toString()
}

const formatRole = (role) => {
    const roleMap = {
        ROLE_ADMIN: 'Admin',
        ROLE_MANAGER: 'Quản lý',
        ROLE_STAFF: 'Nhân viên'
    }
    return roleMap[role] || role
}


const show = () => {
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
}

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: true })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
.detail-state {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-section {
    border-top: 1px solid var(--color-border);
    padding-top: 1.25rem;
}

.info-section:first-child {
    border-top: none;
    padding-top: 0;
}

.section-title {
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 1rem;
    font-size: 1rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--color-text-subtle);
    letter-spacing: 0.06em;
    font-weight: 600;
}

.info-value {
    font-size: 1rem;
    color: var(--color-heading);
    font-weight: 500;
}
</style>

