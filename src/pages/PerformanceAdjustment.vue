<template>
    <div class="performance-adjustment-page container-fluid">
        <div class="performance-adjustment-header">
            <div class="performance-adjustment-header__content">
                <div class="performance-adjustment-header__title-section">
                    <h2 class="performance-adjustment-header__title">Quản lý Điều chỉnh Hiệu suất</h2>
                    <p class="performance-adjustment-header__subtitle">Thưởng và phạt nhân viên dựa trên hiệu suất làm việc trong ca.</p>
                </div>
                <div class="performance-adjustment-header__actions">
                    <button 
                        class="btn btn-primary" 
                        type="button" 
                        @click="openCreateModal" 
                        v-if="activeTab === 'list'"
                    >
                        <i class="bi bi-plus-lg me-2"></i>
                        Tạo điều chỉnh mới
                    </button>
                    <button 
                        class="btn btn-outline-secondary" 
                        type="button" 
                        @click="fetchData" 
                        :disabled="loading"
                    >
                        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                </div>
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
                <LoadingState v-if="loading && activeTab === 'list'" />
                <ErrorState 
                    v-else-if="error && activeTab === 'list'" 
                    :message="error"
                    @retry="fetchData"
                />
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

        <Teleport to="body">
            <PerformanceAdjustmentFormModal
                ref="formModal"
                :adjustment="editingAdjustment"
                :assignment-options="assignmentOptions"
                :type-options="ADJUSTMENT_TYPES"
                :submitting="formSubmitting"
                @submit="handleFormSubmit"
            />

            <!-- Revoke Adjustment Confirmation Modal -->
            <div 
                class="modal fade" 
                id="revokeAdjustmentModal" 
                tabindex="-1" 
                ref="revokeAdjustmentModalElement" 
                aria-labelledby="revokeAdjustmentModalLabel"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="revokeAdjustmentModalLabel">Thu hồi điều chỉnh</h5>
                            <button type="button" class="btn-close" @click="revokeAdjustmentBsModal?.hide()" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Nhập lý do thu hồi điều chỉnh này:</p>
                            <div v-if="adjustmentToRevoke" class="card mt-3 mb-3">
                                <div class="card-body">
                                    <p class="mb-2"><strong>Loại:</strong> {{ adjustmentToRevoke.type === 'BONUS' ? 'Thưởng' : 'Phạt' }}</p>
                                    <p class="mb-2"><strong>Số tiền:</strong> {{ formatCurrency(adjustmentToRevoke.amount) }}</p>
                                    <p class="mb-0"><strong>Lý do:</strong> {{ adjustmentToRevoke.reason || 'N/A' }}</p>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Lý do thu hồi</label>
                                <textarea 
                                    class="form-control" 
                                    rows="3" 
                                    v-model="revokeReason"
                                    placeholder="Nhập lý do thu hồi..."
                                    maxlength="500"
                                ></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="revokeAdjustmentBsModal?.hide()">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-warning" @click="confirmRevokeAdjustment">
                                Thu hồi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Adjustment Confirmation Modal -->
            <div 
                class="modal fade" 
                id="deleteAdjustmentModal" 
                tabindex="-1" 
                ref="deleteAdjustmentModalElement" 
                aria-labelledby="deleteAdjustmentModalLabel"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="deleteAdjustmentModalLabel">Xác nhận xóa</h5>
                            <button type="button" class="btn-close" @click="deleteAdjustmentBsModal?.hide()" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Bạn có chắc chắn muốn xóa điều chỉnh này không?</p>
                            <div class="alert alert-warning mt-3">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Hành động này không thể hoàn tác.
                            </div>
                            <div v-if="adjustmentToDelete" class="card mt-3">
                                <div class="card-body">
                                    <p class="mb-2"><strong>Loại:</strong> {{ adjustmentToDelete.type === 'BONUS' ? 'Thưởng' : 'Phạt' }}</p>
                                    <p class="mb-2"><strong>Số tiền:</strong> {{ formatCurrency(adjustmentToDelete.amount) }}</p>
                                    <p class="mb-0"><strong>Lý do:</strong> {{ adjustmentToDelete.reason || 'N/A' }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="deleteAdjustmentBsModal?.hide()">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-danger" @click="confirmDeleteAdjustment">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { Teleport } from 'vue'
import { Modal } from 'bootstrap'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
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
import { formatCurrency, formatDate } from '@/utils/formatters'

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
const revokeAdjustmentModalElement = ref(null)
const revokeAdjustmentBsModal = ref(null)
const deleteAdjustmentModalElement = ref(null)
const deleteAdjustmentBsModal = ref(null)
const adjustmentToRevoke = ref(null)
const adjustmentToDelete = ref(null)
const revokeReason = ref('')

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

const handleRevoke = (adjustment) => {
    if (adjustment.revoked) {
        toast.warning('Điều chỉnh này đã được thu hồi.')
        return
    }
    adjustmentToRevoke.value = adjustment
    revokeReason.value = ''
    revokeAdjustmentBsModal.value?.show()
}

const confirmRevokeAdjustment = async () => {
    if (!adjustmentToRevoke.value) return
    const adjustment = adjustmentToRevoke.value
    revokeAdjustmentBsModal.value?.hide()
    try {
        await revokeAdjustment(adjustment.id, { reason: revokeReason.value || null })
        toast.success('Đã thu hồi điều chỉnh.')
        await fetchAdjustments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể thu hồi điều chỉnh.')
    } finally {
        adjustmentToRevoke.value = null
        revokeReason.value = ''
    }
}

const handleRemove = (adjustment) => {
    adjustmentToDelete.value = adjustment
    deleteAdjustmentBsModal.value?.show()
}

const confirmDeleteAdjustment = async () => {
    if (!adjustmentToDelete.value) return
    const adjustment = adjustmentToDelete.value
    deleteAdjustmentBsModal.value?.hide()
    try {
        await deleteAdjustment(adjustment.id)
        toast.success('Đã xóa điều chỉnh.')
        await fetchAdjustments()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể xóa điều chỉnh.')
    } finally {
        adjustmentToDelete.value = null
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
    if (revokeAdjustmentModalElement.value) {
        revokeAdjustmentBsModal.value = new Modal(revokeAdjustmentModalElement.value)
    }
    if (deleteAdjustmentModalElement.value) {
        deleteAdjustmentBsModal.value = new Modal(deleteAdjustmentModalElement.value)
    }
    fetchAssignmentOptions()
})
</script>

<style scoped lang="scss">
.performance-adjustment-page {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding-bottom: var(--spacing-12);
}

.performance-adjustment-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.performance-adjustment-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.performance-adjustment-header__title-section {
    flex: 1;
    min-width: 0;
}

.performance-adjustment-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin-bottom: var(--spacing-1);
}

.performance-adjustment-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.performance-adjustment-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.tabs-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-5);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    transition: all var(--transition-base);
}

.reports-tabs .nav-link:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
}

.reports-tabs .nav-link.active {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    color: var(--color-white);
}

@media (max-width: 768px) {
    .performance-adjustment-header {
        padding: var(--spacing-4);
    }

    .performance-adjustment-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .performance-adjustment-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>


