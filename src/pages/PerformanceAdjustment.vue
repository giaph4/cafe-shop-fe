<template>
    <div class="performance-adjustment-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý Điều chỉnh Hiệu suất</h2>
                <p class="page-subtitle">Thưởng và phạt nhân viên dựa trên hiệu suất làm việc trong ca.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-primary" type="button" @click="openCreateModal" v-if="activeTab === 'list'">
                    <i class="bi bi-plus-lg me-2"></i>Tạo điều chỉnh mới
                </button>
                <button class="btn btn-outline-secondary" type="button" @click="fetchData" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Làm mới
                </button>
            </div>
        </div>

        <div class="card tabs-card mb-4">
            <div class="card-body">
                <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
                    <li class="nav-item" v-for="tab in tabs" :key="tab.key" role="presentation">
                        <button
                            type="button"
                            class="nav-link"
                            :class="{ active: activeTab === tab.key }"
                            @click="activeTab = tab.key"
                        >
                            <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                        </button>
                    </li>
                </ul>
                <div v-if="loading && activeTab === 'list'" class="state-block py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error && activeTab === 'list'" class="state-block py-5">
                    <div class="alert alert-danger mb-0">{{ error }}</div>
                </div>
                <div v-else class="tab-content">
                    <PerformanceAdjustmentListTab
                        v-if="activeTab === 'list'"
                        :adjustments="adjustments"
                        :loading="loading"
                        :error="error"
                        :filters="filters"
                        :type-options="ADJUSTMENT_TYPES"
                        :assignment-options="assignmentOptions"
                        @filter="fetchAdjustments"
                        @reset-filters="resetFilters"
                        @edit="openEdit"
                        @revoke="handleRevoke"
                        @remove="handleRemove"
                    />
                    <PerformanceAdjustmentStatsTab
                        v-else-if="activeTab === 'statistics'"
                        :adjustments="adjustments"
                        :loading="loading"
                    />
                </div>
            </div>
        </div>

        <PerformanceAdjustmentFormModal
            ref="formModal"
            :adjustment="editingAdjustment"
            :assignment-options="assignmentOptions"
            :type-options="ADJUSTMENT_TYPES"
            :submitting="formSubmitting"
            @submit="handleFormSubmit"
        />
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import PerformanceAdjustmentListTab from '@/components/performance-adjustments/PerformanceAdjustmentListTab.vue'
import PerformanceAdjustmentStatsTab from '@/components/performance-adjustments/PerformanceAdjustmentStatsTab.vue'
import PerformanceAdjustmentFormModal from '@/components/performance-adjustments/PerformanceAdjustmentFormModal.vue'
import {
    ADJUSTMENT_TYPES,
    getAdjustmentsByAssignment,
    createAdjustment,
    revokeAdjustment,
    deleteAdjustment
} from '@/api/shiftService'
import { getAssignmentsForShift } from '@/api/shiftService'
import { listShiftInstances } from '@/api/shiftService'
import { toast } from 'vue3-toastify'
import { formatDate } from '@/utils/formatters'

const activeTab = ref('list')
const tabs = [
    { key: 'list', label: 'Danh sách điều chỉnh', icon: 'bi bi-list-ul' },
    { key: 'statistics', label: 'Thống kê', icon: 'bi bi-graph-up' }
]

const filters = reactive({
    assignmentId: null,
    type: '',
    revoked: null
})

const loading = ref(false)
const error = ref(null)
const adjustments = ref([])

const assignmentOptions = ref([])

const formModal = ref(null)
const editingAdjustment = ref(null)
const formSubmitting = ref(false)

const fetchAssignmentOptions = async () => {
    try {
        // Lấy các ca làm gần đây
        const shiftsData = await listShiftInstances({ page: 0, size: 50, sort: 'shiftDate,desc' })
        const shifts = shiftsData?.content || []
        
        // Lấy assignments từ các ca
        const allAssignments = []
        for (const shift of shifts.slice(0, 10)) {
            try {
                const assignments = await getAssignmentsForShift(shift.id)
                if (Array.isArray(assignments)) {
                    assignments.forEach(a => {
                        allAssignments.push({
                            value: a.id,
                            label: `${a.fullName || a.username} - Shift #${shift.id} (${formatDate(shift.shiftDate)})`
                        })
                    })
                }
            } catch (err) {
                // Bỏ qua lỗi khi fetch assignments cho shift đơn lẻ
            }
        }
        
        assignmentOptions.value = allAssignments
    } catch (err) {
        assignmentOptions.value = []
    }
}

const fetchAdjustments = async () => {
    if (!filters.assignmentId) {
        error.value = 'Vui lòng chọn phân công để xem điều chỉnh.'
        adjustments.value = []
        return
    }
    loading.value = true
    error.value = null
    try {
        const data = await getAdjustmentsByAssignment(filters.assignmentId)
        let fetched = Array.isArray(data) ? data : []
        
        // Filter by type if selected
        if (filters.type) {
            fetched = fetched.filter(a => a.type === filters.type)
        }
        
        // Filter by revoked status if selected
        if (filters.revoked !== null) {
            fetched = fetched.filter(a => a.revoked === filters.revoked)
        }
        
        // Sort by created date desc
        fetched.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0)
            const dateB = new Date(b.createdAt || 0)
            return dateB - dateA
        })
        
        adjustments.value = fetched
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải danh sách điều chỉnh.'
        adjustments.value = []
    } finally {
        loading.value = false
    }
}

const resetFilters = () => {
    filters.assignmentId = null
    filters.type = ''
    filters.revoked = null
    adjustments.value = []
}

const openCreateModal = () => {
    editingAdjustment.value = null
    formModal.value?.show()
}

const openEdit = (adjustment) => {
    // Adjustments thường không edit được, chỉ có thể revoke
    toast.info('Điều chỉnh không thể chỉnh sửa. Bạn có thể thu hồi và tạo mới.')
}

const handleFormSubmit = async (payload) => {
    formSubmitting.value = true
    try {
        await createAdjustment(payload)
        toast.success('Đã tạo điều chỉnh mới.')
        formModal.value?.hide()
        editingAdjustment.value = null
        await fetchAdjustments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể lưu điều chỉnh.')
    } finally {
        formSubmitting.value = false
    }
}

const handleRevoke = async (adjustment) => {
    if (adjustment.revoked) {
        toast.warning('Điều chỉnh này đã được thu hồi.')
        return
    }
    const reason = window.prompt('Nhập lý do thu hồi:', '')
    if (reason === null) return
    try {
        await revokeAdjustment(adjustment.id, { reason: reason || null })
        toast.success('Đã thu hồi điều chỉnh.')
        await fetchAdjustments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể thu hồi điều chỉnh.')
    }
}

const handleRemove = async (adjustment) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa điều chỉnh này?')
    if (!confirmed) return
    try {
        await deleteAdjustment(adjustment.id)
        toast.success('Đã xóa điều chỉnh.')
        await fetchAdjustments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể xóa điều chỉnh.')
    }
}

const fetchData = () => {
    if (activeTab.value === 'list') {
        fetchAdjustments()
    }
}

watch(activeTab, (newTab) => {
    if (newTab === 'list') {
        fetchAssignmentOptions()
    }
})

watch(() => filters.assignmentId, () => {
    if (filters.assignmentId) {
        fetchAdjustments()
    } else {
        adjustments.value = []
    }
})

onMounted(() => {
    fetchAssignmentOptions()
})
</script>

<style scoped>
.performance-adjustment-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding-bottom: 2rem;
}

.card-shadow {
    background: linear-gradient(120deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.08));
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
}

.tabs-card {
    border-radius: 18px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.reports-tabs .nav-link {
    border-radius: 999px;
    padding: 0.65rem 1.25rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: rgba(148, 163, 184, 0.12);
}

.reports-tabs .nav-link.active {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #fff;
}

.state-block {
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 768px) {
    .card-shadow {
        padding: 1.25rem;
    }
}
</style>

