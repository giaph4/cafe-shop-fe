<template>
    <div class="expenses-inventory">
        <div class="export-row d-flex flex-wrap gap-2 justify-content-end">
            <button class="btn btn-outline-primary" type="button" @click="handleExportExpenses" :disabled="expensesExporting">
                <span v-if="expensesExporting" class="spinner-border spinner-border-sm me-2"></span>
                Xuất chi phí
            </button>
            <button class="btn btn-outline-secondary" type="button" @click="handleExportInventory" :disabled="inventoryExporting">
                <span v-if="inventoryExporting" class="spinner-border spinner-border-sm me-2"></span>
                Xuất tồn kho
            </button>
        </div>

        <div class="grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Chi phí theo ngày</h5>
                        <p class="text-muted mb-0">Tổng: {{ formatCurrency(expensesTotals.overall) }}</p>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart type="area" height="320" :series="expensesSeries" :options="expensesOptions" />
                </div>
            </div>

            <div class="card summary-card">
                <div class="summary-card__grid">
                    <div class="summary-card__item">
                        <span>Tổng chi phí</span>
                        <strong>{{ formatCurrency(totalExpenses?.totalExpenses ?? 0) }}</strong>
                        <small v-if="totalExpenses?.startDate || totalExpenses?.endDate">{{ buildRange(totalExpenses?.startDate, totalExpenses?.endDate) }}</small>
                    </div>
                    <div class="summary-card__item">
                        <span>Chi phí nhập nguyên liệu</span>
                        <strong>{{ formatCurrency(totalImportedCost?.totalImportedIngredientCost ?? 0) }}</strong>
                        <small v-if="totalImportedCost?.startDate || totalImportedCost?.endDate">{{ buildRange(totalImportedCost?.startDate, totalImportedCost?.endDate) }}</small>
                    </div>
                    <div class="summary-card__item">
                        <span>Ngày chi cao nhất</span>
                        <strong>{{ heaviestExpense?.date || '—' }}</strong>
                        <small v-if="heaviestExpense">{{ formatCurrency(heaviestExpense.total) }}</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="inventory-card card">
            <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <div>
                    <h5 class="mb-1">Tồn kho & cảnh báo thiếu hụt</h5>
                    <p class="text-muted mb-0">Tổng {{ formatNumber(inventorySummary.totalItems) }} nguyên liệu · Thiếu hụt {{ formatNumber(inventorySummary.lowStockCount) }}</p>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="lowStockToggle" :checked="lowStockOnly" :disabled="inventoryLoading" @change="emit('update:lowStockOnly', $event.target.checked)">
                    <label class="form-check-label" for="lowStockToggle">Chỉ hiển thị thiếu hụt</label>
                </div>
            </div>
            <div class="card-body">
                <div class="inventory-grid">
                    <div class="card mini-card" v-for="stat in inventoryStats" :key="stat.label">
                        <div class="mini-card__icon" :class="stat.variant">
                            <i :class="stat.icon"></i>
                        </div>
                        <div class="mini-card__meta">
                            <span>{{ stat.label }}</span>
                            <strong>{{ stat.display }}</strong>
                        </div>
                    </div>
                </div>

                <div v-if="inventoryLoading" class="state-block py-4">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else class="table-responsive mt-4">
                    <table class="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Nguyên liệu</th>
                                <th>Đơn vị</th>
                                <th class="text-end">Tồn kho</th>
                                <th class="text-end">Mức đặt lại</th>
                                <th class="text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in displayedInventory" :key="item.id">
                                <td class="fw-semibold">{{ item.name }}</td>
                                <td>{{ item.unit || '—' }}</td>
                                <td class="text-end">{{ formatNumber(item.quantityOnHand) }}</td>
                                <td class="text-end">{{ item.reorderLevel != null ? formatNumber(item.reorderLevel) : '—' }}</td>
                                <td class="text-center">
                                    <span class="badge" :class="item.status === 'LOW_STOCK' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'">
                                        {{ item.status === 'LOW_STOCK' ? 'Thiếu hụt' : 'Ổn định' }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="!displayedInventory.length">
                                <td colspan="5" class="text-center text-muted py-4">Không có nguyên liệu phù hợp.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    expensesEntries: { type: Array, default: () => [] },
    totalExpenses: { type: Object, default: null },
    totalImportedCost: { type: Object, default: null },
    inventoryItems: { type: Array, default: () => [] },
    inventorySummary: {
        type: Object,
        default: () => ({ totalItems: 0, lowStockCount: 0, totalQuantity: 0 })
    },
    lowStockOnly: { type: Boolean, default: false },
    expensesExporting: { type: Boolean, default: false },
    inventoryExporting: { type: Boolean, default: false },
    inventoryLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:lowStockOnly', 'export:expenses', 'export:inventory'])

const ApexChart = VueApexCharts

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches

const BASE_LABEL_STYLE = Object.freeze({ colors: prefersDark ? '#cbd5f5' : '#64748b', fontSize: '12px' })
const VIBRANT_PALETTE = Object.freeze([
    '#2563eb',
    '#f97316',
    '#22c55e',
    '#facc15',
    '#ec4899',
    '#9333ea',
    '#0ea5e9',
    '#ef4444',
    '#14b8a6',
    '#8b5cf6'
])

const createBaseOptions = (type, colors = VIBRANT_PALETTE) => {
    const isBar = type === 'bar'
    const isCircular = ['pie', 'donut', 'radialBar'].includes(type)
    return {
        chart: {
            type,
            toolbar: { show: true },
            foreColor: prefersDark ? '#e2e8f0' : '#475569',
            background: 'transparent'
        },
        stroke: isCircular
            ? { colors: ['#ffffff'], width: 2 }
            : { curve: 'smooth', width: isBar ? 0 : 3 },
        dataLabels: { enabled: false },
        colors,
        grid: {
            strokeDashArray: 4,
            borderColor: prefersDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: { style: { ...BASE_LABEL_STYLE } },
            axisBorder: {
                color: prefersDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            axisTicks: {
                color: prefersDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            crosshairs: {
                stroke: {
                    color: prefersDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
                    dashArray: 4
                }
            }
        },
        yaxis: {
            labels: {
                style: { ...BASE_LABEL_STYLE },
                formatter: (value) => value ?? 0
            }
        },
        legend: { position: 'bottom', labels: { colors: prefersDark ? '#cbd5f5' : '#475569' } },
        tooltip: {
            theme: prefersDark ? 'dark' : 'light',
            y: {
                formatter: (value) => value ?? 0
            }
        },
        fill: isBar
            ? { type: 'solid', opacity: prefersDark ? 0.85 : 0.95 }
            : isCircular
                ? { type: 'solid', opacity: 1, colors }
                : {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: prefersDark ? 0.45 : 0.55,
                        opacityTo: prefersDark ? 0.1 : 0.15,
                        stops: [0, 90, 100]
                    }
                },
        plotOptions: {
            bar: {
                columnWidth: '55%',
                borderRadius: 6,
                horizontal: false,
                distributed: false
            }
        }
    }
}

const mergeOptions = (base, overrides = {}) => ({
    ...base,
    ...overrides,
    chart: { ...base.chart, ...overrides.chart },
    stroke: { ...base.stroke, ...overrides.stroke },
    dataLabels: { ...base.dataLabels, ...overrides.dataLabels },
    colors: overrides.colors ?? base.colors,
    grid: { ...base.grid, ...overrides.grid },
    xaxis: {
        ...base.xaxis,
        ...(overrides.xaxis || {}),
        labels: {
            ...base.xaxis.labels,
            ...overrides.xaxis?.labels
        }
    },
    yaxis: {
        ...base.yaxis,
        ...(overrides.yaxis || {}),
        labels: {
            ...base.yaxis.labels,
            ...overrides.yaxis?.labels
        }
    },
    fill: {
        ...base.fill,
        ...overrides.fill,
        gradient: {
            ...(base.fill?.gradient || {}),
            ...(overrides.fill?.gradient || {})
        }
    },
    tooltip: {
        ...base.tooltip,
        ...overrides.tooltip,
        theme: overrides.tooltip?.theme ?? base.tooltip?.theme,
        y: {
            ...(base.tooltip?.y || {}),
            ...(overrides.tooltip?.y || {})
        }
    },
    legend: { ...base.legend, ...overrides.legend },
    plotOptions: {
        ...(base.plotOptions || {}),
        ...(overrides.plotOptions || {}),
        bar: {
            ...(base.plotOptions?.bar || {}),
            ...(overrides.plotOptions?.bar || {})
        }
    }
})

const formatNumber = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value ?? 0)

const buildRange = (start, end) => [start, end].filter(Boolean).join(' → ')

const categoriesSet = computed(() => {
    const set = new Set()
    props.expensesEntries.forEach((entry) => {
        entry.categories?.forEach((category) => set.add(category.category))
    })
    return Array.from(set)
})

const expensesSeries = computed(() => {
    if (!categoriesSet.value.length) {
        return [
            {
                name: 'Chi phí',
                data: props.expensesEntries.map(() => 0)
            }
        ]
    }
    return categoriesSet.value.map((category) => ({
        name: category,
        data: props.expensesEntries.map((entry) => {
            const found = entry.categories?.find((item) => item.category === category)
            return found ? found.amount : 0
        })
    }))
})

const xCategories = computed(() => props.expensesEntries.map((entry) => entry.date))

const expensesOptions = computed(() => {
    const base = createBaseOptions('area', VIBRANT_PALETTE)

    return mergeOptions(base, {
        chart: { type: 'area', stacked: true, toolbar: { show: false } },
        xaxis: {
            categories: xCategories.value,
            labels: base.xaxis.labels
        },
        yaxis: {
            labels: {
                formatter: (value) => formatCurrency(value)
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.6,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        }
    })
})

const expensesTotals = computed(() => ({
    overall: props.expensesEntries.reduce((sum, entry) => sum + (entry.total ?? 0), 0)
}))

const heaviestExpense = computed(() => {
    if (!props.expensesEntries.length) return null
    return [...props.expensesEntries].sort((a, b) => b.total - a.total)[0]
})

const inventoryStats = computed(() => [
    {
        label: 'Tổng nguyên liệu',
        value: props.inventorySummary.totalItems,
        icon: 'bi bi-box-seam',
        variant: 'variant-primary'
    },
    {
        label: 'Thiếu hụt',
        value: props.inventorySummary.lowStockCount,
        icon: 'bi bi-exclamation-triangle',
        variant: 'variant-warning'
    },
    {
        label: 'Tổng tồn kho',
        value: props.inventorySummary.totalQuantity,
        icon: 'bi bi-graph-up',
        variant: 'variant-success'
    }
].map((stat) => ({
    ...stat,
    display: formatNumber(stat.value ?? 0)
})))

const displayedInventory = computed(() => {
    const source = props.lowStockOnly
        ? props.inventoryItems.filter((item) => item.status === 'LOW_STOCK')
        : props.inventoryItems
    return source.slice(0, 12)
})

const handleExportExpenses = () => emit('export:expenses')
const handleExportInventory = () => emit('export:inventory')

</script>

<style scoped>
.expenses-inventory {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.export-row {
    margin-bottom: -0.5rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.chart-card,
.summary-card,
.inventory-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.summary-card__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
}

.summary-card__item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.summary-card__item span {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.summary-card__item strong {
    font-size: 1.2rem;
}

.inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.mini-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 16px;
    background: var(--color-card-muted);
}

.mini-card__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 1.35rem;
}

.variant-primary { background: linear-gradient(135deg, #4f46e5, #6366f1); }
.variant-warning { background: linear-gradient(135deg, #f97316, #fb923c); }
.variant-success { background: linear-gradient(135deg, #22c55e, #4ade80); }

.mini-card__meta span {
    font-size: 0.82rem;
    color: var(--color-text-muted);
}

.mini-card__meta strong {
    font-size: 1.1rem;
    font-weight: 700;
}

.table {
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .summary-card__grid {
        grid-template-columns: 1fr;
    }
}
</style>
