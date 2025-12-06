<template>
    <div class="customers-staff">
        <div class="chart-grid">
            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Top khách hàng</h5>
                        <p class="text-muted mb-0">Theo {{ customerMetric === 'spend' ? 'tổng chi tiêu' : 'số đơn' }}</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="customerMetric">
                            <option value="spend">Doanh thu</option>
                            <option value="orders">Số đơn</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="customerChartType">
                            <option value="bar">Bar</option>
                            <option value="horizontalBar">Bar ngang</option>
                            <option value="pie">Pie</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="customerLimit">
                            <option value="5">Top 5</option>
                            <option value="10">Top 10</option>
                            <option value="all">Tất cả</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart
                        v-if="customerChartSeries.length"
                        :type="resolvedCustomerChartType"
                        height="320"
                        :series="customerChartSeries"
                        :options="customerChartOptions"
                    />
                    <p v-else class="text-muted mb-0">Chưa có dữ liệu khách hàng.</p>
                </div>
            </div>

            <div class="card chart-card">
                <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Hiệu suất nhân viên</h5>
                        <p class="text-muted mb-0">Theo {{ staffMetric === 'revenue' ? 'doanh thu' : 'số đơn' }}</p>
                    </div>
                    <div class="chart-controls d-flex gap-2">
                        <select class="form-select form-select-sm" v-model="staffMetric">
                            <option value="revenue">Doanh thu</option>
                            <option value="orders">Số đơn</option>
                        </select>
                        <select class="form-select form-select-sm" v-model="staffChartType">
                            <option value="bar">Bar</option>
                            <option value="horizontalBar">Bar ngang</option>
                            <option value="radar">Radar</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <ApexChart
                        v-if="staffChartSeries.length"
                        :type="resolvedStaffChartType"
                        height="320"
                        :series="staffChartSeries"
                        :options="staffChartOptions"
                    />
                    <p v-else class="text-muted mb-0">Chưa có dữ liệu nhân viên.</p>
                </div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="card summary-card">
                <div class="summary-card__icon bg-emerald-light">
                    <i class="bi bi-wallet2"></i>
                </div>
                <div class="summary-card__meta">
                    <span>Tổng chi phí</span>
                    <strong>{{ formatCurrency(expenseTotals.totalExpenses) }}</strong>
                    <small v-if="expenseTotals.range">{{ expenseTotals.range }}</small>
                </div>
            </div>
            <div class="card summary-card">
                <div class="summary-card__icon bg-sky-light">
                    <i class="bi bi-bag-plus"></i>
                </div>
                <div class="summary-card__meta">
                    <span>Chi phí nhập nguyên liệu</span>
                    <strong>{{ formatCurrency(importTotals.totalImportedCost) }}</strong>
                    <small v-if="importTotals.range">{{ importTotals.range }}</small>
                </div>
            </div>
            <div class="card summary-card">
                <div class="summary-card__icon bg-indigo-light">
                    <i class="bi bi-people"></i>
                </div>
                <div class="summary-card__meta">
                    <span>Giá trị trung bình mỗi khách</span>
                    <strong>{{ formatCurrency(customerInsights.averageSpendPerCustomer) }}</strong>
                    <small>{{ customerInsights.totalCustomers }} khách</small>
                </div>
            </div>
            <div class="card summary-card">
                <div class="summary-card__icon bg-amber-light">
                    <i class="bi bi-briefcase"></i>
                </div>
                <div class="summary-card__meta">
                    <span>Doanh thu trung bình mỗi nhân viên</span>
                    <strong>{{ formatCurrency(staffInsights.averageRevenuePerStaff) }}</strong>
                    <small>{{ staffInsights.totalStaff }} nhân viên</small>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card table-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Khách hàng tiêu biểu</h5>
                    <p class="text-muted mb-0">Top khách hàng theo doanh số và tần suất mua</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Thứ hạng</th>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th class="text-end">Số đơn</th>
                                <th class="text-end">Tổng chi tiêu</th>
                                <th class="text-end">Đơn TB</th>
                                <th>Đơn gần nhất</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="customer in topCustomers" :key="customer.customerId">
                                <td><span class="badge bg-primary-subtle text-primary">#{{ customer.rank }}</span></td>
                                <td class="fw-semibold">{{ customer.customerName }}</td>
                                <td>{{ customer.phone || '—' }}</td>
                                <td class="text-end">{{ formatNumber(customer.totalOrders) }}</td>
                                <td class="text-end">{{ formatCurrency(customer.totalSpent) }}</td>
                                <td class="text-end">{{ formatCurrency(customer.averageOrderValue) }}</td>
                                <td>{{ formatDate(customer.lastOrderDate) }}</td>
                            </tr>
                            <tr v-if="!topCustomers.length">
                                <td colspan="7" class="text-center text-muted py-4">Chưa có dữ liệu khách hàng.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card table-card">
                <div class="card-header border-0">
                    <h5 class="mb-1">Hiệu suất nhân viên</h5>
                    <p class="text-muted mb-0">Top nhân viên theo doanh số</p>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Thứ hạng</th>
                                <th>Nhân viên</th>
                                <th>Vai trò</th>
                                <th class="text-end">Số đơn</th>
                                <th class="text-end">Doanh thu</th>
                                <th class="text-end">Đơn TB</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="staff in staffPerformance" :key="staff.userId">
                                <td><span class="badge bg-success-subtle text-success">#{{ staff.rank }}</span></td>
                                <td class="fw-semibold">{{ staff.fullName || staff.username }}</td>
                                <td><span class="role-chip">{{ prettyRole(staff.role) }}</span></td>
                                <td class="text-end">{{ formatNumber(staff.totalOrders) }}</td>
                                <td class="text-end">{{ formatCurrency(staff.totalRevenue) }}</td>
                                <td class="text-end">{{ formatCurrency(staff.averageOrderValue) }}</td>
                            </tr>
                            <tr v-if="!staffPerformance.length">
                                <td colspan="6" class="text-center text-muted py-4">Chưa có dữ liệu nhân viên.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { formatCurrency } from '@/utils/formatters'
import { useThemePreference } from '@/composables/useThemePreference'

const props = defineProps({
    topCustomers: { type: Array, default: () => [] },
    staffPerformance: { type: Array, default: () => [] },
    totalExpenses: { type: Object, default: null },
    totalImportedCost: { type: Object, default: null }
})

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
        colors,
        grid: {
            strokeDashArray: 4,
            borderColor: dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: { style: { ...labelStyle } },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            crosshairs: {
                stroke: {
                    color: dark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)',
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
        legend: { position: 'bottom', labels: { colors: dark ? '#cbd5f5' : '#475569' } },
        tooltip: {
            theme: dark ? 'dark' : 'light',
            y: {
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
                        opacityFrom: dark ? 0.4 : 0.5,
                        opacityTo: dark ? 0.07 : 0.15,
                        stops: [0, 90, 100]
                    }
                },
        plotOptions: {
            bar: {
                columnWidth: '55%',
                borderRadius: 8,
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

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value ?? 0)

const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('vi-VN')
}

const prettyRole = (role) => {
    if (!role) return '—'
    return role.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase())
}

const buildTotals = (source, key) => {
    if (!source) return { totalExpenses: 0, totalImportedCost: 0, range: '' }
    const start = source.startDate
    const end = source.endDate
    const range = [start, end].filter(Boolean).join(' → ')
    const totalKey = key || 'totalExpenses'
    return {
        [totalKey]: source[totalKey] ?? 0,
        range
    }
}

const expenseTotals = computed(() => {
    const totals = buildTotals(props.totalExpenses ?? {}, 'totalExpenses')
    return {
        totalExpenses: totals.totalExpenses ?? 0,
        range: totals.range
    }
})

const importTotals = computed(() => {
    const totals = buildTotals(props.totalImportedCost ?? {}, 'totalImportedIngredientCost')
    return {
        totalImportedCost: totals.totalImportedIngredientCost ?? 0,
        range: totals.range
    }
})

const customerInsights = computed(() => {
    const totalCustomers = props.topCustomers.length
    const totalRevenue = props.topCustomers.reduce((sum, customer) => sum + (customer.totalSpent ?? 0), 0)
    return {
        totalCustomers,
        averageSpendPerCustomer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    }
})

const staffInsights = computed(() => {
    const totalStaff = props.staffPerformance.length
    const totalRevenue = props.staffPerformance.reduce((sum, staff) => sum + (staff.totalRevenue ?? 0), 0)
    return {
        totalStaff,
        averageRevenuePerStaff: totalStaff > 0 ? totalRevenue / totalStaff : 0
    }
})

const customerMetric = ref('spend')
const customerChartType = ref('bar')
const customerLimit = ref('5')
const staffMetric = ref('revenue')
const staffChartType = ref('bar')

const limitedCustomers = computed(() => {
    if (customerLimit.value === 'all') return props.topCustomers
    const limit = Number(customerLimit.value)
    return props.topCustomers.slice(0, Number.isNaN(limit) ? 5 : limit)
})

const resolvedCustomerChartType = computed(() => customerChartType.value === 'horizontalBar' ? 'bar' : customerChartType.value)

const customerChartSeries = computed(() => {
    if (!limitedCustomers.value.length) return []
    const values = limitedCustomers.value.map((customer) => customerMetric.value === 'spend'
        ? customer.totalSpent ?? 0
        : customer.totalOrders ?? 0)
    if (customerChartType.value === 'pie') return values
    return [
        {
            name: customerMetric.value === 'spend' ? 'Doanh thu' : 'Số đơn',
            data: values
        }
    ]
})

const customerChartOptions = computed(() => {
    const labels = limitedCustomers.value.map((customer, index) => customer.customerName ?? `Khách #${customer.customerId ?? index + 1}`)
    const base = createBaseOptions(resolvedCustomerChartType.value, VIBRANT_PALETTE)

    return mergeOptions(base, {
        labels,
        xaxis: resolvedCustomerChartType.value === 'bar' ? { categories: labels } : base.xaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: customerChartType.value === 'horizontalBar'
            },
            pie: {
                donut: { size: '68%' }
            },
            radialBar: {
                hollow: { size: '55%' }
            }
        },
        dataLabels: resolvedCustomerChartType.value === 'pie' || resolvedCustomerChartType.value === 'donut'
            ? {
                enabled: true,
                style: { colors: ['#ffffff'], fontWeight: 600 }
            }
            : base.dataLabels,
        legend: {
            position: 'bottom'
        },
        tooltip: {
            y: {
                formatter: (value) => customerMetric.value === 'spend' ? formatCurrency(value) : formatNumber(value)
            }
        }
    })
})

const resolvedStaffChartType = computed(() => staffChartType.value === 'horizontalBar' ? 'bar' : staffChartType.value)

const staffChartSeries = computed(() => {
    if (!props.staffPerformance.length) return []
    const values = props.staffPerformance.map((staff) => staffMetric.value === 'revenue'
        ? staff.totalRevenue ?? 0
        : staff.totalOrders ?? 0)
    if (staffChartType.value === 'radar') {
        return [
            {
                name: staffMetric.value === 'revenue' ? 'Doanh thu' : 'Số đơn',
                data: values
            }
        ]
    }
    return [
        {
            name: staffMetric.value === 'revenue' ? 'Doanh thu' : 'Số đơn',
            data: values
        }
    ]
})

const staffChartOptions = computed(() => {
    const labels = props.staffPerformance.map((staff, index) => staff.fullName || staff.username || `NV #${staff.userId ?? index + 1}`)
    const base = createBaseOptions(resolvedStaffChartType.value, VIBRANT_PALETTE)

    return mergeOptions(base, {
        labels,
        xaxis: resolvedStaffChartType.value === 'bar' ? { categories: labels } : base.xaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: staffChartType.value === 'horizontalBar'
            }
        },
        stroke: staffChartType.value === 'radar'
            ? { width: 2 }
            : { curve: 'smooth', width: resolvedStaffChartType.value === 'bar' ? 0 : 3 },
        tooltip: {
            y: {
                formatter: (value) => staffMetric.value === 'revenue' ? formatCurrency(value) : formatNumber(value)
            }
        }
    })
})
</script>

<style scoped>
.customers-staff {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.chart-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.chart-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.chart-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-body) {
    padding: var(--spacing-4);
}

.chart-card :global(.form-select) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.chart-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-4);
}

.summary-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    transition: all var(--transition-base);
}

.summary-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.summary-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: 24px;
}

.summary-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.summary-card__meta span {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-card__meta strong {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.summary-card__meta small {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 1.5rem;
}

.table-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.table-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.table-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.table-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.table-card :global(.card-body) {
    padding: var(--spacing-4);
}

/* Minimal Table Styling */
.table-card :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.table-card :global(.table thead th) {
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    text-align: left;
}

.table-card :global(.table tbody td) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.role-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    background: var(--color-badge-soft-bg);
    color: var(--color-badge-soft-text);
    font-family: var(--font-family-sans);
}

.bg-emerald-light { background: var(--color-soft-emerald); color: var(--color-success); }
.bg-sky-light { background: var(--color-soft-sky); color: var(--color-info); }
.bg-indigo-light { background: var(--color-soft-primary); color: var(--color-primary); }
.bg-amber-light { background: var(--color-soft-amber); color: var(--color-warning); }

@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
