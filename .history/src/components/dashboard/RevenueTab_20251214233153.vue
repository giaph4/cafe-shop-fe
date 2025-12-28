<template>
  <div class="revenue">
    <div class="revenue__grid">
      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Doanh thu theo ngày
            </h5>
            <p class="card-subtitle">
              Trực quan hóa doanh thu trong giai đoạn đã chọn
            </p>
          </div>
        </div>
        <div class="card-body">
          <apexchart
            v-if="isMounted && revenueSeries && revenueSeries.length > 0 && revenueOptions"
            type="area"
            height="320"
            :series="revenueSeries"
            :options="revenueOptions"
          />
          <EmptyState
            v-else
            message="Chưa có dữ liệu doanh thu"
          />
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Lợi nhuận
            </h5>
            <p class="card-subtitle">
              So sánh doanh thu và lợi nhuận trong kỳ
            </p>
          </div>
        </div>
        <div class="card-body">
            <apexchart
              v-if="isMounted && profitSeries && profitSeries.length > 0 && profitOptions"
              type="bar"
              height="280"
              :series="profitSeries"
              :options="profitOptions"
            />
          <EmptyState
            v-else
            message="Chưa có dữ liệu lợi nhuận"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h5 class="card-title">
            Doanh thu theo danh mục
          </h5>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Danh mục</th>
                <th class="text-end">
                  Số lượng
                </th>
                <th class="text-end">
                  Doanh thu
                </th>
                <th class="text-end">
                  Tỷ trọng
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in categorySales"
                :key="item.categoryName"
              >
                <td>{{ item.categoryName }}</td>
                <td class="text-end">
                  {{ item.totalQuantity }}
                </td>
                <td class="text-end">
                  {{ formatCurrency(item.totalRevenue) }}
                </td>
                <td class="text-end">
                  <span class="badge bg-dark">{{ item.revenuePercentage?.toFixed(2) ?? 0 }}%</span>
                </td>
              </tr>
              <tr v-if="!categorySales?.length">
                <td colspan="4">
                  <EmptyState message="Chưa có doanh thu theo danh mục" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card hourly-sales-card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h5 class="card-title">
              Doanh thu theo khung giờ ({{ hourlySalesTitle }})
            </h5>
            <p class="card-subtitle">
              Phân tích doanh thu và số đơn theo từng giờ trong ngày
            </p>
          </div>
          <div class="hourly-legend">
            <div class="legend-item">
              <span
                class="legend-color"
                style="background: #f0f9ff; border-color: #e0f2fe"
              />
              <span class="legend-label">Thấp</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background: #bfdbfe; border-color: #7dd3fc"
              />
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background: #60a5fa; border-color: #0ea5e9"
              />
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background: #3b82f6; border-color: #0284c7"
              />
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background: #1e40af; border-color: #0c4a6e"
              />
              <span class="legend-label">Cao</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div
          v-if="hourlySales?.length && hasHourlyData"
          class="hourly-content"
        >
          <!-- Chart Section -->
          <div class="hourly-chart-section">
            <apexchart
              v-if="isMounted"
              type="line"
              height="180"
              :series="hourlyChartSeries"
              :options="hourlyChartOptions"
            />
          </div>

          <!-- Heatmap Grid -->
          <div class="hourly-grid">
            <div
              v-for="bucket in fullHourlyData"
              :key="bucket.hour"
              class="hourly-card"
              :class="getHeatmapClass(bucket)"
              :style="getHeatmapStyle(bucket)"
            >
              <span class="hourly-card__hour">{{ bucket.hour }}h</span>
              <strong class="hourly-card__revenue">{{ formatCurrency(bucket.revenue) }}</strong>
              <span class="hourly-card__orders">{{ bucket.orderCount }} đơn</span>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          message="Chưa có dữ liệu doanh thu theo giờ cho ngày đã chọn"
        />
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h5 class="card-title">
            Sản phẩm bán chạy
          </h5>
          <p class="card-subtitle">
            Tổng kết doanh số theo sản phẩm
          </p>
        </div>
      </div>
      <div class="card-body">
        <div
          v-if="productSummary"
          class="product-summary"
        >
          <div class="product-summary__headline">
            <div>
              <span>Tổng số lượng</span>
              <strong>{{ productSummary.totalQuantitySold }}</strong>
            </div>
            <div>
              <span>Tổng doanh thu</span>
              <strong>{{ formatCurrency(productSummary.totalRevenueGenerated) }}</strong>
            </div>
          </div>
          <div class="product-summary__list">
            <div
              v-for="(product, index) in topProducts"
              :key="product.productId"
              class="product-summary__item"
              :class="{ 'product-summary__item--even': index % 2 === 0 }"
            >
              <div class="product-summary__name">
                {{ product.productName }}
              </div>
              <div class="product-summary__metrics">
                <span>{{ product.totalQuantitySold }} sp</span>
                <div class="product-summary__revenue">
                  <strong>{{ formatCurrency(product.totalRevenueGenerated) }}</strong>
                  <div class="product-summary__progress">
                    <div
                      class="product-summary__progress-bar"
                      :style="{ width: `${getRevenuePercentage(product)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          message="Chưa có dữ liệu sản phẩm"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

const apexchart = VueApexCharts
const isMounted = ref(false)

onMounted(async () => {
    await nextTick()
    isMounted.value = true
})

const props = defineProps({
    revenueSeries: { type: Array, default: () => [] },
    revenueOptions: { type: Object, default: () => ({}) },
    profitSeries: { type: Array, default: () => [] },
    profitOptions: { type: Object, default: () => ({}) },
    categorySales: { type: Array, default: () => [] },
    hourlySales: { type: Array, default: () => [] },
    productSummary: { type: Object, default: null }
})

const hourlySalesTitle = computed(() => {
    if (!props.hourlySales?.length) return ''
    const date = new Date()
    return date.toLocaleDateString('vi-VN')
})

const topProducts = computed(() => props.productSummary?.products?.slice(0, 5) ?? [])

// Kiểm tra xem có dữ liệu hourly thực sự không (không phải toàn số 0)
const hasHourlyData = computed(() => {
    if (!props.hourlySales?.length) return false
    return fullHourlyData.value.some(bucket => bucket.revenue > 0 || bucket.orderCount > 0)
})

// Tính phần trăm doanh thu để hiển thị progress bar
const maxRevenue = computed(() => {
    if (!topProducts.value.length) return 1
    return Math.max(...topProducts.value.map(p => p.totalRevenueGenerated || 0), 1)
})

const getRevenuePercentage = (product) => {
    if (maxRevenue.value === 0) return 0
    return ((product.totalRevenueGenerated || 0) / maxRevenue.value) * 100
}

// Build hourly data - chỉ hiển thị khung giờ hoạt động (6h-23h)
const fullHourlyData = computed(() => {
    const hoursMap = new Map()
    // Chỉ khởi tạo từ 6h đến 23h (khung giờ hoạt động của quán cà phê)
    const startHour = 6
    const endHour = 23
    for (let i = startHour; i <= endHour; i++) {
        hoursMap.set(i, {
            hour: i,
            revenue: 0,
            orderCount: 0
        })
    }
    // Fill with actual data
    if (props.hourlySales?.length) {
        props.hourlySales.forEach(item => {
            const hour = Number(item.hour)
            if (!isNaN(hour) && hour >= startHour && hour <= endHour) {
                hoursMap.set(hour, {
                    hour,
                    revenue: item.revenue || item.totalRevenue || 0,
                    orderCount: item.orderCount || 0
                })
            }
        })
    }
    return Array.from(hoursMap.values())
})

// Calculate max values for heatmap intensity
const maxHourlyRevenue = computed(() => Math.max(...fullHourlyData.value.map(b => b.revenue), 1))

const _maxOrders = computed(() => Math.max(...fullHourlyData.value.map(b => b.orderCount), 1))

// Get heatmap intensity level (0-8) based on revenue - Cải thiện để rõ ràng hơn
const getHeatmapIntensity = (bucket) => {
    if (maxHourlyRevenue.value === 0) return 0
    const ratio = bucket.revenue / maxHourlyRevenue.value
    // Sử dụng Math.ceil để đảm bảo các giá trị nhỏ cũng có màu
    // Và tăng contrast bằng cách scale tốt hơn
    if (ratio === 0) return 0
    if (ratio < 0.1) return 1
    if (ratio < 0.25) return 2
    if (ratio < 0.4) return 3
    if (ratio < 0.55) return 4
    if (ratio < 0.7) return 5
    if (ratio < 0.85) return 6
    if (ratio < 0.95) return 7
    return 8
}

// Get heatmap class based on intensity
const getHeatmapClass = (bucket) => {
    const intensity = getHeatmapIntensity(bucket)
    return `heatmap-intensity-${intensity}`
}

// Get heatmap style with background color - Tăng contrast để rõ ràng hơn
const getHeatmapStyle = (bucket) => {
    const intensity = getHeatmapIntensity(bucket)
    const colors = [
        '#f8fafc', // 0 - very light gray (gần như trắng)
        '#e2e8f0', // 1 - light gray
        '#cbd5e1', // 2 - gray
        '#94a3b8', // 3 - medium gray
        '#60a5fa', // 4 - light blue
        '#3b82f6', // 5 - blue
        '#2563eb', // 6 - medium blue
        '#1d4ed8', // 7 - dark blue
        '#1e3a8a'  // 8 - very dark blue
    ]
    const borderColors = [
        '#cbd5e1', // 0
        '#94a3b8', // 1
        '#64748b', // 2
        '#475569', // 3
        '#3b82f6', // 4
        '#2563eb', // 5
        '#1d4ed8', // 6
        '#1e40af', // 7
        '#1e3a8a'  // 8
    ]

    return {
        backgroundColor: colors[intensity],
        borderColor: borderColors[intensity],
        borderWidth: intensity >= 4 ? '2px' : '1px'
    }
}

// Chart series for hourly sales - Cải thiện để rõ ràng hơn
const hourlyChartSeries = computed(() => {
    const revenues = fullHourlyData.value.map(b => b.revenue)
    const orders = fullHourlyData.value.map(b => b.orderCount)

    return [
        {
            name: 'Doanh thu',
            type: 'area', // Sử dụng area để rõ ràng hơn
            data: revenues
        },
        {
            name: 'Số đơn',
            type: 'line', // Giữ line cho số đơn
            data: orders
        }
    ]
})

// Chart options for hourly sales - Cải thiện để rõ ràng hơn
const hourlyChartOptions = computed(() => {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2563eb'
    // Số đơn hàng dùng màu cam thay vì xanh lá để tránh nhầm lẫn với Lợi nhuận
    const orderColor = '#f97316' // Orange-500
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#6b7280'
    const headingColor = getComputedStyle(document.documentElement).getPropertyValue('--color-heading').trim() || '#1f2937'

    const hours = fullHourlyData.value.map(b => `${b.hour.toString().padStart(2, '0')}:00`)

    return {
        chart: {
            type: 'line',
            toolbar: { show: false },
            stacked: false,
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        stroke: {
            curve: 'monotoneCubic', // Thay 'smooth' bằng 'monotoneCubic' để chính xác hơn, không quá mềm
            width: [3, 2.5], // Giảm độ dày để tinh tế hơn
            dashArray: [0, 8] // Giảm độ đứt nét cho số đơn
        },
        markers: {
            size: [8, 7], // Tăng marker size để rõ hơn
            hover: {
                size: 10
            },
            colors: [primaryColor, orderColor], // Số đơn dùng màu cam
            strokeWidth: 2,
            strokeColors: ['#ffffff', '#ffffff'],
            fillOpacity: 1
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3, // Giảm opacity để nhẹ nhàng hơn, không quá đậm
                opacityTo: 0.1,
                stops: [0, 50, 100],
                colorStops: [
                    {
                        offset: 0,
                        color: primaryColor,
                        opacity: 0.3
                    },
                    {
                        offset: 100,
                        color: primaryColor,
                        opacity: 0.1
                    }
                ]
            }
        },
        colors: [primaryColor, orderColor], // Số đơn dùng màu cam
        xaxis: {
            categories: hours,
            labels: {
                style: {
                    colors: headingColor,
                    fontSize: '13px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: '500'
                },
                rotate: -45,
                rotateAlways: false
            },
            tickAmount: 12,
            axisBorder: {
                show: true,
                color: textMuted,
                width: 2
            },
            axisTicks: {
                show: true,
                color: textMuted,
                width: 2
            }
        },
        yaxis: [
            {
                title: {
                    text: 'Doanh thu (₫)',
                    style: {
                        color: primaryColor,
                        fontSize: '13px',
                        fontFamily: 'var(--font-family-sans)',
                        fontWeight: '600'
                    }
                },
                labels: {
                    formatter: (val) => formatCurrency(val),
                    style: {
                        colors: textMuted,
                        fontSize: '11px',
                        fontFamily: 'var(--font-family-sans)'
                    }
                },
                axisBorder: {
                    show: true,
                    color: primaryColor
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Số đơn',
                    style: {
                        color: orderColor, // Màu cam cho số đơn
                        fontSize: '13px',
                        fontFamily: 'var(--font-family-sans)',
                        fontWeight: '600'
                    }
                },
                labels: {
                    style: {
                        colors: textMuted,
                        fontSize: '11px',
                        fontFamily: 'var(--font-family-sans)'
                    }
                },
                axisBorder: {
                    show: true,
                    color: orderColor // Màu cam cho số đơn
                }
            }
        ],
        tooltip: {
            shared: true,
            intersect: false,
            theme: 'light',
            style: {
                fontSize: '13px',
                fontFamily: 'var(--font-family-sans)'
            },
            y: {
                formatter: (val, { seriesIndex }) => {
                    if (seriesIndex === 0) {
                        return formatCurrency(val)
                    }
                    return `${val} đơn`
                }
            },
            marker: {
                show: true
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '13px',
            fontFamily: 'var(--font-family-sans)',
            markers: {
                width: 12,
                height: 12,
                radius: 2
            }
        },
        dataLabels: {
            enabled: false
        },
        grid: {
            borderColor: textMuted,
            strokeDashArray: 3,
            opacity: 0.15, // Giảm opacity grid lines xuống rất thấp (mờ sương)
            xaxis: {
                lines: {
                    show: true,
                    strokeDashArray: 3
                }
            },
            yaxis: {
                lines: {
                    show: true,
                    strokeDashArray: 3
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            }
        },
        plotOptions: {
            area: {
                fillTo: 'origin'
            }
        }
    }
})
</script>

<style scoped>
.revenue {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.revenue__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--spacing-6);
}

.card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-3);
    margin-bottom: var(--spacing-2);
}

.hourly-sales-card {
    margin-top: var(--spacing-6);
}

.hourly-legend {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
}

.legend-color {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.legend-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

.hourly-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.hourly-chart-section {
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-3);
}

.badge.bg-soft-primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    font-weight: var(--font-weight-semibold);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
}

.hourly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-2);
}

/* Heatmap design - border-radius 6px theo design system - Cải thiện để rõ ràng hơn */
.hourly-card {
    border-radius: var(--radius-sm);
    padding: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    min-height: 80px;
    justify-content: center;
}

.hourly-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    opacity: 0.8;
}

.hourly-card:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    z-index: 1;
}

.hourly-card__hour {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.hourly-card__revenue {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
    line-height: 1.4;
    margin-bottom: var(--spacing-1);
}

.hourly-card__orders {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
}

/* Heatmap intensity classes for better color contrast - Cải thiện để rõ ràng hơn */
.hourly-card.heatmap-intensity-0,
.hourly-card.heatmap-intensity-1 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-0::before {
    background: #cbd5e1;
}

.hourly-card.heatmap-intensity-1::before {
    background: #94a3b8;
}

.hourly-card.heatmap-intensity-2,
.hourly-card.heatmap-intensity-3 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-2::before {
    background: #64748b;
}

.hourly-card.heatmap-intensity-3::before {
    background: #475569;
}

.hourly-card.heatmap-intensity-4,
.hourly-card.heatmap-intensity-5 {
    color: var(--color-heading);
}

.hourly-card.heatmap-intensity-4::before {
    background: #3b82f6;
}

.hourly-card.heatmap-intensity-5::before {
    background: #2563eb;
}

.hourly-card.heatmap-intensity-6,
.hourly-card.heatmap-intensity-7,
.hourly-card.heatmap-intensity-8 {
    color: #ffffff;
}

.hourly-card.heatmap-intensity-6::before {
    background: #1d4ed8;
}

.hourly-card.heatmap-intensity-7::before {
    background: #1e40af;
}

.hourly-card.heatmap-intensity-8::before {
    background: #1e3a8a;
}

.hourly-card.heatmap-intensity-6 .hourly-card__revenue,
.hourly-card.heatmap-intensity-7 .hourly-card__revenue,
.hourly-card.heatmap-intensity-8 .hourly-card__revenue {
    color: #ffffff;
    font-weight: var(--font-weight-bold);
}

.hourly-card.heatmap-intensity-6 .hourly-card__hour,
.hourly-card.heatmap-intensity-7 .hourly-card__hour,
.hourly-card.heatmap-intensity-8 .hourly-card__hour {
    color: #ffffff;
    font-weight: var(--font-weight-bold);
}

.hourly-card.heatmap-intensity-6 .hourly-card__orders,
.hourly-card.heatmap-intensity-7 .hourly-card__orders,
.hourly-card.heatmap-intensity-8 .hourly-card__orders {
    color: rgba(255, 255, 255, 0.9);
    font-weight: var(--font-weight-semibold);
}

@media (max-width: 768px) {
    .hourly-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: var(--spacing-2);
    }

    .hourly-card {
        padding: var(--spacing-2);
    }

    .hourly-legend {
        flex-wrap: wrap;
        gap: var(--spacing-1);
    }

    .legend-item {
        font-size: var(--font-size-xs);
    }

    .legend-color {
        width: 16px;
        height: 16px;
    }
}

.product-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

/* Flat design - border-radius 6px theo design system */
.product-summary__headline {
    display: flex;
    gap: var(--spacing-6);
    background: var(--color-soft-primary);
    border-radius: var(--radius-base);
    padding: var(--spacing-5) var(--spacing-6);
    border: 1px solid var(--color-border);
}

.product-summary__headline>div {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.product-summary__headline span {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.product-summary__headline strong {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.product-summary__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.product-summary__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    transition: background-color var(--transition-base);
}

.product-summary__item--even {
    background: var(--color-card-muted);
}

.product-summary__item:last-child {
    border-bottom: none;
}

.product-summary__item:hover {
    background: var(--color-card-muted);
}

.product-summary__name {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.product-summary__metrics {
    display: flex;
    gap: var(--spacing-3);
    align-items: center;
}

.product-summary__metrics span {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
}

.product-summary__revenue {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--spacing-1);
    min-width: 150px;
}

.product-summary__revenue strong {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.product-summary__progress {
    width: 100%;
    height: 6px;
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    overflow: hidden;
}

.product-summary__progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-sm);
    transition: width var(--transition-base);
}

@media (max-width: 992px) {
    .product-summary__headline {
        flex-direction: column;
        gap: var(--spacing-4);
    }
}
</style>
