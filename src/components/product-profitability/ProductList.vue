<template>
  <div class="product-list">
    <div
      v-if="products.length === 0"
      class="empty-list"
    >
      <EmptyState
        title="Không có dữ liệu"
        message="Không tìm thấy sản phẩm nào phù hợp với bộ lọc"
      />
    </div>
    <div
      v-else
      class="table-responsive"
    >
      <table class="table table-minimal">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Giá</th>
            <th>Chi phí</th>
            <th>Doanh thu</th>
            <th>Lợi nhuận</th>
            <th>Margin</th>
            <th>Số lượng</th>
            <th>Phân loại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in products"
            :key="product.productId"
          >
            <td>
              <div>
                <div class="fw-semibold product-name">
                  {{ product.name }}
                </div>
                <small class="text-muted">{{ product.categoryName }}</small>
              </div>
            </td>
            <td>{{ formatCurrency(product.price) }}</td>
            <td class="cost-cell">
              {{ formatCurrency(product.costPerUnit) }}
            </td>
            <td class="revenue-cell">
              {{ formatCurrency(product.totalRevenue) }}
            </td>
            <td class="profit-cell">
              {{ formatCurrency(product.profit) }}
            </td>
            <td>
              <span
                class="margin-badge"
                :class="getMarginClass(product.margin)"
              >
                {{ product.margin.toFixed(1) }}%
              </span>
            </td>
            <td>{{ formatNumber(product.totalQuantity) }}</td>
            <td>
              <span
                class="badge badge-soft"
                :class="getClassificationClass(product.classification)"
              >
                {{ product.classification }}
              </span>
            </td>
            <td>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-flat btn-flat--outline btn-sm"
                  title="Xem chi tiết"
                  @click="$emit('view', product)"
                >
                  <i class="bi bi-eye" />
                </button>
                <button
                  v-if="product.margin < 20"
                  class="btn btn-flat btn-flat--primary btn-sm"
                  title="Đề xuất giá"
                  @click="$emit('pricing', product)"
                >
                  <i class="bi bi-tag" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps({
    products: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

defineEmits(['view', 'pricing'])

const getMarginClass = (margin) => {
    if (margin >= 40) return 'margin-excellent'
    if (margin >= 25) return 'margin-good'
    if (margin >= 15) return 'margin-average'
    return 'margin-low'
}

const getClassificationClass = (classification) => {
    const classes = {
        'Star': 'badge-success',
        'Cash Cow': 'badge-info',
        'Question Mark': 'badge-warning',
        'Dog': 'badge-danger'
    }
    return classes[classification] || 'badge-neutral'
}
</script>

<style scoped>
.product-list {
    font-family: var(--font-family-sans);
}

.empty-list {
    padding: var(--spacing-8) 0;
}

.product-name {
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.cost-cell {
    font-family: var(--font-family-sans);
    color: var(--color-danger);
}

.revenue-cell {
    font-family: var(--font-family-sans);
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.profit-cell {
    font-family: var(--font-family-sans);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.margin-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
}

.margin-excellent {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.margin-good {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.margin-average {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.margin-low {
    background: var(--color-soft-rose);
    color: var(--color-danger);
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

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}
</style>

