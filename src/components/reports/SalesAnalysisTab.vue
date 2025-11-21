<template>
    <div class="sales-analysis">
        <div class="filters card card-inline">
            <div class="card-body d-flex flex-wrap gap-3 align-items-end">
                <div>
                    <label class="form-label mb-1">Xếp hạng theo</label>
                    <select class="form-select" :value="sortBy" @change="onSortChange($event.target.value)">
                        <option value="quantity">Số lượng bán</option>
                        <option value="revenue">Doanh thu</option>
                    </select>
                </div>
                <div>
                    <label class="form-label mb-1">Số lượng sản phẩm top</label>
                    <select class="form-select" :value="topLimit" @change="onTopChange($event.target.value)">
                        <option v-for="option in topOptions" :key="option" :value="option">{{ option === 'all' ? 'Tất cả' : `Top ${option}` }}</option>
                    </select>
                </div>
                <div>
                    <label class="form-label mb-1">Loại biểu đồ</label>
                    <select class="form-select" :value="productChartType" @change="onProductChartType($event.target.value)">
                        <option value="bar">Bar</option>
                        <option value="horizontalBar">Bar ngang</option>
                        <option value="radar">Radar</option>
                    </select>
                </div>
                <div>
                    <label class="form-label mb-1">Loại biểu đồ danh mục</label>
                    <select class="form-select" :value="categoryChartType" @change="onCategoryChartType($event.target.value)">
                        <option value="donut">Donut</option>
                        <option value="pie">Pie</option>
                        <option value="bar">Bar</option>
                    </select>
                </div>
                <div>
                    <label class="form-label mb-1">Sắp xếp chi tiết</label>
                    <select class="form-select" :value="tableSort" @change="onTableSort($event.target.value)">
                        <option value="quantity-desc">Số lượng ↓</option>
                        <option value="quantity-asc">Số lượng ↑</option>
                        <option value="revenue-desc">Doanh thu ↓</option>
                        <option value="revenue-asc">Doanh thu ↑</option>
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                    </select>
                </div>
                <p class="text-muted mb-0">Tổng doanh thu: {{ formatCurrency(productSummary?.totalRevenueGenerated ?? 0) }} · Tổng sản phẩm: {{ formatNumber(productSummary?.totalQuantitySold ?? 0) }}</p>
            </div>
        </div>

        <div class="chart-grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Top sản phẩm bán chạy</h5>
                        <p class="text-muted mb-0">Theo {{ sortBy === 'revenue' ? 'doanh thu' : 'số lượng' }}</p>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart :type="resolvedProductChartType" height="340" :series="chartSeries" :options="chartOptions" />
                </div>
            </div>

            <div class="card chart-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Doanh thu theo danh mục</h5>
                    <p class="text-muted mb-0">Phân loại theo nhóm sản phẩm</p>
                </div>
                <div class="card-body">
                    <ApexChart :type="resolvedCategoryChartType" height="320" :series="categorySeries" :options="categoryOptions" />
                </div>
            </div>
        </div>

        <div class="card table-card">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Thứ hạng</th>
                            <th>Sản phẩm</th>
                            <th class="text-end">Số lượng</th>
                            <th class="text-end">Doanh thu</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in sortedTableItems" :key="item.productId">
                            <td><span class="badge bg-primary-subtle text-primary">#{{ item.rank }}</span></td>
                            <td class="fw-semibold">{{ item.productName }}</td>
                            <td class="text-end">{{ formatNumber(item.totalQuantitySold) }}</td>
                            <td class="text-end">{{ formatCurrency(item.totalRevenueGenerated) }}</td>
                        </tr>
                        <tr v-if="!sortedTableItems.length">
                            <td colspan="4" class="text-center text-muted py-4">Chưa có dữ liệu bán hàng.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="chart-grid alternating-grid">
            <div class="card chart-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Doanh thu theo sản phẩm (stacked vs tổng)</h5>
                    <p class="text-muted mb-0">So sánh top sản phẩm với phần còn lại</p>
                </div>
                <div class="card-body">
                    <ApexChart type="bar" height="320" :series="stackedSeries" :options="stackedOptions" />
                </div>
            </div>
            <div class="card chart-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Doanh thu theo khung giờ</h5>
                    <p class="text-muted mb-0">Phủ đủ 24 giờ trong giai đoạn</p>
                </div>
                <div class="card-body">
                    <ApexChart type="area" height="320" :series="hourlySeries" :options="hourlyOptions" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { useThemePreference } from '@/composables/useThemePreference'

const props = defineProps({
    bestSellers: { type: Array, default: () => [] },
    productSummary: { type: Object, default: null },
    categorySales: { type: Array, default: () => [] },
    sortBy: { type: String, default: 'quantity' },
    topLimit: { type: [Number, String], default: 10 },
    tableSort: { type: String, default: 'quantity-desc' },
    productChartType: { type: String, default: 'bar' },
    categoryChartType: { type: String, default: 'donut' },
    hourlySales: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:sortBy', 'update:topLimit', 'update:tableSort', 'update:productChartType', 'update:categoryChartType'])

const ApexChart = VueApexCharts

const { isDark } = useThemePreference()

const baseLabelStyle = computed(() => ({ colors: isDark.value ? '#cbd5f5' : '#64748b', fontSize: '12px' }))
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
    const dark = isDark.value
    const labelStyle = baseLabelStyle.value
    return {
        chart: {
            type,
            toolbar: { show: true },
            foreColor: dark ? '#e2e8f0' : '#475569',
            background: 'transparent'
        },
        stroke: isCircular
            ? { colors: ['#ffffff'], width: 2 }
            : { curve: 'smooth', width: isBar ? 0 : 3 },
        dataLabels: { enabled: false },
        grid: {
            strokeDashArray: 4,
            borderColor: dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: {
                style: { ...labelStyle }
            },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            crosshairs: {
                stroke: {
                    color: dark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.35)',
                    dashArray: 4
                }
            }
        },
        yaxis: {
            labels: {
                style: { ...labelStyle },
                formatter: (value) => value ?? 0
            }
        },
        fill: isBar
            ? { type: 'solid', opacity: dark ? 0.85 : 0.95 }
            : isCircular
                ? { type: 'solid', opacity: 1, colors }
                : {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: dark ? 0.45 : 0.55,
                        opacityTo: dark ? 0.08 : 0.15,
                        stops: [0, 90, 100]
                    }
                },
        colors,
        legend: { position: 'bottom', labels: { colors: dark ? '#cbd5f5' : '#475569' } },
        tooltip: {
            theme: dark ? 'dark' : 'light',
            y: {
                formatter: (value) => value ?? 0
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 6,
                distributed: false
            }
        }
    }
}

const mergeOptions = (base, overrides = {}) => {
    const merged = {
        ...base,
        ...overrides,
        chart: { ...base.chart, ...overrides.chart },
        stroke: { ...base.stroke, ...overrides.stroke },
        dataLabels: { ...base.dataLabels, ...overrides.dataLabels },
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
    }

    return merged
}

const topOptions = [5, 10, 15, 20, 'all']
const DEFAULT_TABLE_SORT = 'quantity-desc'

const tableSort = computed({
    get: () => props.tableSort ?? DEFAULT_TABLE_SORT,
    set: (value) => emit('update:tableSort', value)
})

const productChartType = computed({
    get: () => props.productChartType ?? 'bar',
    set: (value) => emit('update:productChartType', value)
})

const categoryChartType = computed({
    get: () => props.categoryChartType ?? 'donut',
    set: (value) => emit('update:categoryChartType', value)
})

const resolvedProductChartType = computed(() => {
    if (productChartType.value === 'horizontalBar') return 'bar'
    return productChartType.value
})

const resolvedCategoryChartType = computed(() => categoryChartType.value)

const chartOptions = computed(() => {
    const applied = appliedTopBestSellers.value
    const categories = applied.map((item, index) => item.productName || `Sản phẩm #${index + 1}`)
    const isRevenue = props.sortBy === 'revenue'
    const base = createBaseOptions(resolvedProductChartType.value, isRevenue ? ['#1d4ed8'] : ['#16a34a'])
    const formatter = (value) => (isRevenue ? formatCurrency(value) : formatNumber(value))

    return mergeOptions(base, {
        xaxis: {
            categories,
            labels: {
                rotate: -35
            }
        },
        yaxis: {
            labels: {
                formatter
            }
        },
        tooltip: {
            y: {
                formatter
            }
        },
        plotOptions: {
            bar: {
                horizontal: productChartType.value === 'horizontalBar'
            }
        },
        stroke: resolvedProductChartType.value === 'radar'
            ? { width: 2 }
            : undefined
    })
})

const chartSeries = computed(() => {
    const data = appliedTopBestSellers.value
    if (props.sortBy === 'revenue') {
        return [
            {
                name: 'Doanh thu',
                data: data.map((item) => item.totalRevenueGenerated)
            }
        ]
    }
    return [
        {
            name: 'Số lượng',
            data: data.map((item) => item.totalQuantitySold)
        }
    ]
})

const categorySeries = computed(() => {
    if (categoryChartType.value === 'bar') {
        return [
            {
                name: 'Doanh thu',
                data: props.categorySales.map((item) => item.totalRevenue)
            }
        ]
    }
    return props.categorySales.map((item) => item.totalRevenue)
})

const categoryOptions = computed(() => {
    const data = props.categorySales ?? []
    const categories = data.map((item, index) => item.categoryName || `Danh mục #${index + 1}`)
    const isBar = categoryChartType.value === 'bar'
    const base = createBaseOptions(resolvedCategoryChartType.value, VIBRANT_PALETTE)

    return mergeOptions(base, {
        xaxis: { categories },
        dataLabels: {
            enabled: !isBar,
            formatter: (val) => `${Number(val).toFixed(1)}%`
        },
        plotOptions: {
            bar: {
                columnWidth: '55%',
                borderRadius: 6,
                horizontal: false
            }
        },
        stroke: resolvedCategoryChartType.value === 'radar'
            ? { width: 2 }
            : undefined,
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value)
            }
        }
    })
})

const appliedTopBestSellers = computed(() => {
    if (props.topLimit === 'all') return props.bestSellers
    const numericLimit = Number(props.topLimit)
    if (Number.isNaN(numericLimit) || numericLimit <= 0) return props.bestSellers
    return props.bestSellers.slice(0, numericLimit)
})

const sortedTableItems = computed(() => {
    const data = [...props.bestSellers]
    const [key, direction] = tableSort.value.split('-')
    return data.sort((a, b) => {
        switch (key) {
            case 'revenue':
                return direction === 'asc'
                    ? a.totalRevenueGenerated - b.totalRevenueGenerated
                    : b.totalRevenueGenerated - a.totalRevenueGenerated
            case 'name':
                return direction === 'asc'
                    ? a.productName.localeCompare(b.productName)
                    : b.productName.localeCompare(a.productName)
            case 'quantity':
            default:
                return direction === 'asc'
                    ? a.totalQuantitySold - b.totalQuantitySold
                    : b.totalQuantitySold - a.totalQuantitySold
        }
    })
})

const stackedSeries = computed(() => {
    const topRevenue = appliedTopBestSellers.value.reduce((sum, item) => sum + item.totalRevenueGenerated, 0)
    const totalRevenue = props.productSummary?.totalRevenueGenerated ?? topRevenue
    const remainder = Math.max(totalRevenue - topRevenue, 0)
    return [
        {
            name: 'Top sản phẩm',
            data: [topRevenue]
        },
        {
            name: 'Phần còn lại',
            data: [remainder]
        }
    ]
})

const stackedOptions = computed(() => {
    const base = createBaseOptions('bar', ['#2563eb', '#f97316'])

    return mergeOptions(base, {
        chart: { stacked: true, toolbar: { show: false } },
        plotOptions: {
            bar: {
                columnWidth: '45%',
                borderRadius: 6,
                horizontal: false
            }
        },
        xaxis: { categories: ['Giai đoạn'] },
        yaxis: {
            labels: {
                formatter: (val) => formatCurrency(val)
            }
        },
        tooltip: {
            y: {
                formatter: (val) => formatCurrency(val)
            }
        }
    })
})

const buildFullHours = () => Array.from({ length: 24 }, (_, index) => index)

const hourlySeries = computed(() => {
    const hours = buildFullHours()
    const mapped = new Map(hours.map((hour) => [hour, 0]))
    props.hourlySales.forEach((item) => {
        const hour = Number(item.hour)
        if (!Number.isNaN(hour) && mapped.has(hour)) {
            mapped.set(hour, (mapped.get(hour) ?? 0) + (item.totalRevenue ?? item.revenue ?? 0))
        }
    })
    return [
        {
            name: 'Doanh thu',
            data: hours.map((hour) => mapped.get(hour) ?? 0)
        }
    ]
})

const hourlyOptions = computed(() => {
    const base = createBaseOptions('area', ['#2563eb'])

    return mergeOptions(base, {
        xaxis: {
            categories: buildFullHours().map((hour) => `${hour.toString().padStart(2, '0')}:00`),
            tickAmount: 12
        },
        yaxis: {
            labels: {
                formatter: (value) => formatCurrency(value)
            }
        },
        tooltip: {
            y: {
                formatter: (value) => formatCurrency(value)
            }
        }
    })
})

const onSortChange = (value) => {
    emit('update:sortBy', value)
}

const onTopChange = (value) => {
    const parsed = value === 'all' ? 'all' : Number(value)
    emit('update:topLimit', parsed)
}

const onProductChartType = (value) => {
    productChartType.value = value
}

const onCategoryChartType = (value) => {
    categoryChartType.value = value
}

const onTableSort = (value) => {
    tableSort.value = value
}
</script>

<style scoped>
.sales-analysis {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.card-inline {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.alternating-grid {
    margin-top: 1.5rem;
}

.chart-card, .table-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(180deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.table-card .table {
    margin-bottom: 0;
}

.table-card tbody tr:last-child td {
    border-bottom: none;
}

.insight-card__value {
    font-size: 1.15rem;
    font-weight: 700;
}

:global([data-bs-theme='dark']) .sales-analysis .filters {
    background: rgba(15, 23, 42, 0.8);
}

:global([data-bs-theme='dark']) .sales-analysis .chart-card,
:global([data-bs-theme='dark']) .sales-analysis .table-card {
    border-color: rgba(99, 102, 241, 0.32);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
}
</style>
