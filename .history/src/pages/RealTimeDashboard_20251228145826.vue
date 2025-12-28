<template>
  <div
    class="realtime-dashboard-page page-container container-fluid"
      
  >
    <PageHeader
      title="Dashboard Thời gian Thực"
      subtitle="Theo dõi hoạt động và hiệu suất theo thời gian thực"
    >
      <template #actions>
        <div class="header-controls">
          <div
            v-if="lastRefreshTime"
            class="control-group"
          >
            <div
              class="refresh-status"
              :class="isRefreshing ? 'status-active' : 'status-idle'"
            >
              <span class="status-text">Cập nhật: {{ formatTime(lastRefreshTime) }}</span>
            </div>
          </div>
          <div class="control-group">
            <div class="form-check form-switch">
              <input
                id="auto-refresh-toggle"
                v-model="autoRefreshEnabled"
                class="form-check-input"
                type="checkbox"
                @change="handleAutoRefreshChange"
              >
              <label
                class="form-check-label"
                for="auto-refresh-toggle"
              >
                 
              </label>
            </div>
          </div>
          <div class="control-group">
            <button
              class="btn btn-flat btn-flat--outline"
              :disabled="loading"
              @click="handleRefresh"
            >
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-arrow-clockwise me-2"
              />
              Làm mới
            </button>
          </div>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="criticalAlerts.length > 0"
      class="alerts-section mb-4"
    >
      <div
        v-for="alert in criticalAlerts"
        :key="alert.title"
        class="alert alert-critical"
      >
        <div class="d-flex align-items-center gap-3">
          <i class="bi bi-exclamation-triangle-fill alert-icon" />
          <div class="flex-grow-1">
            <div class="alert-title">
              {{ alert.title }}
            </div>
            <div class="alert-message">
              {{ alert.message }}
            </div>
          </div>
          <button
            v-if="alert.action"
            class="btn btn-flat btn-flat--outline btn-sm"
            @click="handleAlertAction(alert)"
          >
            {{ alert.action }}
          </button>
        </div>
      </div>
    </div>

    <LoadingState
      v-if="loading && !hasData"
      text="Đang tải dữ liệu dashboard..."
    />
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="handleRefresh"
    />

    <div
      v-if="hasData"
      class="dashboard-content"
    >
      <div class="row g-4 mb-4">
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--success">
            <div class="kpi-card__icon">
              <i class="bi bi-cash-stack" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Doanh thu hôm nay
              </div>
              <div class="kpi-card__value">
                {{ formatCurrency(kpis?.revenueToday || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                <HistoricalComparison
                  type="revenue"
                  :compare-type="compareType"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--primary">
            <div class="kpi-card__icon">
              <i class="bi bi-cart" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Đơn hàng hôm nay
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(kpis?.ordersToday || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                <HistoricalComparison
                  type="orders"
                  :compare-type="compareType"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--info">
            <div class="kpi-card__icon">
              <i class="bi bi-table" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Bàn đang dùng
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(kpis?.activeTables || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                / {{ tables.length }} bàn
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6">
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-card__icon">
              <i class="bi bi-people" />
            </div>
            <div class="kpi-card__content">
              <div class="kpi-card__label">
                Nhân viên ca
              </div>
              <div class="kpi-card__value">
                {{ formatNumber(kpis?.staffOnDuty || 0) }}
              </div>
              <div class="kpi-card__subtitle">
                <span v-if="currentShift">{{ currentShift.name }}</span>
                <span v-else>Chưa có ca</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Doanh thu theo giờ hôm nay
              </h5>
              <div class="d-flex gap-2">
                <select
                  v-model="compareType"
                  class="form-select form-select-sm clean-input"
                  style="width: auto;"
                  @change="handleCompareTypeChange"
                >
                  <option value="yesterday">
                    So với hôm qua
                  </option>
                  <option value="lastWeek">
                    So với tuần trước
                  </option>
                </select>
              </div>
            </div>
            <div class="card-body">
              <HourlyRevenueChart :hourly-revenue="hourlyRevenue" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Cảnh báo
              </h5>
              <span
                class="badge badge-soft"
                :class="alerts.length > 0 ? 'badge-warning' : 'badge-success'"
              >
                {{ alerts.length }}
              </span>
            </div>
            <div class="card-body">
              <AlertsPanel
                :alerts="alerts"
                @action="handleAlertAction"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Đơn hàng đang chờ
              </h5>
              <span class="badge badge-soft badge-warning">{{ pendingOrders.length }}</span>
            </div>
            <div class="card-body">
              <PendingOrdersList :orders="pendingOrders" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card standard-card">
            <div class="card-header standard-card-header">
              <h5 class="card-title">
                Nguyên liệu sắp hết
              </h5>
              <span class="badge badge-soft badge-danger">{{ lowStockItems.length }}</span>
            </div>
            <div class="card-body">
              <LowStockList :items="lowStockItems" />
            </div>
          </div>
        </div>
      </div>

      <div class="card standard-card">
        <div class="card-header standard-card-header">
          <h5 class="card-title">
            Trạng thái bàn
          </h5>
        </div>
        <div class="card-body">
          <TablesStatusGrid :tables="tables" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!loading"
      title="Chưa có dữ liệu"
      message="Nhấn 'Làm mới' để tải dữ liệu dashboard"
    >
      <template #icon>
        <i class="bi bi-speedometer2" />
      </template>
    </EmptyState>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRealTimeDashboardStore } from '@/store/realTimeDashboard'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import HourlyRevenueChart from '@/components/realtime-dashboard/HourlyRevenueChart.vue'
import AlertsPanel from '@/components/realtime-dashboard/AlertsPanel.vue'
import PendingOrdersList from '@/components/realtime-dashboard/PendingOrdersList.vue'
import LowStockList from '@/components/realtime-dashboard/LowStockList.vue'
import TablesStatusGrid from '@/components/realtime-dashboard/TablesStatusGrid.vue'
import HistoricalComparison from '@/components/realtime-dashboard/HistoricalComparison.vue'
import { formatCurrency, formatNumber, formatTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const store = useRealTimeDashboardStore()
const router = useRouter()

const loading = computed(() => store.loading)
const error = computed(() => store.error)
const hasData = computed(() => store.hasData)
const kpis = computed(() => store.kpis)
const alerts = computed(() => store.alerts)
const criticalAlerts = computed(() => store.criticalAlerts)
const pendingOrders = computed(() => store.pendingOrders)
const lowStockItems = computed(() => store.lowStockItems)
const tables = computed(() => store.tables)
const currentShift = computed(() => store.currentShift)
const hourlyRevenue = computed(() => store.hourlyRevenue)
const lastRefreshTime = computed(() => store.lastRefreshTime)
const autoRefreshEnabled = computed({
    get: () => store.autoRefreshEnabled,
    set: (value) => store.setAutoRefresh(value)
})

const compareType = ref('yesterday')
let refreshTimer = null
const isRefreshing = ref(false)

const handleRefresh = async () => {
    isRefreshing.value = true
    try {
        await store.refreshDashboard()
    } catch (err) {
        logger.error('Không thể làm mới dashboard thời gian thực:', err)
    } finally {
        isRefreshing.value = false
    }
}

const handleAutoRefreshChange = () => {
    if (autoRefreshEnabled.value) {
        startAutoRefresh()
    } else {
        stopAutoRefresh()
    }
}

const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshTimer = setInterval(() => {
        if (!loading.value) {
            handleRefresh()
        }
    }, store.refreshInterval)
}

const stopAutoRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
    }
}

const handleCompareTypeChange = () => {
    // Comparison data will be loaded by HistoricalComparison component
}

const handleAlertAction = (alert) => {
    if (alert.action === 'Xem danh sách đơn hàng') {
        router.push('/orders?status=PENDING')
    } else if (alert.action === 'Xem danh sách nguyên liệu') {
        router.push('/inventory?filter=low-stock')
    } else if (alert.action === 'Xem sơ đồ bàn') {
        router.push('/tables')
    }
}

onMounted(async () => {
    await handleRefresh()
    if (autoRefreshEnabled.value) {
        startAutoRefresh()
    }
})

onUnmounted(() => {
    stopAutoRefresh()
})
</script>

<style scoped>
.realtime-dashboard-page {
    background: var(--color-body-bg);
    padding: var(--spacing-4);
    min-height: 100vh;
}

.header-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
}

.refresh-status {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-family-sans);
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all var(--transition-base);
}

.refresh-status.status-active {
    background: var(--color-soft-emerald);
    border-color: var(--color-success);
}

.refresh-status.status-idle {
    background: var(--color-card);
    border-color: var(--color-border);
}

.status-text {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

.form-check {
    margin: 0;
    display: flex;
    align-items: center;
}

.form-check-label {
    margin-left: var(--spacing-2);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    white-space: nowrap;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.alerts-section {
    font-family: var(--font-family-sans);
}

.alert-critical {
    background: var(--color-soft-rose);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-sm);
    padding: var(--spacing-3) var(--spacing-4);
    color: var(--color-text);
}

.alert-icon {
    color: var(--color-danger);
    font-size: 1.25rem;
}

.alert-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
}

.alert-message {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
}

.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    transition: all var(--transition-base);
    min-height: 100px;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.kpi-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: currentColor;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.kpi-card--success::before {
    background: var(--color-success);
}

.kpi-card--primary::before {
    background: var(--color-primary);
}

.kpi-card--info::before {
    background: var(--color-info);
}

.kpi-card--warning::before {
    background: var(--color-warning);
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.kpi-card:hover::before {
    opacity: 0.7;
}

.kpi-card__icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
    transition: transform var(--transition-base);
}

.kpi-card:hover .kpi-card__icon {
    transform: scale(1.05);
}

.kpi-card--success .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--primary .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
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
    letter-spacing: 0.01em;
    line-height: 1.4;
}

.kpi-card__value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-1);
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.kpi-card__subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    line-height: 1.4;
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.dashboard-content {
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

