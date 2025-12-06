<template>
    <div class="performance-adjustment-page container-fluid" style="background: var(--color-body-bg); padding: var(--spacing-4);">
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
                class="modal fade performance-adjustment-revoke-modal" 
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
                class="modal fade performance-adjustment-delete-modal" 
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
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.performance-adjustment-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.performance-adjustment-header__title-section {
    flex: 1;
    min-width: 0;
}

.performance-adjustment-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.performance-adjustment-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.performance-adjustment-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.performance-adjustment-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.performance-adjustment-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.performance-adjustment-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.performance-adjustment-header__actions .btn-outline-secondary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.performance-adjustment-header__actions .btn-outline-secondary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.tabs-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.tabs-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.reports-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-2);
    margin-bottom: var(--spacing-4);
}

.reports-tabs .nav-link {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: transparent;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.reports-tabs .nav-link:hover:not(.active) {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-heading);
}

.reports-tabs .nav-link.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

.performance-adjustment-revoke-modal :global(.modal-content),
.performance-adjustment-delete-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.performance-adjustment-revoke-modal :global(.modal-header),
.performance-adjustment-delete-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.performance-adjustment-revoke-modal :global(.modal-title),
.performance-adjustment-delete-modal :global(.modal-title) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.modal-body),
.performance-adjustment-delete-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.performance-adjustment-revoke-modal :global(.modal-body p),
.performance-adjustment-delete-modal :global(.modal-body p) {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
}

.performance-adjustment-revoke-modal :global(.modal-body .card),
.performance-adjustment-delete-modal :global(.modal-body .card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.performance-adjustment-revoke-modal :global(.modal-body .card-body),
.performance-adjustment-delete-modal :global(.modal-body .card-body) {
    padding: var(--spacing-3);
    background: var(--color-card-muted);
}

.performance-adjustment-revoke-modal :global(.modal-body strong),
.performance-adjustment-delete-modal :global(.modal-body strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.performance-adjustment-delete-modal :global(.alert-warning) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-warning);
    background: var(--color-soft-amber);
    color: var(--color-warning);
    padding: var(--spacing-3) var(--spacing-4);
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.modal-footer),
.performance-adjustment-delete-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.performance-adjustment-revoke-modal :global(.modal-footer .btn),
.performance-adjustment-delete-modal :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.performance-adjustment-revoke-modal :global(.modal-footer .btn-warning) {
    background: var(--color-warning);
    border-color: var(--color-warning);
    color: var(--color-text-inverse);
}

.performance-adjustment-revoke-modal :global(.modal-footer .btn-warning:hover:not(:disabled)) {
    background: var(--color-warning-dark, #d97706);
}

.performance-adjustment-delete-modal :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.performance-adjustment-delete-modal :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark, #a0281d);
}

.performance-adjustment-revoke-modal :global(.modal-footer .btn-outline-secondary),
.performance-adjustment-delete-modal :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.performance-adjustment-revoke-modal :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)),
.performance-adjustment-delete-modal :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

@media (max-width: 768px) {
    .performance-adjustment-header {
        padding: var(--spacing-3);
    }

    .performance-adjustment-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .performance-adjustment-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .performance-adjustment-header__actions .btn {
        flex: 1;
    }
}
</style>


