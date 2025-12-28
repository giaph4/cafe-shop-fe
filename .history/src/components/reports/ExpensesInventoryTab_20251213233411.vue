<template>
  <div class="expenses-inventory">
    <div class="grid">
      <div class="card chart-card">
        <div class="card-header border-0 d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">
              Chi phí theo ngày
            </h5>
            <p class="text-muted mb-0">
              Tổng: {{ formatCurrency(expensesTotals.overall) }}
            </p>
          </div>
          <div class="d-flex gap-2">
            <button
              class="btn btn-outline-primary btn-sm"
              type="button"
              :disabled="expensesExporting"
              @click="handleExportExpenses"
            >
              <span
                v-if="expensesExporting"
                class="spinner-border spinner-border-sm me-2"
              />
              Xuất chi phí
            </button>
          </div>
        </div>
        <div class="card-body">
          <ApexChart
            type="area"
            height="320"
            :series="expensesSeries"
            :options="expensesOptions"
          />
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
          <h5 class="mb-1">
            Tồn kho & cảnh báo thiếu hụt
          </h5>
          <p class="text-muted mb-0">
            Tổng {{ formatNumber(inventorySummary.totalItems) }} nguyên liệu · Thiếu hụt {{ formatNumber(inventorySummary.lowStockCount) }}
          </p>
        </div>
        <div class="d-flex gap-2 align-items-center">
          <div class="form-check form-switch">
            <input
              id="lowStockToggle"
              class="form-check-input"
              type="checkbox"
              role="switch"
              :checked="lowStockOnly"
              :disabled="inventoryLoading"
              @change="emit('update:lowStockOnly', $event.target.checked)"
            >
            <label
              class="form-check-label"
              for="lowStockToggle"
            >Chỉ hiển thị thiếu hụt</label>
          </div>
          <button
            class="btn btn-outline-secondary btn-sm"
            type="button"
            :disabled="inventoryExporting"
            @click="handleExportInventory"
          >
            <span
              v-if="inventoryExporting"
              class="spinner-border spinner-border-sm me-2"
            />
            Xuất tồn kho
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="inventory-grid">
          <div
            v-for="stat in inventoryStats"
            :key="stat.label"
            class="card mini-card"
          >
            <div
              class="mini-card__icon"
              :class="stat.variant"
            >
              <i :class="stat.icon" />
            </div>
            <div class="mini-card__meta">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.display }}</strong>
            </div>
          </div>
        </div>

        <div
          v-if="inventoryLoading"
          class="state-block py-4"
        >
          <div
            class="spinner-border text-primary"
            role="status"
          />
        </div>
        <div
          v-else
          class="table-responsive mt-4"
        >
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Nguyên liệu</th>
                <th>Đơn vị</th>
                <th class="text-end">
                  Tồn kho
                </th>
                <th class="text-end">
                  Mức đặt lại
                </th>
                <th class="text-center">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in displayedInventory"
                :key="item.id"
              >
                <td class="fw-semibold">
                  {{ capitalizeWords(item.name) }}
                </td>
                <td>{{ item.unit || '—' }}</td>
                <td class="text-end">
                  {{ formatNumber(item.quantityOnHand) }}
                </td>
                <td class="text-end">
                  {{ item.reorderLevel !== null ? formatNumber(item.reorderLevel) : '—' }}
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="item.status === 'LOW_STOCK' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'"
                  >
                    {{ item.status === 'LOW_STOCK' ? 'Thiếu hụt' : 'Ổn định' }}
                  </span>
                </td>
              </tr>
              <tr v-if="!displayedInventory.length">
                <td
                  colspan="5"
                  class="text-center text-muted py-4"
                >
                  Không có nguyên liệu phù hợp.
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

// Màu chữ trục X/Y đậm hơn để dễ đọc (#4B5563 thay vì #64748b)
const BASE_LABEL_STYLE = Object.freeze({ colors: prefersDark ? '#cbd5f5' : '#4B5563', fontSize: '12px' })
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
            toolbar: { show: false }, // Ẩn toolbar để giao diện chuyên nghiệp hơn
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

// Hàm chuẩn hóa tên category: xử lý dữ liệu rác
const normalizeCategoryName = (category) => {
    if (!category || typeof category !== 'string') return 'Khác'
    const normalized = category.trim()

    // Xử lý các trường hợp đặc biệt
    if (normalized === '' || normalized.toLowerCase() === 'other' || normalized === 'OTHER') {
        return 'Khác'
    }

    // Loại bỏ các ký tự không hợp lệ (như "ásds")
    if (normalized.length < 2 || /^[^a-zA-ZÀ-ỹ0-9\s]+$/.test(normalized)) {
        return 'Khác'
    }

    // Viết hoa chữ cái đầu mỗi từ
    return normalized
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Hàm chuẩn hóa tên nguyên liệu
const capitalizeWords = (text) => {
    if (!text || typeof text !== 'string') return text || '—'
    return text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

const categoriesSet = computed(() => {
    const set = new Set()
    props.expensesEntries.forEach((entry) => {
        entry.categories?.forEach((category) => {
            // Chuẩn hóa tên category trước khi thêm vào set
            const normalized = normalizeCategoryName(category.category)
            set.add(normalized)
        })
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

    // Tạo series với category đã được normalize
    return categoriesSet.value.map((category) => ({
        name: category, // Đã được normalize trong categoriesSet
        data: props.expensesEntries.map((entry) => {
            // Tìm category match (có thể là tên gốc hoặc đã normalize)
            const found = entry.categories?.find((item) => {
                const normalized = normalizeCategoryName(item.category)
                return normalized === category || item.category === category
            })
            return found ? found.amount : 0
        })
    }))
})

// Format ngày tháng ngắn gọn cho trục X
const formatDateShort = (dateString) => {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}` // Format: 14/09
    } catch {
        // Nếu không parse được, thử lấy phần cuối
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-')
            if (parts.length >= 3) {
                return `${parts[2]}/${parts[1]}` // Format: YYYY-MM-DD -> DD/MM
            }
        }
        return dateString
    }
}

const xCategories = computed(() => props.expensesEntries.map((entry) => formatDateShort(entry.date)))

const expensesOptions = computed(() => {
    const base = createBaseOptions('area', VIBRANT_PALETTE)

    return mergeOptions(base, {
        chart: { type: 'area', stacked: true, toolbar: { show: false } },
        xaxis: {
            categories: xCategories.value,
            labels: {
                ...base.xaxis.labels,
                style: {
                    ...base.xaxis.labels.style,
                    colors: '#4B5563', // Màu xám đậm thay vì xanh nhạt
                    fontSize: '13px' // Tăng font size cho dễ đọc
                },
                rotate: -45, // Xoay nhẹ để tránh chồng chéo
                rotateAlways: false
            }
        },
        yaxis: {
            labels: {
                ...base.yaxis.labels,
                style: {
                    ...base.yaxis.labels.style,
                    colors: '#4B5563' // Màu xám đậm thay vì xanh nhạt
                },
                formatter: (value) => formatCurrency(value)
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 0.5, // Giảm gradient
                opacityFrom: 0.4, // Giảm opacity
                opacityTo: 0.1,
                stops: [0, 100] // Đơn giản hóa
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

// Tính giá trị tồn kho (tổng giá trị của tất cả nguyên liệu)
const inventoryValue = computed(() => props.inventoryItems.reduce((sum, item) => {
    const quantity = Number(item.quantityOnHand) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return sum + (quantity * unitPrice)
}, 0))

const inventoryStats = computed(() => [
    {
        label: 'Tổng nguyên liệu',
        value: props.inventorySummary.totalItems,
        icon: 'bi bi-box-seam',
        variant: 'variant-primary',
        display: formatNumber(props.inventorySummary.totalItems)
    },
    {
        label: 'Thiếu hụt',
        value: props.inventorySummary.lowStockCount,
        icon: 'bi bi-exclamation-triangle',
        variant: 'variant-warning',
        display: formatNumber(props.inventorySummary.lowStockCount)
    },
    {
        label: 'Giá trị tồn kho',
        value: inventoryValue.value,
        icon: 'bi bi-cash-stack',
        variant: 'variant-success',
        display: formatCurrency(inventoryValue.value)
    }
])

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
    margin-bottom: var(--spacing-2);
}

.export-row :global(.btn) {
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.export-row :global(.btn-outline-primary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.export-row :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.export-row :global(.btn-outline-secondary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.export-row :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-4);
}

.chart-card,
.summary-card,
.inventory-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.chart-card :global(.card-header),
.inventory-card :global(.card-header) {
    background: var(--color-card);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4);
}

.chart-card :global(.card-header h5),
.inventory-card :global(.card-header h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-header .text-muted),
.inventory-card :global(.card-header .text-muted) {
    font-family: var(--font-family-sans);
}

.chart-card :global(.card-body) {
    padding: var(--spacing-3); /* Giảm từ spacing-4 xuống spacing-3 để giảm khoảng trắng */
}

.inventory-card :global(.card-body) {
    padding: var(--spacing-4);
}

.inventory-card :global(.form-check-input) {
    border-radius: var(--radius-sm);
}

.inventory-card :global(.form-check-label) {
    font-family: var(--font-family-sans);
}

.summary-card__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-4);
    padding: var(--spacing-4);
}

.summary-card__item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.summary-card__item span {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.summary-card__item strong {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.summary-card__item small {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.mini-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
}

.mini-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: 20px;
}

.variant-primary { background: var(--color-soft-primary); color: var(--color-primary); }
.variant-warning { background: var(--color-soft-amber); color: var(--color-warning); }
.variant-success { background: var(--color-soft-emerald); color: var(--color-success); }

.mini-card__meta span {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.mini-card__meta strong {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Minimal Table Styling */
.inventory-card :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.inventory-card :global(.table thead th) {
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    text-align: left;
}

.inventory-card :global(.table thead th.text-end) {
    text-align: right; /* Đảm bảo căn lề phải cho header */
}

.inventory-card :global(.table tbody td.text-end) {
    text-align: right; /* Đảm bảo căn lề phải cho số liệu */
    font-variant-numeric: tabular-nums; /* Tabular numbers để thẳng hàng */
}

.inventory-card :global(.table tbody td) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
    line-height: 1.6; /* Tăng line-height */
    vertical-align: middle; /* Căn giữa theo chiều dọc */
}

.inventory-card :global(.table tbody td.fw-semibold) {
    line-height: 1.6;
    word-break: break-word; /* Tự động xuống dòng nếu tên quá dài */
}

.inventory-card :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.inventory-card :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.inventory-card :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

@media (max-width: 768px) {
    .summary-card__grid {
        grid-template-columns: 1fr;
    }
}
</style>
