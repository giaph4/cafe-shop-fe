<template>
  <div class="product-list">
    <div
      v-if="products.length === 0"
      class="empty-list"
    >
      <EmptyState
        title="Không có dữ liệu"
        message="Không tìm thấy sản phẩm nào"
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
            <th>Danh mục</th>
            <th>Giá</th>
            <th>Doanh thu</th>
            <th>Số lượng</th>
            <th>Lợi nhuận</th>
            <th>Margin</th>
            <th>Phân loại</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in products"
            :key="product.productId"
            :class="getRowClass(product.classification)"
          >
            <td>
              <div class="fw-semibold product-name">
                {{ product.productName }}
              </div>
            </td>
            <td>{{ product.categoryName }}</td>
            <td>{{ formatCurrency(product.price) }}</td>
            <td class="revenue-cell">
              {{ formatCurrency(product.revenue) }}
            </td>
            <td>{{ formatNumber(product.quantity) }}</td>
            <td
              class="profit-cell"
              :class="product.profit >= 0 ? 'text-success' : 'text-danger'"
            >
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
            <td>
              <span
                class="classification-badge"
                :class="`badge-${product.classificationColor}`"
              >
                {{ product.classificationLabel }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-flat btn-flat--outline btn-sm"
                title="Xem chi tiết"
                @click="$emit('view', product)"
              >
                <i class="bi bi-eye" />
              </button>
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

defineEmits(['view'])

const getRowClass = (classification) => {
    const classes = {
        'STAR': 'table-row-star',
        'CASH_COW': 'table-row-cash-cow',
        'QUESTION_MARK': 'table-row-question-mark',
        'DOG': 'table-row-dog'
    }
    return classes[classification] || ''
}

const getMarginClass = (margin) => {
    if (margin >= 40) return 'margin-excellent'
    if (margin >= 30) return 'margin-good'
    if (margin >= 20) return 'margin-average'
    return 'margin-low'
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

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.profit-cell {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.table-row-star {
    background: var(--color-soft-emerald);
}

.table-row-cash-cow {
    background: var(--color-soft-sky);
}

.table-row-question-mark {
    background: var(--color-soft-amber);
}

.table-row-dog {
    background: var(--color-soft-rose);
}

.margin-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-block;
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

.classification-badge {
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
</style>

