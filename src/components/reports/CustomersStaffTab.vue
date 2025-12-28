<template>
  <div class="customers-staff">
    <!-- Summary metrics - Di chuyển lên trên cùng -->
    <div class="summary-grid">
      <div class="card summary-card">
        <div class="summary-card__icon bg-indigo-light">
          <i class="bi bi-people-fill" />
        </div>
        <div class="summary-card__meta">
          <span>Tổng khách hàng</span>
          <strong>{{ formatNumber(customerInsights.totalCustomers) }}</strong>
          <small>Khách hàng trong kỳ</small>
        </div>
      </div>
      <div class="card summary-card">
        <div class="summary-card__icon bg-primary-light">
          <i class="bi bi-person-plus" />
        </div>
        <div class="summary-card__meta">
          <span>Khách mới tháng này</span>
          <strong>{{ formatNumber(newCustomersThisMonth) }}</strong>
          <small>Khách hàng mới</small>
        </div>
      </div>
      <div class="card summary-card">
        <div class="summary-card__icon bg-emerald-light">
          <i class="bi bi-briefcase-fill" />
        </div>
        <div class="summary-card__meta">
          <span>Tổng nhân viên</span>
          <strong>{{ formatNumber(staffInsights.totalStaff) }}</strong>
          <small>Nhân viên trong hệ thống</small>
        </div>
      </div>
      <div class="card summary-card">
        <div class="summary-card__icon bg-amber-light">
          <i class="bi bi-person-check-fill" />
        </div>
        <div class="summary-card__meta">
          <span>Nhân viên hoạt động</span>
          <strong>{{ formatNumber(activeStaffCount) }}</strong>
          <small>Có doanh số trong kỳ</small>
        </div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Top khách hàng
            </h5>
            <p class="text-muted mb-0">
              Theo {{ customerMetric === 'spend' ? 'tổng chi tiêu' : 'số đơn' }}
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <select
              v-model="customerMetric"
              class="form-select form-select-sm"
            >
              <option value="spend">
                Doanh thu
              </option>
              <option value="orders">
                Số đơn
              </option>
            </select>
            <!-- Chart type selector đã được ẩn - sử dụng mặc định horizontalBar -->
            <select
              v-model="customerLimit"
              class="form-select form-select-sm"
            >
              <option value="5">
                Top 5
              </option>
              <option value="10">
                Top 10
              </option>
              <option value="all">
                Tất cả
              </option>
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
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có dữ liệu khách hàng.
          </p>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Hiệu suất nhân viên
            </h5>
            <p class="text-muted mb-0">
              Theo {{ staffMetric === 'revenue' ? 'doanh thu' : 'số đơn' }}
            </p>
          </div>
          <div class="chart-controls d-flex gap-2">
            <select
              v-model="staffMetric"
              class="form-select form-select-sm"
            >
              <option value="revenue">
                Doanh thu
              </option>
              <option value="orders">
                Số đơn
              </option>
            </select>
            <!-- Chart type selector đã được ẩn - sử dụng mặc định horizontalBar -->
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
          <p
            v-else
            class="text-muted mb-0"
          >
            Chưa có dữ liệu nhân viên.
          </p>
        </div>
      </div>
    </div>

    <!-- Summary metrics đã được di chuyển lên trên -->

    <div class="grid">
      <div class="card table-card">
        <div class="card-header border-0">
          <h5 class="mb-1">
            Khách hàng tiêu biểu
          </h5>
          <p class="text-muted mb-0">
            Top khách hàng theo doanh số và tần suất mua
          </p>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Thứ hạng</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th class="text-end">
                  Số đơn
                </th>
                <th class="text-end">
                  Tổng chi tiêu
                </th>
                <th class="text-end">
                  Đơn TB
                </th>
                <th>Đơn gần nhất</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in topCustomers"
                :key="customer.customerId"
              >
                <td><span class="badge bg-primary-subtle text-primary">#{{ customer.rank }}</span></td>
                <td class="fw-semibold">
                  {{ capitalizeWords(customer.customerName) }}
                </td>
                <td>{{ customer.phone || '—' }}</td>
                <td class="text-end">
                  {{ formatNumber(customer.totalOrders) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(customer.totalSpent) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(customer.averageOrderValue) }}
                </td>
                <td>{{ formatDate(customer.lastOrderDate) }}</td>
              </tr>
              <tr v-if="!topCustomers.length">
                <td
                  colspan="7"
                  class="text-center text-muted py-4"
                >
                  Chưa có dữ liệu khách hàng.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card table-card">
        <div class="card-header border-0">
          <h5 class="mb-1">
            Hiệu suất nhân viên
          </h5>
          <p class="text-muted mb-0">
            Top nhân viên theo doanh số
          </p>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Thứ hạng</th>
                <th>Nhân viên</th>
                <th>Vai trò</th>
                <th class="text-end">
                  Số đơn
                </th>
                <th class="text-end">
                  Doanh thu
                </th>
                <th class="text-end">
                  Đơn TB
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="staff in staffPerformance"
                :key="staff.userId"
              >
                <td><span class="badge bg-success-subtle text-success">#{{ staff.rank }}</span></td>
                <td class="fw-semibold">
                  {{ capitalizeWords(staff.fullName || staff.username) }}
                </td>
                <td>
                  <span
                    class="role-chip"
                    :class="getRoleBadgeClass(staff.role)"
                  >{{ prettyRole(staff.role) }}</span>
                </td>
                <td class="text-end">
                  {{ formatNumber(staff.totalOrders) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(staff.totalRevenue) }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(staff.averageOrderValue) }}
                </td>
              </tr>
              <tr v-if="!staffPerformance.length">
                <td
                  colspan="6"
                  class="text-center text-muted py-4"
                >
                  Chưa có dữ liệu nhân viên.
                </td>
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

const baseLabelStyle = computed(() => ({ colors: isDark.value ? '#EFF2F6' : '#64748b', fontSize: '12px', fontWeight: isDark.value ? 500 : 400 }))
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
            toolbar: { show: false }, // Ẩn toolbar để giao diện chuyên nghiệp hơn
            foreColor: dark ? '#EFF2F6' : '#475569',
            background: 'transparent'
        },
        stroke: isCircular
            ? { colors: ['#ffffff'], width: 2 }
            : { curve: 'smooth', width: isBar ? 0 : 3 },
        dataLabels: { enabled: false },
        colors,
        grid: {
            strokeDashArray: 4,
            borderColor: dark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.35)',
            padding: { top: 8, bottom: 8, left: 12, right: 12 }
        },
        xaxis: {
            categories: [],
            labels: { style: { ...labelStyle } },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                strokeWidth: dark ? 1.5 : 1
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(203, 213, 225, 0.6)',
                strokeWidth: dark ? 1.5 : 1
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
        legend: { position: 'bottom', labels: { colors: dark ? '#EFF2F6' : '#475569', fontWeight: dark ? 500 : 400 } },
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

// Hàm chuẩn hóa tên người: viết hoa chữ cái đầu mỗi từ
const capitalizeWords = (text) => {
    if (!text || typeof text !== 'string') return text || '—'
    return text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const prettyRole = (role) => {
    if (!role) return '—'
    return role.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase())
}

// Các computed expenseTotals và importTotals đã được xóa vì không thuộc tab này

const customerInsights = computed(() => {
    const totalCustomers = props.topCustomers.length
    const totalRevenue = props.topCustomers.reduce((sum, customer) => sum + (customer.totalSpent ?? 0), 0)
    return {
        totalCustomers,
        averageSpendPerCustomer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    }
})

// Tính số khách hàng mới trong tháng này
const newCustomersThisMonth = computed(() => {
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    return props.topCustomers.filter(customer => {
        const created = customer.createdAt ? new Date(customer.createdAt) : (customer.lastOrderDate ? new Date(customer.lastOrderDate) : null)
        return created && created >= thisMonth
    }).length
})

const staffInsights = computed(() => {
    const totalStaff = props.staffPerformance.length
    const totalRevenue = props.staffPerformance.reduce((sum, staff) => sum + (staff.totalRevenue ?? 0), 0)
    return {
        totalStaff,
        averageRevenuePerStaff: totalStaff > 0 ? totalRevenue / totalStaff : 0
    }
})

// Tính số nhân viên hoạt động (có doanh số > 0)
const activeStaffCount = computed(() => props.staffPerformance.filter(staff => (staff.totalRevenue ?? 0) > 0 || (staff.totalOrders ?? 0) > 0).length)

// Phân cấp màu cho badge vai trò
const getRoleBadgeClass = (role) => {
    if (!role) return 'role-chip--default'
    const roleUpper = String(role).toUpperCase()
    if (roleUpper.includes('ADMIN') || roleUpper.includes('ROLE_ADMIN')) {
        return 'role-chip--admin' // Đỏ/Tím cho Admin
    }
    if (roleUpper.includes('MANAGER') || roleUpper.includes('ROLE_MANAGER') || roleUpper.includes('QUẢN LÝ')) {
        return 'role-chip--manager' // Xanh đậm cho Manager
    }
    return 'role-chip--staff' // Xanh nhạt cho Staff (mặc định)
}

const customerMetric = ref('spend')
// Cố định biểu đồ khách hàng là horizontalBar để dễ đọc tên
const customerChartType = ref('horizontalBar')
const customerLimit = ref('5')
const staffMetric = ref('revenue')
// Cố định biểu đồ nhân viên là horizontalBar để tránh text nghiêng
const staffChartType = ref('horizontalBar')

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

// Màu riêng cho biểu đồ khách hàng (xanh dương nhạt)
const CUSTOMER_CHART_COLOR = '#3b82f6' // Xanh dương nhạt để phân biệt với nhân viên

// Màu riêng cho biểu đồ nhân viên (xanh lá)
const STAFF_CHART_COLOR = '#22c55e' // Xanh lá để phân biệt với khách hàng

const customerChartOptions = computed(() => {
    const labels = limitedCustomers.value.map((customer, index) => capitalizeWords(customer.customerName ?? `Khách #${customer.customerId ?? index + 1}`))
    // Dùng màu riêng cho biểu đồ khách hàng
    const base = createBaseOptions(resolvedCustomerChartType.value, [CUSTOMER_CHART_COLOR])

    return mergeOptions(base, {
        labels,
        xaxis: resolvedCustomerChartType.value === 'bar'
            ? {
                ...base.xaxis,
                categories: labels,
                labels: {
                    ...base.xaxis.labels,
                    rotate: customerChartType.value === 'horizontalBar' ? 0 : -35,
                    style: {
                        ...base.xaxis.labels.style,
                        fontSize: customerChartType.value === 'horizontalBar' ? '13px' : '12px'
                    },
                    formatter: customerChartType.value === 'horizontalBar'
                        ? (value) => customerMetric.value === 'spend' ? formatCurrency(value) : formatNumber(value)
                        : undefined
                }
            }
            : base.xaxis,
        yaxis: resolvedCustomerChartType.value === 'bar' && customerChartType.value === 'horizontalBar'
            ? {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    style: {
                        ...base.yaxis.labels.style,
                        fontSize: '13px' // Tăng font size cho dễ đọc
                    }
                }
            }
            : base.yaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: customerChartType.value === 'horizontalBar',
                columnWidth: customerChartType.value === 'horizontalBar' ? '75%' : '55%',
                barHeight: customerChartType.value === 'horizontalBar' ? '70%' : undefined
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
    const labels = props.staffPerformance.map((staff, index) => capitalizeWords(staff.fullName || staff.username || `NV #${staff.userId ?? index + 1}`))
    // Dùng màu riêng cho biểu đồ nhân viên
    const base = createBaseOptions(resolvedStaffChartType.value, [STAFF_CHART_COLOR])

    return mergeOptions(base, {
        labels,
        xaxis: resolvedStaffChartType.value === 'bar'
            ? {
                ...base.xaxis,
                categories: labels,
                labels: {
                    ...base.xaxis.labels,
                    rotate: staffChartType.value === 'horizontalBar' ? 0 : -35,
                    style: {
                        ...base.xaxis.labels.style,
                        fontSize: staffChartType.value === 'horizontalBar' ? '13px' : '12px'
                    },
                    formatter: staffChartType.value === 'horizontalBar'
                        ? (value) => staffMetric.value === 'revenue' ? formatCurrency(value) : formatNumber(value)
                        : undefined
                }
            }
            : base.xaxis,
        yaxis: resolvedStaffChartType.value === 'bar' && staffChartType.value === 'horizontalBar'
            ? {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    style: {
                        ...base.yaxis.labels.style,
                        fontSize: '13px' // Tăng font size cho dễ đọc
                    }
                }
            }
            : base.yaxis,
        plotOptions: {
            bar: {
                borderRadius: 8,
                horizontal: staffChartType.value === 'horizontalBar',
                columnWidth: staffChartType.value === 'horizontalBar' ? '75%' : '55%',
                barHeight: staffChartType.value === 'horizontalBar' ? '70%' : undefined
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
    font-size: var(--font-size-sm);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    min-width: 100px;
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
    line-height: 1.6; /* Tăng line-height để text không bị cắt */
    vertical-align: middle; /* Căn giữa theo chiều dọc */
}

.table-card :global(.table tbody td.fw-semibold) {
    line-height: 1.6;
    word-break: break-word; /* Tự động xuống dòng nếu tên quá dài */
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

/* Phân cấp màu cho vai trò */
.role-chip--admin {
    background: rgba(239, 68, 68, 0.15); /* Đỏ nhạt */
    color: #dc2626; /* Đỏ đậm */
}

.role-chip--manager {
    background: rgba(37, 99, 235, 0.15); /* Xanh dương nhạt */
    color: #1d4ed8; /* Xanh dương đậm */
}

.role-chip--staff {
    background: rgba(59, 130, 246, 0.1); /* Xanh dương rất nhạt */
    color: #2563eb; /* Xanh dương */
}

.role-chip--default {
    background: var(--color-badge-soft-bg);
    color: var(--color-badge-soft-text);
}

.bg-emerald-light { background: var(--color-soft-emerald); color: var(--color-success); }
.bg-sky-light { background: var(--color-soft-sky); color: var(--color-info); }
.bg-indigo-light { background: var(--color-soft-primary); color: var(--color-primary); }
.bg-amber-light { background: var(--color-soft-amber); color: var(--color-warning); }
.bg-primary-light { background: var(--color-soft-primary); color: var(--color-primary); }

@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
