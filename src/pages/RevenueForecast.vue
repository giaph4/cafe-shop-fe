<template>
    <div class="revenue-forecast-page page-container container-fluid" data-aos="fade-up">
        <PageHeader
            title="Dự báo doanh thu thông minh"
            subtitle="Phân tích xu hướng và dự báo doanh thu dựa trên dữ liệu lịch sử"
        />

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Khoảng thời gian lịch sử</label>
                        <div class="btn-group w-100" role="group">
                            <button
                                v-for="preset in historyPresets"
                                :key="preset.value"
                                type="button"
                                class="btn btn-flat"
                                :class="selectedHistoryPreset === preset.value ? 'btn-flat--active' : 'btn-flat--outline'"
                                @click="applyHistoryPreset(preset.value)"
                            >
                                {{ preset.label }}
                            </button>
                        </div>
                    </div>
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
                        <label class="form-label">Dự báo (ngày)</label>
                        <select class="form-select clean-input" v-model="filters.forecastDays">
                            <option :value="7">7 ngày</option>
                            <option :value="30">30 ngày</option>
                            <option :value="90">90 ngày</option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <button
                            class="btn btn-flat btn-flat--primary w-100"
                            @click="handleGenerateForecast"
                            :disabled="loading || !canGenerate"
                        >
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-graph-up-arrow me-2"></i>
                            Tạo dự báo
                        </button>
                    </div>
                </div>
                <div v-if="validationError" class="alert alert-warning mt-3 mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {{ validationError }}
                </div>
            </div>
        </div>

        <LoadingState v-if="loading" text="Đang phân tích dữ liệu và tạo dự báo..." />
        <ErrorState
            v-else-if="error"
            :message="error"
            @retry="handleGenerateForecast"
        />

        <div v-else-if="forecastData" class="forecast-content">
            <div class="row g-4 mb-4">
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--primary">
                        <div class="kpi-card__icon">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tổng dự báo</div>
                            <div class="kpi-card__value">{{ formatCurrency(totalForecast) }}</div>
                            <div class="kpi-card__subtitle">{{ filters.forecastDays }} ngày tới</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--success">
                        <div class="kpi-card__icon">
                            <i class="bi bi-calendar-day"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Trung bình/ngày</div>
                            <div class="kpi-card__value">{{ formatCurrency(avgForecast) }}</div>
                            <div class="kpi-card__subtitle">Dự kiến</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card" :class="growthRate >= 0 ? 'kpi-card--success' : 'kpi-card--danger'">
                        <div class="kpi-card__icon">
                            <i class="bi" :class="growthRate >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tỷ lệ tăng trưởng</div>
                            <div class="kpi-card__value">{{ growthRate >= 0 ? '+' : '' }}{{ growthRate.toFixed(2) }}%</div>
                            <div class="kpi-card__subtitle">So với 7 ngày trước</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="kpi-card kpi-card--info">
                        <div class="kpi-card__icon">
                            <i class="bi bi-shield-check"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Độ tin cậy</div>
                            <div class="kpi-card__value">{{ forecastData.metrics?.confidenceLevel || 95 }}%</div>
                            <div class="kpi-card__subtitle">Confidence interval</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card standard-card mb-4">
                <div class="card-header standard-card-header">
                    <h5 class="card-title">Biểu đồ dự báo</h5>
                    <button
                        class="btn btn-flat btn-flat--outline btn-sm"
                        @click="handleExport"
                        :disabled="exporting"
                    >
                        <span v-if="exporting" class="spinner-border spinner-border-sm me-2"></span>
                        <i v-else class="bi bi-download me-2"></i>
                        Xuất Excel
                    </button>
                </div>
                <div class="card-body">
                    <ForecastChart
                        :historical="forecastData.historical"
                        :forecasts="forecastData.forecasts"
                    />
                </div>
            </div>

            <div class="card standard-card">
                <div class="card-header standard-card-header">
                    <h5 class="card-title">Chi tiết dự báo</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-minimal">
                            <thead>
                                <tr>
                                    <th>Ngày</th>
                                    <th>Thứ</th>
                                    <th>Dự báo</th>
                                    <th>Giới hạn dưới</th>
                                    <th>Giới hạn trên</th>
                                    <th>Khoảng tin cậy</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="forecast in forecastData.forecasts" :key="forecast.date">
                                    <td class="forecast-date">{{ formatDate(forecast.date) }}</td>
                                    <td class="forecast-day">{{ forecast.dayOfWeek }}</td>
                                    <td class="forecast-value fw-semibold">{{ formatCurrency(forecast.forecast) }}</td>
                                    <td class="forecast-lower text-muted">{{ formatCurrency(forecast.confidenceLower) }}</td>
                                    <td class="forecast-upper text-muted">{{ formatCurrency(forecast.confidenceUpper) }}</td>
                                    <td>
                                        <span class="badge badge-soft badge-info">
                                            ±{{ formatCurrency((forecast.confidenceUpper - forecast.confidenceLower) / 2) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <EmptyState
            v-else
            message="Chọn khoảng thời gian và nhấn 'Tạo dự báo' để bắt đầu"
            icon="bi-graph-up-arrow"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRevenueForecastStore } from '@/store/revenueForecast'
import ForecastChart from '@/components/revenue-forecast/ForecastChart.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate } from '@/utils/formatters'
import * as XLSX from 'xlsx'

const store = useRevenueForecastStore()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const forecastData = computed(() => store.forecastData)
const totalForecast = computed(() => store.totalForecast)
const avgForecast = computed(() => store.avgForecast)
const growthRate = computed(() => store.growthRate)

const exporting = ref(false)
const validationError = ref('')
const selectedHistoryPreset = ref('30d')

const filters = ref({
    startDate: '',
    endDate: '',
    forecastDays: 7
})

const historyPresets = [
    { value: '7d', label: '7 ngày', days: 7 },
    { value: '30d', label: '30 ngày', days: 30 },
    { value: '90d', label: '90 ngày', days: 90 },
    { value: '180d', label: '6 tháng', days: 180 }
]

const canGenerate = computed(() => {
    return filters.value.startDate && filters.value.endDate && !validationError.value
})

const applyHistoryPreset = (preset) => {
    selectedHistoryPreset.value = preset
    const presetConfig = historyPresets.find(p => p.value === preset)
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
    
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
        validationError.value = 'Cần ít nhất 7 ngày dữ liệu lịch sử'
        return
    }
    
    if (daysDiff > 365) {
        validationError.value = 'Khoảng thời gian không được vượt quá 365 ngày'
        return
    }
}

const handleGenerateForecast = async () => {
    if (!canGenerate.value || validationError.value) return
    
    try {
        await store.generateForecast({
            startDate: filters.value.startDate,
            endDate: filters.value.endDate,
            forecastDays: filters.value.forecastDays
        })
    } catch (err) {
        console.error('Failed to generate forecast', err)
    }
}

const handleExport = async () => {
    if (!forecastData.value) return
    
    exporting.value = true
    try {
        const exportData = await store.exportForecast()
        
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
    applyHistoryPreset('30d')
})
</script>

<style scoped>
/* Page Container */
.revenue-forecast-page {
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
.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--danger .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--info .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
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

/* Filter Card - Chuẩn hóa */
.filter-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    box-shadow: none;
}

.filter-card :global(.card-body) {
    padding: var(--spacing-5);
}

/* Form Labels - Chuẩn hóa */
:deep(.form-label) {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

/* Button Group - Chuẩn hóa */
.btn-group {
    display: flex;
    gap: var(--spacing-1);
    flex-wrap: wrap;
}

.btn-group .btn-flat {
    flex: 1;
    min-width: 0;
}

/* Alert Styles - Chuẩn hóa */
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

.alert i {
    color: var(--color-warning);
}

/* Typography chuẩn hóa */
:deep(.card-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

/* Table Content Styles */
.forecast-date,
.forecast-day {
    font-family: var(--font-family-sans);
    color: var(--color-text);
}

.forecast-value {
    color: var(--color-primary);
    font-family: var(--font-family-sans);
}

.forecast-lower,
.forecast-upper {
    font-family: var(--font-family-sans);
    color: var(--color-text-muted);
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

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

/* Content Animation */
.forecast-content {
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

/* Responsive improvements */
@media (max-width: 768px) {
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

    .btn-group {
        flex-direction: column;
    }

    .btn-group .btn-flat {
        width: 100%;
    }
}
</style>

