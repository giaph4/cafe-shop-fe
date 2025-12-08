<template>
    <div class="smart-inventory-page page-container container-fluid" data-aos="fade-up">
        <PageHeader
            title="Quản lý tồn kho thông minh"
            subtitle="Cảnh báo và đề xuất đặt hàng tự động"
        >
            <template #actions>
                <button
                    class="btn-flat btn-flat--outline"
                    @click="handleRefresh"
                    :disabled="loading"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-arrow-clockwise me-2"></i>
                    Làm mới
                </button>
                <div class="form-check form-switch">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        id="includeStable"
                        v-model="includeStable"
                        @change="handleAnalyze"
                    >
                    <label class="form-check-label" for="includeStable">
                        Hiển thị ổn định
                    </label>
                </div>
            </template>
        </PageHeader>

        <LoadingState v-if="loading" text="Đang phân tích tồn kho..." />
        <ErrorState
            v-else-if="error"
            :message="error"
            @retry="handleAnalyze"
        />

        <div v-else-if="analysisData" class="inventory-content">
            <div class="row g-4 mb-4">
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--danger">
                        <div class="kpi-card__icon">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Nguy cấp</div>
                            <div class="kpi-card__value">{{ summary?.critical || 0 }}</div>
                            <div class="kpi-card__subtitle">Cần đặt hàng ngay</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--warning">
                        <div class="kpi-card__icon">
                            <i class="bi bi-exclamation-circle-fill"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Cảnh báo</div>
                            <div class="kpi-card__value">{{ summary?.warning || 0 }}</div>
                            <div class="kpi-card__subtitle">Cần chú ý</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--info">
                        <div class="kpi-card__icon">
                            <i class="bi bi-info-circle-fill"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Chú ý</div>
                            <div class="kpi-card__value">{{ summary?.info || 0 }}</div>
                            <div class="kpi-card__subtitle">Theo dõi</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--success">
                        <div class="kpi-card__icon">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Ổn định</div>
                            <div class="kpi-card__value">{{ summary?.stable || 0 }}</div>
                            <div class="kpi-card__subtitle">Đủ hàng</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card standard-card mb-4">
                <div class="card-header standard-card-header">
                    <h5 class="card-title">Danh sách nguyên liệu</h5>
                    <div class="d-flex gap-2">
                        <input
                            type="text"
                            class="form-control form-control-sm clean-input"
                            placeholder="Tìm kiếm..."
                            v-model="searchQuery"
                        />
                        <select class="form-select form-select-sm clean-input" v-model="statusFilter">
                            <option value="">Tất cả</option>
                            <option value="CRITICAL">Nguy cấp</option>
                            <option value="WARNING">Cảnh báo</option>
                            <option value="INFO">Chú ý</option>
                            <option value="STABLE">Ổn định</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-minimal">
                            <thead>
                                <tr>
                                    <th>Nguyên liệu</th>
                                    <th>Tồn kho</th>
                                    <th>Mức đặt lại</th>
                                    <th>Tỷ lệ tiêu thụ/ngày</th>
                                    <th>Còn lại (ngày)</th>
                                    <th>Trạng thái</th>
                                    <th>Đề xuất</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="item in filteredItems"
                                    :key="item.ingredientId"
                                    :class="`table-${item.alert.color}`"
                                >
                                    <td>
                                        <span class="fw-semibold ingredient-name">{{ item.name }}</span>
                                        <br>
                                        <small class="ingredient-unit">{{ item.unit }}</small>
                                    </td>
                                    <td class="fw-semibold">{{ formatNumber(item.currentStock) }} {{ item.unit }}</td>
                                    <td>{{ item.reorderLevel > 0 ? formatNumber(item.reorderLevel) + ' ' + item.unit : 'Chưa đặt' }}</td>
                                    <td>{{ formatNumber(item.consumptionRate) }} {{ item.unit }}/ngày</td>
                                    <td>
                                        <span :class="item.daysRemaining <= 5 ? 'fw-semibold days-critical' : 'days-normal'">
                                            {{ item.daysRemaining === Infinity ? '∞' : item.daysRemaining.toFixed(1) }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-soft" :class="`badge-${item.alert.color}`">
                                            {{ item.alert.label }}
                                        </span>
                                    </td>
                                    <td>
                                        <div v-if="item.suggestion" class="suggestion-info">
                                            <div class="suggestion-quantity">
                                                {{ formatNumber(item.suggestion.quantity) }} {{ item.unit }}
                                            </div>
                                            <div v-if="item.suggestion.estimatedCost" class="suggestion-cost">
                                                ~{{ formatCurrency(item.suggestion.estimatedCost) }}
                                            </div>
                                        </div>
                                        <span v-else class="text-muted suggestion-empty">Chưa có đề xuất</span>
                                    </td>
                                    <td>
                                        <div class="d-flex gap-2">
                                            <button
                                                class="btn-flat btn-flat--outline btn-sm"
                                                @click="showStockHistory(item)"
                                                title="Xem lịch sử"
                                            >
                                                <i class="bi bi-graph-up"></i>
                                            </button>
                                            <button
                                                v-if="item.suggestion && item.alert.status !== 'STABLE'"
                                                class="btn-flat btn-flat--outline btn-sm btn-action-success"
                                                @click="showPurchaseOrderModal(item)"
                                                title="Tạo đơn đặt hàng"
                                            >
                                                <i class="bi bi-cart-plus"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-if="filteredItems.length === 0" class="text-center text-muted p-4 empty-message">
                        Không tìm thấy nguyên liệu nào
                    </div>
                </div>
            </div>
        </div>

        <EmptyState
            v-else
            message="Nhấn 'Làm mới' để bắt đầu phân tích tồn kho"
            icon="bi-box-seam"
        />

        <StockLevelChartModal
            v-if="selectedIngredient"
            :ingredient="selectedIngredient"
            @close="selectedIngredient = null"
        />

        <PurchaseOrderSuggestionModal
            v-if="selectedSuggestion"
            :suggestion="selectedSuggestion"
            @close="selectedSuggestion = null"
            @created="handlePurchaseOrderCreated"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryManagementStore } from '@/store/inventoryManagement'
import StockLevelChartModal from '@/components/inventory-management/StockLevelChartModal.vue'
import PurchaseOrderSuggestionModal from '@/components/inventory-management/PurchaseOrderSuggestionModal.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const store = useInventoryManagementStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const analysisData = computed(() => store.analysisData)
const summary = computed(() => store.summary)
const items = computed(() => store.items)

const includeStable = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedIngredient = ref(null)
const selectedSuggestion = ref(null)

const filteredItems = computed(() => {
    let result = items.value

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.unit.toLowerCase().includes(query)
        )
    }

    if (statusFilter.value) {
        result = result.filter(item => item.alert.status === statusFilter.value)
    }

    return result
})

const handleAnalyze = async () => {
    try {
        await store.analyzeInventory({ includeStable: includeStable.value })
    } catch (err) {
        console.error('Failed to analyze', err)
    }
}

const handleRefresh = () => {
    handleAnalyze()
}

const showStockHistory = async (item) => {
    selectedIngredient.value = item
    try {
        await store.getStockHistory(item.ingredientId, 30)
    } catch (err) {
        console.error('Failed to load stock history', err)
    }
}

const showPurchaseOrderModal = async (item) => {
    selectedSuggestion.value = item
    try {
        await store.getSuppliers(item.ingredientId)
    } catch (err) {
        console.error('Failed to load suppliers', err)
    }
}

const handlePurchaseOrderCreated = () => {
    selectedSuggestion.value = null
    handleAnalyze()
}

onMounted(() => {
    handleAnalyze()
})
</script>

<style scoped>
/* Page Container */
.smart-inventory-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

/* KPI Cards - Chuẩn hóa theo Global Design System */
.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
    min-height: 120px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    transition: all var(--transition-base);
}

/* KPI Card Variants - Màu icon theo design system */
.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.kpi-card__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-normal);
}

/* Typography chuẩn hóa */
:deep(.card-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

:deep(.form-check-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-weight: var(--font-weight-normal);
}

/* Table Content Styles */
.ingredient-name {
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

.ingredient-unit {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.days-critical {
    color: var(--color-danger);
    font-family: var(--font-family-sans);
}

.days-normal {
    color: var(--color-text);
    font-family: var(--font-family-sans);
}

/* Badge Styles */
.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

/* Suggestion Info */
.suggestion-info {
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.suggestion-quantity {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.suggestion-cost {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.suggestion-empty {
    font-size: var(--font-size-xs);
    font-family: var(--font-family-sans);
}

/* Button Actions */
.btn-action-success {
    color: var(--color-success) !important;
    border-color: var(--color-success) !important;
}

.btn-action-success:hover:not(:disabled) {
    background: var(--color-soft-emerald) !important;
    border-color: var(--color-success) !important;
    color: var(--color-success) !important;
}

/* Empty Message */
.empty-message {
    font-family: var(--font-family-sans);
    color: var(--color-text-muted);
}

/* Content Animation */
.inventory-content {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Standard Card Header - Đảm bảo spacing đúng chuẩn */
.standard-card-header {
    gap: var(--spacing-3);
}

.standard-card-header .d-flex {
    gap: var(--spacing-2);
}

.standard-card-header .clean-input {
    min-width: 150px;
}

/* Responsive improvements */
@media (max-width: 768px) {
    .standard-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-2);
    }
    
    .standard-card-header .d-flex {
        width: 100%;
        flex-direction: column;
    }
    
    .standard-card-header input,
    .standard-card-header select {
        width: 100% !important;
    }

    .kpi-card {
        min-height: 100px;
        padding: var(--spacing-3);
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }

    .kpi-card__value {
        font-size: var(--font-size-lg);
    }
}
</style>

