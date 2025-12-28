<template>
  <div class="sales-analysis">
    <div class="filters card card-inline">
      <div class="card-body d-flex flex-wrap gap-4 align-items-end">
        <div>
          <label class="form-label mb-1">Xếp hạng theo</label>
          <select
            class="form-select"
            :value="sortBy"
            @change="onSortChange($event.target.value)"
          >
            <option value="quantity">
              Số lượng bán
            </option>
            <option value="revenue">
              Doanh thu
            </option>
          </select>
        </div>
        <div>
          <label class="form-label mb-1">Số lượng sản phẩm top</label>
          <select
            class="form-select"
            :value="topLimit"
            @change="onTopChange($event.target.value)"
          >
            <option
              v-for="option in topOptions"
              :key="option"
              :value="option"
            >
              {{ option === 'all' ? 'Tất cả' : `Top ${option}` }}
            </option>
          </select>
        </div>
        <!-- Dropdown "Loại biểu đồ" đã được ẩn - sử dụng mặc định horizontalBar cho Top sản phẩm và donut cho Danh mục -->
        <div>
          <label class="form-label mb-1">Sắp xếp chi tiết</label>
          <select
            class="form-select"
            :value="tableSort"
            @change="onTableSort($event.target.value)"
          >
            <option value="quantity-desc">
              Số lượng ↓
            </option>
            <option value="quantity-asc">
              Số lượng ↑
            </option>
            <option value="revenue-desc">
              Doanh thu ↓
            </option>
            <option value="revenue-asc">
              Doanh thu ↑
            </option>
            <option value="name-asc">
              Tên A-Z
            </option>
            <option value="name-desc">
              Tên Z-A
            </option>
          </select>
        </div>
        <p class="text-muted mb-0">
          Tổng doanh thu: {{ formatCurrency(productSummary?.totalRevenueGenerated ?? 0) }} · Tổng sản phẩm: {{ formatNumber(productSummary?.totalQuantitySold ?? 0) }}
        </p>
      </div>
    </div>

    <div class="chart-grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Top sản phẩm bán chạy
            </h5>
            <p class="text-muted mb-0">
              Theo {{ sortBy === 'revenue' ? 'doanh thu' : 'số lượng' }}
            </p>
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="productChartReady && safeProductSeries && safeProductOptions"
            :key="`product-${productChartKey}`"
            :type="resolvedProductChartType"
            height="340"
            :series="safeProductSeries"
            :options="safeProductOptions"
          />
          <div
            v-else
            class="text-center text-muted py-4"
          >
            <i class="bi bi-graph-up" />
            <p class="mb-0 mt-2">
              Chưa có dữ liệu để hiển thị
            </p>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header border-0">
          <h5 class="mb-1">
            Doanh thu theo danh mục
          </h5>
          <p class="text-muted mb-0">
            Phân loại theo nhóm sản phẩm
          </p>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="categoryChartReady && safeCategorySeries && safeCategoryOptions"
            :key="`category-${categoryChartKey}`"
            :type="resolvedCategoryChartType"
            height="320"
            :series="safeCategorySeries"
            :options="safeCategoryOptions"
          />
          <div
            v-else
            class="text-center text-muted py-4"
          >
            <i class="bi bi-pie-chart" />
            <p class="mb-0 mt-2">
              Chưa có dữ liệu để hiển thị
            </p>
          </div>
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
              <th class="text-end">
                Số lượng
              </th>
              <th class="text-end">
                Doanh thu
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in sortedTableItems"
              :key="item.productId"
            >
              <td><span class="badge bg-primary-subtle text-primary">#{{ item.rank }}</span></td>
              <td class="fw-semibold product-name-cell">
                {{ item.productName }}
              </td>
              <td class="text-end">
                {{ formatNumber(item.totalQuantitySold) }}
              </td>
              <td class="text-end">
                {{ formatCurrency(item.totalRevenueGenerated) }}
              </td>
            </tr>
            <tr v-if="!sortedTableItems.length">
              <td
                colspan="4"
                class="text-center text-muted py-4"
              >
                Chưa có dữ liệu bán hàng.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="chart-grid">
      <div class="card chart-card">
        <div class="card-header border-0">
          <h5 class="mb-1">
            Doanh thu theo khung giờ
          </h5>
          <p class="text-muted mb-0">
            Phủ đủ 24 giờ trong giai đoạn
          </p>
        </div>
        <div class="card-body">
          <ApexChart
            v-if="hourlyChartReady && safeHourlySeries && safeHourlyOptions"
            type="area"
            height="320"
            :series="safeHourlySeries"
            :options="safeHourlyOptions"
          />
          <div
            v-else
            class="text-center text-muted py-4"
          >
            <i class="bi bi-clock-history" />
            <p class="mb-0 mt-2">
              Chưa có dữ liệu để hiển thị
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
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

// Chart ready flags - separate for each chart to prevent conflicts
const productChartReady = ref(false)
const categoryChartReady = ref(false)
const hourlyChartReady = ref(false)

// Chart keys for force re-render
const productChartKey = ref(0)
const categoryChartKey = ref(0)

// Safe data refs - store validated, frozen data
const safeProductSeries = ref(null)
const safeProductOptions = ref(null)
const safeCategorySeries = ref(null)
const safeCategoryOptions = ref(null)
const safeHourlySeries = ref(null)
const safeHourlyOptions = ref(null)

const VIBRANT_PALETTE = Object.freeze([
    '#2563eb', '#f97316', '#22c55e', '#facc15', '#ec4899',
    '#9333ea', '#0ea5e9', '#ef4444', '#14b8a6', '#8b5cf6'
])

// Deep clone utility
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (Array.isArray(obj)) return obj.map(item => deepClone(item))
    const cloned = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key])
        }
    }
    return cloned
}

// Validate series structure
const validateSeries = (series, chartType) => {
    if (!series) return false
    if (!Array.isArray(series)) return false
    if (series.length === 0) return false

    const first = series[0]
    if (first === undefined || first === null) return false

    // Với pie/donut - mảng số
    if (chartType === 'pie' || chartType === 'donut') {
        return series.every(v => {
            const num = Number(v)
            return typeof num === 'number' && Number.isFinite(num) && !isNaN(num) && num >= 0
        }) && series.some(v => Number(v) > 0)
    }

    // Với bar/line/area/radar - mảng objects với data
    if (typeof first === 'object') {
        return series.every(item => {
            if (!item || typeof item !== 'object') return false
            if (!('data' in item)) return false
            if (!Array.isArray(item.data)) return false
            if (item.data.length === 0) return false
            return item.data.every(v => {
                const num = Number(v)
                return typeof num === 'number' && Number.isFinite(num) && !isNaN(num) && num >= 0
            })
        })
    }

    return false
}

// Create safe series - always returns valid structure
const createSafeSeries = (rawSeries, chartType) => {
    try {
        if (!rawSeries) {
            if (chartType === 'pie' || chartType === 'donut') return [0]
            return [{ name: 'Doanh thu', data: [0] }]
        }

        if (!Array.isArray(rawSeries)) {
            if (chartType === 'pie' || chartType === 'donut') return [0]
            return [{ name: 'Doanh thu', data: [0] }]
        }

        if (rawSeries.length === 0) {
            if (chartType === 'pie' || chartType === 'donut') return [0]
            return [{ name: 'Doanh thu', data: [0] }]
        }

        // Với pie/donut
        if (chartType === 'pie' || chartType === 'donut') {
            const numbers = rawSeries
                .map(v => {
                    const num = Number(v)
                    return Number.isFinite(num) && !isNaN(num) && num >= 0 ? num : 0
                })
                .filter(v => v > 0)
            return numbers.length > 0 ? numbers : [0]
        }

        // Với bar/line/area/radar
        const objects = rawSeries.map(item => {
            if (!item || typeof item !== 'object') {
                return { name: 'Doanh thu', data: [0] }
            }

            const data = Array.isArray(item.data) ? item.data : []
            const validData = data
                .map(v => {
                    const num = Number(v)
                    return Number.isFinite(num) && !isNaN(num) && num >= 0 ? num : 0
                })

            return {
                name: String(item.name || 'Doanh thu'),
                data: validData.length > 0 ? validData : [0]
            }
        })

        return objects.length > 0 ? objects : [{ name: 'Doanh thu', data: [0] }]
    } catch (error) {
        console.error('Error creating safe series:', error)
        if (chartType === 'pie' || chartType === 'donut') return [0]
        return [{ name: 'Doanh thu', data: [0] }]
    }
}

// Create safe options - always returns valid structure
const createSafeOptions = (rawOptions, chartType) => {
    try {
        if (!rawOptions || typeof rawOptions !== 'object') {
            return createBaseOptions(chartType)
        }

        const options = deepClone(rawOptions)

        // Ensure chart.type exists
        if (!options.chart) options.chart = {}
        options.chart.type = chartType

        // Handle xaxis based on chart type
        if (chartType === 'pie' || chartType === 'donut') {
            // Xóa xaxis hoàn toàn cho pie/donut
            delete options.xaxis
        } else {
            // Với bar/line/area/radar, đảm bảo xaxis.categories là mảng
            if (!options.xaxis) options.xaxis = {}
            if (!Array.isArray(options.xaxis.categories)) {
                options.xaxis.categories = []
            }
        }

        return options
    } catch (error) {
        console.error('Error creating safe options:', error)
        return createBaseOptions(chartType)
    }
}

// Base options factory
const createBaseOptions = (type, colors = VIBRANT_PALETTE) => {
    const isBar = type === 'bar'
    const isCircular = ['pie', 'donut', 'radialBar'].includes(type)
    const dark = isDark.value

    const base = {
        chart: {
            type,
            toolbar: { show: false }, // Ẩn toolbar để giao diện chuyên nghiệp hơn
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
        colors,
        legend: {
            position: 'bottom',
            labels: { colors: dark ? '#cbd5f5' : '#475569' }
        },
        tooltip: {
            theme: dark ? 'dark' : 'light',
            y: { formatter: (value) => value ?? 0 }
        }
    }

    // Only add xaxis for non-circular charts
    if (!isCircular) {
        base.xaxis = {
            categories: [],
            labels: {
                colors: dark ? '#cbd5f5' : '#64748b',
                fontSize: '12px',
                rotate: 0
            },
            axisBorder: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            },
            axisTicks: {
                color: dark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(203, 213, 225, 0.6)'
            }
        }
    }

    base.yaxis = {
        labels: {
            colors: dark ? '#cbd5f5' : '#64748b',
            fontSize: '12px',
            formatter: (value) => value ?? 0
        }
    }

    base.fill = isBar
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
            }

    base.plotOptions = {
        bar: {
            horizontal: false,
            columnWidth: '55%',
            borderRadius: 6,
            distributed: false
        }
    }

    return base
}

const topOptions = [5, 10, 15, 20, 'all']
const DEFAULT_TABLE_SORT = 'quantity-desc'

const tableSort = computed({
    get: () => props.tableSort ?? DEFAULT_TABLE_SORT,
    set: (value) => emit('update:tableSort', value)
})

// Cố định biểu đồ Top sản phẩm là horizontalBar để tránh text nghiêng
const productChartType = computed({
    get: () => 'horizontalBar', // Cố định horizontalBar
    set: (value) => {} // Không cho phép thay đổi
})

// Cố định biểu đồ danh mục là donut
const categoryChartType = computed({
    get: () => 'donut', // Cố định donut
    set: (value) => {} // Không cho phép thay đổi
})

const resolvedProductChartType = computed(() => {
    if (productChartType.value === 'horizontalBar') return 'bar'
    return productChartType.value
})

const resolvedCategoryChartType = computed(() => categoryChartType.value)

// Applied top best sellers
const appliedTopBestSellers = computed(() => {
    try {
        const sellers = Array.isArray(props.bestSellers) ? props.bestSellers : []
        if (props.topLimit === 'all') return sellers
        const limit = Number(props.topLimit)
        if (Number.isNaN(limit) || limit <= 0) return sellers
        return sellers.slice(0, limit)
    } catch {
        return []
    }
})

// Product chart series
const productChartSeries = computed(() => {
    try {
        const data = appliedTopBestSellers.value
        if (!Array.isArray(data) || data.length === 0) {
            return [{ name: 'Doanh thu', data: [0] }]
        }

        const isRevenue = props.sortBy === 'revenue'
        const values = data.map(item => {
            const val = isRevenue
                ? Number(item?.totalRevenueGenerated)
                : Number(item?.totalQuantitySold)
            return Number.isFinite(val) && !isNaN(val) && val >= 0 ? val : 0
        })

        return [{
            name: isRevenue ? 'Doanh thu' : 'Số lượng',
            data: values.length > 0 ? values : [0]
        }]
    } catch {
        return [{ name: 'Doanh thu', data: [0] }]
    }
})

// Product chart options
const productChartOptions = computed(() => {
    try {
        const applied = appliedTopBestSellers.value
        const categories = applied.length > 0
            ? applied.map((item, idx) => String(item?.productName || `SP #${idx + 1}`))
            : []

        const isRevenue = props.sortBy === 'revenue'
        // Sử dụng màu xanh dương chủ đạo (primary color) thay vì xanh lá
        const base = createBaseOptions(resolvedProductChartType.value, ['#2563eb'])
        const formatter = (val) => {
            const num = Number(val)
            return Number.isFinite(num) && !isNaN(num)
                ? (isRevenue ? formatCurrency(num) : formatNumber(num))
                : (isRevenue ? formatCurrency(0) : formatNumber(0))
        }

        const isRadar = resolvedProductChartType.value === 'radar'

        const options = {
            ...base,
            yaxis: {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    formatter
                }
            },
            tooltip: {
                ...base.tooltip,
                y: { formatter }
            },
            plotOptions: {
                ...base.plotOptions,
                bar: {
                    ...base.plotOptions.bar,
                    horizontal: productChartType.value === 'horizontalBar',
                    columnWidth: productChartType.value === 'horizontalBar' ? '75%' : '55%', // Tăng độ dày bar ngang
                    barHeight: productChartType.value === 'horizontalBar' ? '70%' : undefined // Tăng chiều cao bar ngang
                }
            }
        }

        // Handle xaxis
        if (isRadar) {
            delete options.xaxis
        } else {
            // Với ApexCharts, categories luôn ở xaxis, dù horizontal hay vertical
            // Khi horizontal=true, ApexCharts tự động hiển thị categories trên trục Y
            options.xaxis = {
                ...base.xaxis,
                categories: Array.isArray(categories) ? categories : [],
                labels: {
                    ...base.xaxis.labels,
                    rotate: productChartType.value === 'horizontalBar' ? 0 : -35, // Không rotate cho horizontal bar
                    style: {
                        ...base.xaxis.labels.style,
                        fontSize: productChartType.value === 'horizontalBar' ? '13px' : '12px' // Tăng font size cho horizontal bar
                    },
                    // Với horizontal bar, formatter cho trục X (giá trị)
                    formatter: productChartType.value === 'horizontalBar' ? formatter : undefined
                }
            }
            // Với horizontal bar, tăng font size cho yaxis (labels sản phẩm)
            if (productChartType.value === 'horizontalBar') {
                options.yaxis = {
                    ...base.yaxis,
                    labels: {
                        ...base.yaxis.labels,
                        style: {
                            ...base.yaxis.labels.style,
                            fontSize: '13px' // Tăng font size cho dễ đọc
                        }
                    }
                }
            }
        }

        return options
    } catch {
        return createBaseOptions(resolvedProductChartType.value)
    }
})

// Category chart series
const categoryChartSeries = computed(() => {
    try {
        const sales = Array.isArray(props.categorySales) ? props.categorySales : []
        if (sales.length === 0) {
            if (categoryChartType.value === 'bar') {
                return [{ name: 'Doanh thu', data: [0] }]
            }
            return [0]
        }

        const data = sales
            .map(item => {
                const val = Number(item?.totalRevenue)
                return Number.isFinite(val) && !isNaN(val) && val > 0 ? val : 0
            })
            .filter(v => v > 0)

        if (categoryChartType.value === 'pie' || categoryChartType.value === 'donut') {
            return data.length > 0 ? data : [0]
        }

        return [{
            name: 'Doanh thu',
            data: data.length > 0 ? data : [0]
        }]
    } catch {
        if (categoryChartType.value === 'bar') {
            return [{ name: 'Doanh thu', data: [0] }]
        }
        return [0]
    }
})

// Category chart options
const categoryChartOptions = computed(() => {
    try {
        const data = Array.isArray(props.categorySales) ? props.categorySales : []
        const labels = data.length > 0
            ? data.map((item, idx) => String(item?.categoryName || `DM #${idx + 1}`))
            : []

        const isBar = categoryChartType.value === 'bar'
        const isCircular = ['pie', 'donut'].includes(resolvedCategoryChartType.value)
        const base = createBaseOptions(resolvedCategoryChartType.value, VIBRANT_PALETTE)

        const options = {
            ...base,
            dataLabels: {
                ...base.dataLabels,
                enabled: !isBar,
                formatter: (val) => {
                    const num = Number(val)
                    return Number.isFinite(num) && !isNaN(num) ? `${num.toFixed(1)}%` : '0%'
                }
            },
            tooltip: {
                ...base.tooltip,
                y: {
                    formatter: (val) => {
                        const num = Number(val)
                        return Number.isFinite(num) && !isNaN(num) ? formatCurrency(num) : formatCurrency(0)
                    }
                }
            }
        }

        if (isCircular) {
            options.labels = labels.length > 0 ? labels : ['Không có dữ liệu']
            delete options.xaxis
        } else {
            options.xaxis = {
                ...base.xaxis,
                categories: labels.length > 0 ? labels : ['Không có dữ liệu']
            }
        }

        return options
    } catch {
        return createBaseOptions(resolvedCategoryChartType.value, VIBRANT_PALETTE)
    }
})

// Stacked series
const stackedChartSeries = computed(() => {
    try {
        const sellers = appliedTopBestSellers.value
        const topRevenue = sellers.reduce((sum, item) => {
            const val = Number(item?.totalRevenueGenerated)
            return sum + (Number.isFinite(val) && !isNaN(val) && val >= 0 ? val : 0)
        }, 0)

        const totalRevenue = Number(props.productSummary?.totalRevenueGenerated)
        const finalTotal = Number.isFinite(totalRevenue) && !isNaN(totalRevenue) && totalRevenue >= 0
            ? totalRevenue
            : topRevenue
        const remainder = Math.max(finalTotal - topRevenue, 0)

        return [
            { name: 'Top sản phẩm', data: [topRevenue >= 0 ? topRevenue : 0] },
            { name: 'Phần còn lại', data: [remainder >= 0 ? remainder : 0] }
        ]
    } catch {
        return [
            { name: 'Top sản phẩm', data: [0] },
            { name: 'Phần còn lại', data: [0] }
        ]
    }
})

// Stacked options
const stackedChartOptions = computed(() => {
    try {
        const base = createBaseOptions('bar', ['#2563eb', '#f97316'])
        return {
            ...base,
            chart: { ...base.chart, stacked: true, toolbar: { show: false } },
            xaxis: {
                ...base.xaxis,
                categories: ['Giai đoạn']
            },
            yaxis: {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    formatter: (val) => {
                        const num = Number(val)
                        return Number.isFinite(num) && !isNaN(num) ? formatCurrency(num) : formatCurrency(0)
                    }
                }
            },
            tooltip: {
                ...base.tooltip,
                y: {
                    formatter: (val) => {
                        const num = Number(val)
                        return Number.isFinite(num) && !isNaN(num) ? formatCurrency(num) : formatCurrency(0)
                    }
                }
            },
            plotOptions: {
                ...base.plotOptions,
                bar: {
                    ...base.plotOptions.bar,
                    columnWidth: '45%'
                }
            }
        }
    } catch {
        return createBaseOptions('bar', ['#2563eb', '#f97316'])
    }
})

// Hourly series
const hourlyChartSeries = computed(() => {
    try {
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const mapped = new Map(hours.map(h => [h, 0]))

        const sales = Array.isArray(props.hourlySales) ? props.hourlySales : []
        sales.forEach(item => {
            const hour = Number(item?.hour)
            if (Number.isFinite(hour) && !isNaN(hour) && hour >= 0 && hour < 24) {
                const revenue = Number(item?.totalRevenue) || Number(item?.revenue) || 0
                const current = mapped.get(hour) || 0
                const revNum = Number.isFinite(revenue) && !isNaN(revenue) && revenue >= 0 ? revenue : 0
                mapped.set(hour, current + revNum)
            }
        })

        const data = hours.map(h => {
            const val = mapped.get(h) || 0
            return Number.isFinite(val) && !isNaN(val) && val >= 0 ? val : 0
        })

        return [{
            name: 'Doanh thu',
            data: Array.isArray(data) && data.length === 24 ? data : Array.from({ length: 24 }, () => 0)
        }]
    } catch {
        return [{
            name: 'Doanh thu',
            data: Array.from({ length: 24 }, () => 0)
        }]
    }
})

// Hourly options
const hourlyChartOptions = computed(() => {
    try {
        const base = createBaseOptions('area', ['#2563eb'])
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const categories = hours.map(h => `${String(h).padStart(2, '0')}:00`)

        return {
            ...base,
            xaxis: {
                ...base.xaxis,
                categories: Array.isArray(categories) ? categories : [],
                tickAmount: 12
            },
            yaxis: {
                ...base.yaxis,
                labels: {
                    ...base.yaxis.labels,
                    formatter: (val) => {
                        const num = Number(val)
                        return Number.isFinite(num) && !isNaN(num) ? formatCurrency(num) : formatCurrency(0)
                    }
                }
            },
            tooltip: {
                ...base.tooltip,
                y: {
                    formatter: (val) => {
                        const num = Number(val)
                        return Number.isFinite(num) && !isNaN(num) ? formatCurrency(num) : formatCurrency(0)
                    }
                }
            }
        }
    } catch {
        return createBaseOptions('area', ['#2563eb'])
    }
})

// Update safe data when computed values change
const updateProductChart = async () => {
    productChartReady.value = false
    productChartKey.value++

    await nextTick()

    const series = createSafeSeries(productChartSeries.value, resolvedProductChartType.value)
    const options = createSafeOptions(productChartOptions.value, resolvedProductChartType.value)

    if (validateSeries(series, resolvedProductChartType.value)) {
        safeProductSeries.value = deepClone(series)
        safeProductOptions.value = deepClone(options)

        await nextTick()
        productChartReady.value = true
    } else {
        safeProductSeries.value = null
        safeProductOptions.value = null
    }
}

const updateCategoryChart = async () => {
    categoryChartReady.value = false
    categoryChartKey.value++

    await nextTick()

    const series = createSafeSeries(categoryChartSeries.value, resolvedCategoryChartType.value)
    const options = createSafeOptions(categoryChartOptions.value, resolvedCategoryChartType.value)

    if (validateSeries(series, resolvedCategoryChartType.value)) {
        safeCategorySeries.value = deepClone(series)
        safeCategoryOptions.value = deepClone(options)

        await nextTick()
        categoryChartReady.value = true
    } else {
        safeCategorySeries.value = null
        safeCategoryOptions.value = null
    }
}

// Biểu đồ Stacked đã được xóa vì không mang lại giá trị thông tin

const updateHourlyChart = async () => {
    hourlyChartReady.value = false

    await nextTick()

    const series = createSafeSeries(hourlyChartSeries.value, 'area')
    const options = createSafeOptions(hourlyChartOptions.value, 'area')

    if (validateSeries(series, 'area')) {
        safeHourlySeries.value = deepClone(series)
        safeHourlyOptions.value = deepClone(options)

        await nextTick()
        hourlyChartReady.value = true
    } else {
        safeHourlySeries.value = null
        safeHourlyOptions.value = null
    }
}

// Watch for changes and update charts
watch(() => [productChartSeries.value, productChartOptions.value, resolvedProductChartType.value],
    () => updateProductChart(),
    { deep: true }
)

watch(() => [categoryChartSeries.value, categoryChartOptions.value, resolvedCategoryChartType.value],
    () => updateCategoryChart(),
    { deep: true }
)

// Watch cho stacked chart đã được xóa

watch(() => [hourlyChartSeries.value, hourlyChartOptions.value],
    () => updateHourlyChart(),
    { deep: true }
)

// Initial load
onMounted(async () => {
    await nextTick()
    await Promise.all([
        updateProductChart(),
        updateCategoryChart(),
        updateHourlyChart()
    ])
})

// Table sorting
const sortedTableItems = computed(() => {
    try {
        const data = [...(props.bestSellers ?? [])]
        const [key, direction] = tableSort.value.split('-')
        return data.sort((a, b) => {
            switch (key) {
                case 'revenue':
                    return direction === 'asc'
                        ? (a?.totalRevenueGenerated ?? 0) - (b?.totalRevenueGenerated ?? 0)
                        : (b?.totalRevenueGenerated ?? 0) - (a?.totalRevenueGenerated ?? 0)
                case 'name':
                    return direction === 'asc'
                        ? (a?.productName ?? '').localeCompare(b?.productName ?? '')
                        : (b?.productName ?? '').localeCompare(a?.productName ?? '')
                case 'quantity':
                default:
                    return direction === 'asc'
                        ? (a?.totalQuantitySold ?? 0) - (b?.totalQuantitySold ?? 0)
                        : (b?.totalQuantitySold ?? 0) - (a?.totalQuantitySold ?? 0)
            }
        })
    } catch {
        return []
    }
})

// Event handlers
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
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.card-inline :global(.card-body) {
    background: var(--color-card);
    padding: var(--spacing-4);
}

.card-inline :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.card-inline :global(.form-select) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.card-inline :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.card-inline :global(.text-muted) {
    font-family: var(--font-family-sans);
}

.chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-4);
}

.alternating-grid {
    margin-top: var(--spacing-4);
}

.chart-card, .table-card {
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

.table-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.table-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.table-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.product-name-cell {
    line-height: 1.6;
    min-height: 2.5rem; /* Đảm bảo chiều cao tối thiểu */
    display: flex;
    align-items: center; /* Căn giữa theo chiều dọc */
    word-break: break-word; /* Tự động xuống dòng nếu tên quá dài */
}

.insight-card__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}
</style>
