<template>
    <div class="cost-analysis-page page-container container-fluid" data-aos="fade-up">
        <PageHeader
            title="Phân tích Chi phí và Tối ưu Ngân sách"
            subtitle="Phân tích chi phí toàn diện và đề xuất tối ưu ngân sách"
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
                <button
                    v-if="hasData"
                    class="btn-flat btn-flat--outline"
                    @click="handleExport"
                    :disabled="exporting"
                >
                    <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-download me-2"></i>
                    Xuất Excel
                </button>
            </template>
        </PageHeader>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-2 col-md-6">
                        <label class="form-label">Từ ngày</label>
                        <input
                            type="date"
                            class="form-control clean-input"
                            v-model="filters.startDate"
                            @change="validateDates"
                        />
                    </div>
                    <div class="col-lg-2 col-md-6">
                        <label class="form-label">Đến ngày</label>
                        <input
                            type="date"
                            class="form-control clean-input"
                            v-model="filters.endDate"
                            @change="validateDates"
                        />
                    </div>
                    <div class="col-lg-2 col-md-6">
                        <label class="form-label">Khoảng thời gian</label>
                        <div class="btn-group w-100" role="group">
                            <button
                                v-for="preset in presets"
                                :key="preset.value"
                                type="button"
                                class="btn btn-flat"
                                :class="selectedPreset === preset.value ? 'btn-flat--active' : 'btn-flat--outline'"
                                @click="applyPreset(preset.value)"
                            >
                                {{ preset.label }}
                            </button>
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6">
                        <button
                            class="btn btn-flat btn-flat--primary w-100"
                            @click="handleAnalyze"
                            :disabled="loading || !canAnalyze"
                        >
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-graph-up-arrow me-2"></i>
                            Phân tích
                        </button>
                    </div>
                </div>
                <div v-if="validationError" class="alert alert-warning mt-3 mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {{ validationError }}
                </div>
            </div>
        </div>

        <LoadingState v-if="loading" text="Đang phân tích chi phí..." />
        <ErrorState
            v-else-if="error"
            :message="error"
            @retry="handleAnalyze"
        />

        <div v-else-if="hasData" class="analysis-content">
            <div class="row g-4 mb-4">
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--danger">
                        <div class="kpi-card__icon">
                            <i class="bi bi-cash-stack"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tổng chi phí</div>
                            <div class="kpi-card__value">{{ formatCurrency(summary?.totalCost || 0) }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--success">
                        <div class="kpi-card__icon">
                            <i class="bi bi-graph-up"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tổng doanh thu</div>
                            <div class="kpi-card__value">{{ formatCurrency(summary?.totalRevenue || 0) }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--info">
                        <div class="kpi-card__icon">
                            <i class="bi bi-percent"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tỷ lệ chi phí/doanh thu</div>
                            <div class="kpi-card__value">{{ (summary?.costRevenueRatio || 0).toFixed(1) }}%</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--warning">
                        <div class="kpi-card__icon">
                            <i class="bi bi-cart"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Chi phí/đơn hàng</div>
                            <div class="kpi-card__value">{{ formatCurrency(summary?.costPerOrder || 0) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-lg-6">
                    <div class="card standard-card">
                        <div class="card-header standard-card-header">
                            <h5 class="card-title">Phân loại chi phí</h5>
                        </div>
                        <div class="card-body">
                            <CostBreakdownChart :category-breakdown="categoryBreakdown" />
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card standard-card">
                        <div class="card-header standard-card-header">
                            <h5 class="card-title">Xu hướng chi phí</h5>
                        </div>
                        <div class="card-body">
                            <CostTrendChart :daily-costs="dailyCosts" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <div class="col-lg-8">
                    <div class="card standard-card">
                        <div class="card-header standard-card-header">
                            <h5 class="card-title">Top danh mục chi phí</h5>
                        </div>
                        <div class="card-body">
                            <TopCategoriesTable :categories="topCategories" :total-cost="summary?.totalCost || 0" />
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card standard-card">
                        <div class="card-header standard-card-header">
                            <h5 class="card-title">Đề xuất tối ưu</h5>
                        </div>
                        <div class="card-body">
                            <RecommendationsPanel :recommendations="recommendations" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <EmptyState
            v-else
            title="Chưa có dữ liệu"
            message="Chọn khoảng thời gian và nhấn 'Phân tích' để bắt đầu"
        >
            <template #icon>
                <i class="bi bi-cash-stack"></i>
            </template>
        </EmptyState>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCostAnalysisStore } from '@/store/costAnalysis'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import CostBreakdownChart from '@/components/cost-analysis/CostBreakdownChart.vue'
import CostTrendChart from '@/components/cost-analysis/CostTrendChart.vue'
import TopCategoriesTable from '@/components/cost-analysis/TopCategoriesTable.vue'
import RecommendationsPanel from '@/components/cost-analysis/RecommendationsPanel.vue'
import { formatCurrency } from '@/utils/formatters'
import * as XLSX from 'xlsx'

const store = useCostAnalysisStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const summary = computed(() => store.summary)
const categoryBreakdown = computed(() => store.categoryBreakdown)
const dailyCosts = computed(() => store.dailyCosts)
const topCategories = computed(() => store.topCategories)
const recommendations = computed(() => store.recommendations)

const exporting = ref(false)
const validationError = ref('')
const selectedPreset = ref('90d')

const filters = ref({
    startDate: '',
    endDate: ''
})

const presets = [
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '180 ngày', days: 180 },
    { value: '365d', label: '1 năm', days: 365 }
]

const canAnalyze = computed(() => {
    return filters.value.startDate && filters.value.endDate && !validationError.value
})

const applyPreset = (preset) => {
    selectedPreset.value = preset
    const presetConfig = presets.find(p => p.value === preset)
    if (!presetConfig) return
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - presetConfig.days)
    
    filters.value.endDate = endDate.toISOString().split('T')[0]
    filters.value.startDate = startDate.toISOString().split('T')[0]
    validateDates()
}

const validateDates = () => {
    validationError.value = ''
    
    if (!filters.value.startDate || !filters.value.endDate) {
        return
    }
    
    const start = new Date(filters.value.startDate)
    const end = new Date(filters.value.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start > end) {
        validationError.value = 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
        return
    }
    
    if (end > today) {
        validationError.value = 'Ngày kết thúc không được vượt quá hôm nay'
        return
    }
}

const handleAnalyze = async () => {
    if (!canAnalyze.value || validationError.value) return
    
    try {
        await store.analyzeCosts({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate
        })
    } catch (err) {
        console.error('Failed to analyze', err)
    }
}

const handleRefresh = () => {
    handleAnalyze()
}

const handleExport = async () => {
    if (!hasData.value) return
    
    exporting.value = true
    try {
        const exportData = await store.exportReport()
        
        const ws = XLSX.utils.aoa_to_sheet(exportData.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, exportData.sheetName)
        
        XLSX.writeFile(wb, exportData.filename)
    } catch (err) {
        console.error('Failed to export', err)
        alert('Không thể xuất file. Vui lòng thử lại.')
    } finally {
        exporting.value = false
    }
}

onMounted(() => {
    applyPreset('90d')
})
</script>

<style scoped>
.cost-analysis-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    transition: all var(--transition-base);
    min-height: 100px;
    height: 100%;
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card--warning .kpi-card__icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.filter-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
}

.alert-warning {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
    color: var(--color-text);
}

.analysis-content {
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

@media (max-width: 768px) {
    .kpi-card {
        min-height: 90px;
        padding: var(--spacing-3);
    }

    .kpi-card__icon {
        width: 40px;
        height: 40px;
        font-size: 18px;
    }

    .kpi-card__value {
        font-size: var(--font-size-base);
    }
}
</style>

