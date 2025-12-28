<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="modal fade product-detail-modal"
      tabindex="-1"
      aria-labelledby="productDetailModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header__content">
              <h5
                id="productDetailModalLabel"
                class="modal-title"
              >
                Chi tiết sản phẩm #{{ detail.value?.id || '—' }}
              </h5>
              <p class="modal-subtitle">
                Xem thông tin chi tiết, giá cả và công thức của sản phẩm.
              </p>
            </div>
            <div class="modal-header__actions">
              <button
                type="button"
                class="btn-close"
                aria-label="Đóng"
                @click="hide"
              />
            </div>
          </div>

          <div class="modal-body">
            <LoadingState v-if="loading" />
            <ErrorState
              v-else-if="error"
              :message="error"
              :show-retry="false"
            />
            <EmptyState
              v-else-if="!detail.value"
              title="Không tìm thấy"
              message="Không tìm thấy thông tin sản phẩm."
            >
              <template #icon>
                <i class="bi bi-box-seam" />
              </template>
            </EmptyState>
            <template v-else>
              <div class="product-detail__layout">
                <!-- Left Column: Image & Meta Info -->
                <aside class="product-detail__left-column">
                  <div class="product-detail__image-card">
                    <div class="image-frame">
                      <img
                        :src="detail.value.imageUrl || '/placeholder.png'"
                        alt="Ảnh sản phẩm"
                      >
                    </div>
                    <div class="product-detail__status-badge">
                      <span
                        class="badge badge-status"
                        :class="detail.value.available ? 'badge-status--success' : 'badge-status--default'"
                      >
                        <i
                          class="bi me-1"
                          :class="detail.value.available ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'"
                        />
                        {{ detail.value.available ? 'Đang kinh doanh' : 'Ngừng bán' }}
                      </span>
                    </div>
                  </div>

                  <div class="info-section">
                    <h6 class="section-title">
                      <i class="bi bi-info-circle me-2" />
                      Thông tin cơ bản
                    </h6>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Mã sản phẩm:</span>
                        <span class="info-value">{{ detail.value.code || '—' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Danh mục:</span>
                        <span class="info-value">{{ detail.value.categoryName || '—' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Ngày tạo:</span>
                        <span class="info-value">{{ formatDate(detail.value.createdAt) || '—' }}</span>
                      </div>
                      <div
                        v-if="detail.value.updatedAt"
                        class="info-item"
                      >
                        <span class="info-label">Cập nhật:</span>
                        <span class="info-value">{{ formatDate(detail.value.updatedAt) || '—' }}</span>
                      </div>
                    </div>
                  </div>
                </aside>

                <!-- Right Column: Main Content -->
                <section class="product-detail__right-column">
                  <div class="info-section">
                    <h6 class="section-title">
                      <i class="bi bi-box-seam me-2" />
                      {{ detail.value.name }}
                    </h6>
                    <p
                      v-if="detail.value.description"
                      class="section-description"
                    >
                      {{ detail.value.description }}
                    </p>
                    <p
                      v-else
                      class="section-description text-muted"
                    >
                      Chưa có mô tả chi tiết.
                    </p>
                  </div>

                  <div class="info-section">
                    <h6 class="section-title">
                      <i class="bi bi-currency-dollar me-2" />
                      Giá cả & Lợi nhuận
                    </h6>
                    <div class="info-cards">
                      <div class="info-card">
                        <span class="info-card__label">Giá bán</span>
                        <strong class="info-card__value info-card__value--primary">{{
                          formatCurrency(detail.value.price)
                        }}</strong>
                      </div>
                      <div class="info-card">
                        <span class="info-card__label">Giá vốn</span>
                        <strong class="info-card__value">{{
                          detail.value.cost !== null ? formatCurrency(detail.value.cost) : '—'
                        }}</strong>
                      </div>
                      <div class="info-card">
                        <span class="info-card__label">Biên lợi nhuận</span>
                        <strong class="info-card__value info-card__value--success">{{ profitMargin }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="info-section">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h6 class="section-title mb-0">
                        <i class="bi bi-list-check me-2" />
                        Công thức & Định lượng
                      </h6>
                      <button
                        v-if="recipeLoading"
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        disabled
                      >
                        <span class="spinner-border spinner-border-sm me-2" />
                        Đang tải
                      </button>
                      <button
                        v-else
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="refreshRecipe"
                      >
                        <i class="bi bi-arrow-repeat me-2" />
                        Tải lại
                      </button>
                    </div>

                    <ErrorState
                      v-if="recipeError"
                      :message="recipeError"
                      :show-retry="false"
                      container-class="error-state--sm"
                    />

                    <LoadingState
                      v-else-if="recipeLoading"
                      text="Đang tải công thức..."
                      container-class="loading-state--sm"
                    />

                    <EmptyState
                      v-else-if="recipe.length === 0"
                      title="Chưa có công thức"
                      message="Chưa thiết lập công thức cho sản phẩm này."
                    >
                      <template #icon>
                        <i class="bi bi-journal-x" />
                      </template>
                    </EmptyState>

                    <div
                      v-else
                      class="table-wrapper"
                    >
                      <table class="table">
                        <thead>
                          <tr>
                            <th>Nguyên liệu</th>
                            <th>Đơn vị</th>
                            <th class="text-end">
                              Định lượng
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="ingredient in recipe"
                            :key="ingredient.id || ingredient.ingredientId"
                          >
                            <td>{{ ingredient.ingredientName }}</td>
                            <td>{{ ingredient.unit }}</td>
                            <td class="text-end">
                              {{ formatNumber(ingredient.quantityNeeded) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </template>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="hide"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { getProductById, getProductRecipe } from '@/api/productService'
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    product: {
        type: Object,
        default: null
    }
})

const modal = ref(null)
let modalInstance = null
const detail = reactive({ value: null })
const loading = ref(false)
const error = ref(null)
const recipe = ref([])
const recipeLoading = ref(false)
const recipeError = ref(null)
const activeFetchId = ref(null)

const profitMargin = computed(() => {
    if (!detail.value || detail.value.cost === null || detail.value.cost === undefined) return '—'
    const price = Number(detail.value.price ?? 0)
    const cost = Number(detail.value.cost ?? 0)
    if (price <= 0) return '—'
    const margin = ((price - cost) / price) * 100
    if (!Number.isFinite(margin)) return '—'
    return `${margin.toFixed(1)}%`
})

const formatDate = (value) => (value ? formatDateTime(value) : '')

const fetchDetail = async (id) => {
    if (!id) return
    loading.value = true
    error.value = null
    try {
        const response = await getProductById(id)
        detail.value = response
    } catch (err) {
        error.value = err.response?.data?.message || 'Không thể tải chi tiết sản phẩm.'
        detail.value = null
        console.error('[ProductDetailModal] Error:', err)
    } finally {
        loading.value = false
    }
}

const fetchRecipe = async (id) => {
    if (!id) {
        recipe.value = []
        return
    }
    recipeLoading.value = true
    recipeError.value = null
    try {
        const response = await getProductRecipe(id)
        recipe.value = Array.isArray(response) ? response : response?.data || []
    } catch (err) {
        recipeError.value = err.response?.data?.message || 'Không thể tải công thức sản phẩm.'
        recipe.value = []
        console.error('[ProductDetailModal] Recipe Error:', err)
    } finally {
        recipeLoading.value = false
    }
}

const refreshRecipe = () => {
    if (!detail.value?.id) return
    fetchRecipe(detail.value.id)
    toast.info('Đang tải lại công thức sản phẩm...')
}

watch(
    () => props.product?.id,
    async (id) => {
        if (!modalInstance) return
        detail.value = null
        recipe.value = []
        if (!id) return
        activeFetchId.value = id
        await Promise.all([fetchDetail(id), fetchRecipe(id)])
        await nextTick()
    }
)

const show = async () => {
    if (!props.product?.id) {
        toast.warning('Không tìm thấy sản phẩm để hiển thị chi tiết.')
        return
    }
    await Promise.all([fetchDetail(props.product.id), fetchRecipe(props.product.id)])
    await nextTick()
    modalInstance?.show()
}

const hide = () => modalInstance?.hide()

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
/* Modal - Chuẩn hóa theo base.css */
.product-detail-modal :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-modal);
}

.product-detail-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-4);
}

.modal-header__content {
    flex: 1;
    min-width: 0;
}

.product-detail-modal :global(.modal-header .modal-title) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.modal-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    margin-bottom: 0;
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.modal-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-shrink: 0;
}

.product-detail-modal :global(.modal-body) {
    padding: var(--spacing-5);
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    background: var(--color-card);
}

.product-detail-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.product-detail-modal :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.product-detail-modal :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Global Button Styles - Đồng bộ với các trang trước */
.product-detail-modal :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.product-detail-modal :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.product-detail-modal :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.product-detail-modal :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Layout */
.product-detail__layout {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr;
    gap: var(--spacing-6);
}

.product-detail__left-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.product-detail__right-column {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

/* Image Card */
.product-detail__image-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.product-detail__status-badge {
    display: flex;
    justify-content: center;
}

.image-frame {
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.image-frame img {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
}

/* Badge System - Chuẩn hóa theo tiêu chuẩn */
.product-detail-modal :global(.badge) {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.product-detail-modal :global(.badge-status) {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.product-detail-modal :global(.badge-status i) {
    font-size: 16px;
    line-height: 1;
}

/* Status Badge Variants */
.product-detail-modal :global(.badge-status--success),
.product-detail-modal :global(.badge-status--active) {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

.product-detail-modal :global(.badge-status--warning),
.product-detail-modal :global(.badge-status--pending) {
    background: rgba(251, 191, 36, 0.18);
    border-color: #f59e0b;
    color: #f59e0b;
}

.product-detail-modal :global(.badge-status--danger),
.product-detail-modal :global(.badge-status--cancelled) {
    background: rgba(244, 63, 94, 0.18);
    border-color: #ef4444;
    color: #ef4444;
}

.product-detail-modal :global(.badge-status--info),
.product-detail-modal :global(.badge-status--transferred) {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.product-detail-modal :global(.badge-status--default),
.product-detail-modal :global(.badge-status--inactive) {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

/* Type Badge Variants */
.product-detail-modal :global(.badge-type) {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    border: 1px solid;
    white-space: nowrap;
    line-height: 1.4;
}

.product-detail-modal :global(.badge-type--primary),
.product-detail-modal :global(.badge-type--percentage) {
    background: rgba(14, 165, 233, 0.18);
    border-color: #0ea5e9;
    color: #0ea5e9;
}

.product-detail-modal :global(.badge-type--secondary),
.product-detail-modal :global(.badge-type--fixed) {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
}

.product-detail-modal :global(.badge-type--success),
.product-detail-modal :global(.badge-type--premium) {
    background: rgba(34, 197, 94, 0.18);
    border-color: #22c55e;
    color: #22c55e;
}

/* Info Section */
.info-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    display: flex;
    align-items: center;
    font-family: var(--font-family-sans);
}

.section-title i {
    font-size: 20px;
    line-height: 1;
}

.section-description {
    color: var(--color-text);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

/* Info Grid */
.info-grid {
    display: grid;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

/* Info Cards */
.info-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-3);
}

.info-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    transition: all var(--transition-base);
}

.info-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-card__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.info-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.info-card__value--primary {
    color: var(--color-primary);
}

.info-card__value--success {
    color: var(--color-success);
}

/* Table Wrapper */
.table-wrapper {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow: hidden;
    background: var(--color-card);
}

/* Error State & Loading State - Small variants */
.error-state--sm {
    min-height: 120px;
    padding: var(--spacing-4);
}

.loading-state--sm {
    min-height: 120px;
    padding: var(--spacing-4);
}

/* Table - Minimal Table Styling */
.product-detail-modal :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.product-detail-modal :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.product-detail-modal :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.product-detail-modal :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

/* Responsive Design */
@media (max-width: 992px) {
    .product-detail__layout {
        grid-template-columns: 1fr;
    }

    .image-frame img {
        height: 240px;
    }

    .info-cards {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .product-detail-modal :global(.modal-body) {
        padding: var(--spacing-4);
    }

    .image-frame img {
        height: 200px;
    }

    .info-grid {
        padding: var(--spacing-3);
    }

    .info-card {
        padding: var(--spacing-3);
    }
}
</style>
