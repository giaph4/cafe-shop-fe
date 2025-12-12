<template>
  <div class="customers-tab">
    <div class="customers-tab__summary">
      <div class="summary-card">
        <div class="summary-card__icon bg-emerald-light">
          <i class="bi bi-cash-coin" />
        </div>
        <div class="summary-card__meta">
          <span>Tổng chi phí</span>
          <strong>{{ formatCurrency(expenseSummary.total) }}</strong>
          <small v-if="expenseSummary.range">{{ expenseSummary.range }}</small>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon bg-amber-light">
          <i class="bi bi-bag-plus" />
        </div>
        <div class="summary-card__meta">
          <span>Chi phí nhập nguyên liệu</span>
          <strong>{{ formatCurrency(importSummary.total) }}</strong>
          <small v-if="importSummary.range">{{ importSummary.range }}</small>
        </div>
      </div>
    </div>

    <div class="customers-tab__grid">
      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Khách hàng tiêu biểu
            </h5>
            <p class="card-subtitle">
              Top khách hàng theo doanh số trong giai đoạn lọc
            </p>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
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
                  <th class="text-end">
                    Điểm
                  </th>
                  <th>Đơn gần nhất</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="customer in topCustomers"
                  :key="customer.customerId"
                >
                  <td>{{ customer.customerName }}</td>
                  <td>{{ customer.phone || '—' }}</td>
                  <td class="text-end">
                    {{ customer.totalOrders ?? 0 }}
                  </td>
                  <td class="text-end">
                    {{ formatCurrency(customer.totalSpent) }}
                  </td>
                  <td class="text-end">
                    {{ formatCurrency(customer.averageOrderValue) }}
                  </td>
                  <td class="text-end">
                    {{ customer.loyaltyPoints ?? 0 }}
                  </td>
                  <td>{{ formatDate(customer.lastOrderDate) }}</td>
                </tr>
                <tr v-if="!topCustomers?.length">
                  <td colspan="7">
                    <EmptyState message="Chưa có số liệu khách hàng" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h5 class="card-title">
              Hiệu suất nhân viên
            </h5>
            <p class="card-subtitle">
              Top nhân viên theo doanh thu và số đơn
            </p>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Vai trò</th>
                  <th class="text-end">
                    Số đơn
                  </th>
                  <th class="text-end">
                    Doanh thu
                  </th>
                  <th class="text-end">
                    Giá trị TB
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="staff in staffPerformance"
                  :key="staff.userId"
                >
                  <td>{{ staff.fullName || staff.username }}</td>
                  <td><span class="customers-tab__role-badge">{{ prettyRole(staff.role) }}</span></td>
                  <td class="text-end">
                    {{ staff.totalOrders ?? 0 }}
                  </td>
                  <td class="text-end">
                    {{ formatCurrency(staff.totalRevenue) }}
                  </td>
                  <td class="text-end">
                    {{ formatCurrency(staff.averageOrderValue) }}
                  </td>
                </tr>
                <tr v-if="!staffPerformance?.length">
                  <td colspan="5">
                    <EmptyState message="Chưa có thống kê nhân viên" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    topCustomers: { type: Array, default: () => [] },
    staffPerformance: { type: Array, default: () => [] },
    totalExpenses: { type: Object, default: null },
    totalImportedCost: { type: Object, default: null }
})

const expenseSummary = computed(() => buildFinancialSummary(props.totalExpenses, 'totalExpenses'))
const importSummary = computed(() => buildFinancialSummary(props.totalImportedCost, 'totalImportedIngredientCost'))

const buildFinancialSummary = (source, key) => {
    if (!source) {
        return { total: 0, range: '' }
    }
    const total = typeof source === 'number' ? source : source?.[key] ?? 0
    const { startDate, endDate } = source ?? {}
    let range = ''
    if (startDate || endDate) {
        range = [startDate, endDate].filter(Boolean).join(' → ')
    }
    return { total, range }
}

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
</script>

<style scoped>
.customers-tab {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.customers-tab__summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: var(--spacing-4);
}

/* Flat design - NO gradient, NO shadow */
.summary-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    padding: var(--spacing-5) var(--spacing-6);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    transition: background-color var(--transition-base), border-color var(--transition-base);
}

.summary-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
    /* NO transform, NO shadow */
}

.summary-card__icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-base);
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    color: var(--color-primary);
    flex-shrink: 0;
    /* NO shadow, NO gradient */
}

.summary-card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.summary-card__meta span {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.summary-card__meta strong {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

.summary-card__meta small {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
}

.customers-tab__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: var(--spacing-6);
}

.card-header {
    border-bottom: 1px solid var(--color-border);
    padding-bottom: var(--spacing-4);
    margin-bottom: 0;
}

.table {
    margin-bottom: 0;
}

.table tbody tr {
    vertical-align: middle;
}

/* Flat design - NO shadow, border-radius theo design system */
.customers-tab__role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-base);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: capitalize;
    color: var(--color-badge-soft-text);
    background: var(--color-badge-soft-bg);
    border: 1px solid var(--color-border);
    /* NO shadow */
}

@media (max-width: 992px) {
    .customers-tab__grid {
        grid-template-columns: 1fr;
    }
}
</style>
