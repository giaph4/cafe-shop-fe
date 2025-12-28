<template>
  <div class="customers-tab">
    <div class="customers-tab__summary">
      <div class="summary-card">
        <div class="summary-card__icon bg-primary-light">
          <i class="bi bi-people" />
        </div>
        <div class="summary-card__meta">
          <span>Tổng khách hàng</span>
          <strong>{{ customerStats.totalCustomers }}</strong>
          <small>{{ customerStats.newThisMonth }} khách mới tháng này</small>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon bg-success-light">
          <i class="bi bi-person-check" />
        </div>
        <div class="summary-card__meta">
          <span>Khách quay lại</span>
          <strong>{{ customerStats.retentionRate }}%</strong>
          <small>{{ customerStats.returningCustomers }} khách cũ quay lại</small>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon bg-info-light">
          <i class="bi bi-person-badge" />
        </div>
        <div class="summary-card__meta">
          <span>Tổng nhân viên</span>
          <strong>{{ staffStats.totalStaff }}</strong>
          <small>{{ staffStats.activeStaff }} đang hoạt động</small>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon bg-warning-light">
          <i class="bi bi-star-fill" />
        </div>
        <div class="summary-card__meta">
          <span>Top nhân viên</span>
          <strong>{{ staffStats.topStaffName || '—' }}</strong>
          <small>{{ formatCurrency(staffStats.topStaffRevenue) }} doanh thu</small>
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
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="customer in filteredTopCustomers"
                  :key="customer.customerId"
                >
                  <td>{{ customer.customerName }}</td>
                  <td>{{ formatPhone(customer.phone) }}</td>
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
                </tr>
                <tr v-if="!filteredTopCustomers?.length">
                  <td colspan="6">
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
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 class="card-title">
                Hiệu suất nhân viên
              </h5>
              <p class="card-subtitle">
                Top nhân viên theo doanh thu và số đơn
              </p>
            </div>
            <div class="form-check form-switch">
              <input
                id="showActiveOnly"
                v-model="showActiveOnly"
                class="form-check-input"
                type="checkbox"
                role="switch"
              >
              <label
                class="form-check-label"
                for="showActiveOnly"
              >Chỉ hiện nhân viên có hoạt động</label>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
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
                  v-for="staff in filteredStaffPerformance"
                  :key="staff.userId"
                  :class="{ 'customers-tab__row--inactive': isInactiveStaff(staff) }"
                >
                  <td>{{ staff.fullName || staff.username }}</td>
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
                <tr v-if="!filteredStaffPerformance?.length">
                  <td colspan="4">
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
import { computed, ref } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
    topCustomers: { type: Array, default: () => [] },
    staffPerformance: { type: Array, default: () => [] },
    totalExpenses: { type: Object, default: null },
    totalImportedCost: { type: Object, default: null }
})

// Tính toán thống kê khách hàng
const customerStats = computed(() => {
    const total = props.topCustomers?.length || 0
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    // Giả sử có createdAt trong customer data, nếu không thì dùng lastOrderDate
    const newThisMonth = props.topCustomers?.filter(c => {
        const created = c.createdAt ? new Date(c.createdAt) : (c.lastOrderDate ? new Date(c.lastOrderDate) : null)
        return created && created >= thisMonth
    }).length || 0

    // Tính retention: khách có > 1 đơn = quay lại
    const returningCustomers = props.topCustomers?.filter(c => (c.totalOrders || 0) > 1).length || 0
    const retentionRate = total > 0 ? Math.round((returningCustomers / total) * 100) : 0

    return {
        totalCustomers: total,
        newThisMonth,
        returningCustomers,
        retentionRate
    }
})

// Tính toán thống kê nhân viên
const staffStats = computed(() => {
    const allStaff = props.staffPerformance || []
    const activeStaff = allStaff.filter(s => (s.totalRevenue || 0) > 0).length
    const topStaff = allStaff
        .filter(s => (s.totalRevenue || 0) > 0)
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0]

    return {
        totalStaff: allStaff.length,
        activeStaff,
        topStaffName: topStaff?.fullName || topStaff?.username || null,
        topStaffRevenue: topStaff?.totalRevenue || 0
    }
})

// Lọc khách hàng: chỉ hiện những khách có đơn hàng
const filteredTopCustomers = computed(() => (props.topCustomers || []).filter(c => (c.totalOrders || 0) > 0))

const showActiveOnly = ref(true) // Mặc định chỉ hiện nhân viên có hoạt động

// Lọc nhân viên: ưu tiên hiện những người có doanh số, làm mờ những người không có
const filteredStaffPerformance = computed(() => {
    const all = props.staffPerformance || []
    // Lọc: nếu showActiveOnly = true, chỉ hiện nhân viên có doanh số > 0
    const filtered = showActiveOnly.value
        ? all.filter(s => (s.totalRevenue || 0) > 0 || (s.totalOrders || 0) > 0)
        : all

    // Sắp xếp: có doanh số lên trước, không có xuống sau
    return [...filtered].sort((a, b) => {
        const aRevenue = a.totalRevenue || 0
        const bRevenue = b.totalRevenue || 0
        if (aRevenue > 0 && bRevenue === 0) return -1
        if (aRevenue === 0 && bRevenue > 0) return 1
        return bRevenue - aRevenue
    })
})

// Kiểm tra nhân viên không hoạt động (doanh số = 0)
const isInactiveStaff = (staff) => (staff.totalRevenue || 0) === 0 && (staff.totalOrders || 0) === 0

// Format số điện thoại: 0329463763 -> 0329 463 763
const formatPhone = (phone) => {
    if (!phone) return '—'
    const cleaned = phone.replace(/\D/g, '') // Chỉ lấy số
    if (cleaned.length === 10) {
        // Format: 0329 463 763
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
    } else if (cleaned.length === 11) {
        // Format: 0905 688 809
        return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
    }
    return phone // Giữ nguyên nếu không đúng format
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
    width: 56px;
    height: 56px;
    border-radius: var(--radius-base);
    display: grid;
    place-items: center;
    font-size: 24px;
    flex-shrink: 0;
    transition: transform var(--transition-base);
    /* NO shadow, NO gradient */
}

.summary-card:hover .summary-card__icon {
    transform: scale(1.05);
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

/* Icon background colors - đồng bộ với voucher card style */
.bg-emerald-light {
    background: rgba(34, 197, 94, 0.18);
    color: #22c55e;
}

.bg-amber-light {
    background: rgba(251, 191, 36, 0.18);
    color: #fbbf24;
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

.card-title {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
}

.table {
    margin-bottom: 0;
}

.table thead th {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    padding: var(--spacing-4) var(--spacing-3);
    border-bottom: 2px solid var(--color-border);
}

.table thead th.text-end {
    text-align: right;
}

.table tbody tr {
    vertical-align: middle;
    padding: var(--spacing-3) 0;
}

.table tbody td {
    padding: var(--spacing-4) var(--spacing-3);
}

.table tbody td.text-end {
    text-align: right;
}

/* Làm mờ nhân viên không hoạt động */
.customers-tab__row--inactive {
    opacity: 0.5;
    background: var(--color-card-muted);
}

.customers-tab__row--inactive:hover {
    opacity: 0.7;
    background: var(--color-card-muted);
}

/* Icon background colors */
.bg-primary-light {
    background: rgba(59, 130, 246, 0.18);
    color: #3b82f6;
}

.bg-success-light {
    background: rgba(34, 197, 94, 0.18);
    color: #22c55e;
}

.bg-info-light {
    background: rgba(14, 165, 233, 0.18);
    color: #0ea5e9;
}

.bg-warning-light {
    background: rgba(251, 191, 36, 0.18);
    color: #fbbf24;
}

@media (max-width: 992px) {
    .customers-tab__grid {
        grid-template-columns: 1fr;
    }
}
</style>
