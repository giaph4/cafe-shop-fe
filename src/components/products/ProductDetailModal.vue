<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header align-items-start">
                        <div>
                            <h5 class="modal-title">Chi tiết sản phẩm</h5>
                            <p class="text-muted mb-0">
                                Cập nhật lần cuối: {{ formatDate(detail.value?.createdAt) || '—' }}
                            </p>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="loading" class="detail-state">
                            <div class="spinner-border text-primary" role="status"></div>
                        </div>
                        <div v-else-if="error" class="alert alert-danger d-flex align-items-center gap-2">
                            <i class="bi bi-exclamation-triangle"></i>
                            <span>{{ error }}</span>
                        </div>
                        <div v-else-if="!detail.value" class="detail-state text-muted">
                            Không tìm thấy thông tin sản phẩm.
                        </div>
                        <div v-else class="detail-grid">
                            <aside class="detail-media">
                                <div class="image-frame">
                                    <img :src="detail.value.imageUrl || '/placeholder.png'" alt="Ảnh sản phẩm"/>
                                </div>
                                <div class="status-block"
                                     :class="detail.value.available ? 'status-block--active' : 'status-block--inactive'">
                                    <i class="bi"
                                       :class="detail.value.available ? 'bi-check-circle-fill' : 'bi-pause-circle'"></i>
                                    <span>{{ detail.value.available ? 'Đang kinh doanh' : 'Ngừng bán' }}</span>
                                </div>
                                <dl class="meta-list">
                                    <div>
                                        <dt>Mã sản phẩm</dt>
                                        <dd>{{ detail.value.code }}</dd>
                                    </div>
                                    <div>
                                        <dt>Danh mục</dt>
                                        <dd>{{ detail.value.categoryName || '—' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Ngày tạo</dt>
                                        <dd>{{ formatDate(detail.value.createdAt) || '—' }}</dd>
                                    </div>
                                </dl>
                            </aside>

                            <section class="detail-content">
                                <header class="detail-header">
                                    <h3>{{ detail.value.name }}</h3>
                                    <p class="text-muted mb-0">{{
                                            detail.value.description || 'Chưa có mô tả chi tiết.'
                                        }}</p>
                                </header>

                                <div class="info-cards">
                                    <div class="info-card">
                                        <span class="label">Giá bán</span>
                                        <strong class="value text-primary">{{
                                                formatCurrency(detail.value.price)
                                            }}</strong>
                                    </div>
                                    <div class="info-card">
                                        <span class="label">Giá vốn</span>
                                        <strong class="value">{{
                                                detail.value.cost !== null ? formatCurrency(detail.value.cost) : '—'
                                            }}</strong>
                                    </div>
                                    <div class="info-card">
                                        <span class="label">Biên lợi nhuận</span>
                                        <strong class="value text-success">{{ profitMargin }}</strong>
                                    </div>
                                </div>

                                <section class="recipe-section">
                                    <div class="d-flex align-items-center justify-content-between mb-3">
                                        <h5 class="mb-0">Công thức & Định lượng</h5>
                                        <button
                                            v-if="recipeLoading"
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            disabled
                                        >
                                            <span class="spinner-border spinner-border-sm me-2"></span>
                                            Đang tải công thức
                                        </button>
                                        <button
                                            v-else
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            @click="refreshRecipe"
                                        >
                                            <i class="bi bi-arrow-repeat me-2"></i>Tải lại
                                        </button>
                                    </div>

                                    <div v-if="recipeError" class="alert alert-warning d-flex align-items-center gap-2">
                                        <i class="bi bi-exclamation-circle"></i>
                                        <span>{{ recipeError }}</span>
                                    </div>

                                    <div v-if="recipeLoading" class="detail-state py-4">
                                        <div class="spinner-border text-primary" role="status"></div>
                                    </div>
                                    <div v-else-if="recipe.length === 0" class="empty-recipe">
                                        <i class="bi bi-journal-x"></i>
                                        <p class="mb-0">Chưa thiết lập công thức cho sản phẩm này.</p>
                                    </div>
                                    <div v-else class="table-responsive">
                                        <table class="table table-sm align-middle">
                                            <thead>
                                            <tr>
                                                <th>Nguyên liệu</th>
                                                <th>Đơn vị</th>
                                                <th class="text-end">Định lượng</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr v-for="ingredient in recipe"
                                                :key="ingredient.id || ingredient.ingredientId">
                                                <td>{{ ingredient.ingredientName }}</td>
                                                <td>{{ ingredient.unit }}</td>
                                                <td class="text-end">{{ formatNumber(ingredient.quantityNeeded) }}</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </section>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'
import {getProductById, getProductRecipe} from '@/api/productService'
import {formatCurrency, formatDateTime, formatNumber} from '@/utils/formatters'

const props = defineProps({
    product: {
        type: Object,
        default: null
    }
})

const modal = ref(null)
let modalInstance = null
const detail = reactive({value: null})
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
    modalInstance = new Modal(modal.value, {backdrop: true})
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
})

defineExpose({show, hide})
</script>

<style scoped>
.detail-state {
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.detail-grid {
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    gap: var(--spacing-8);
}

.detail-media {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);
}

.image-frame {
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
}

.image-frame img {
    width: 100%;
    height: 260px;
    object-fit: cover;
}

.status-block {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    width: fit-content;
}

.status-block--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.status-block--inactive {
    background: rgba(239, 68, 68, 0.18);
    color: var(--color-danger);
}

.meta-list {
    display: grid;
    gap: var(--spacing-3);
    padding: var(--spacing-5);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
    background: var(--color-card-muted);
}

.meta-list dt {
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    color: var(--color-text-subtle);
    font-weight: var(--font-weight-semibold);
}

.meta-list dd {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.detail-header h3 {
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    color: var(--color-heading);
}

.info-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-4);
}

.info-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-4) var(--spacing-5);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.info-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.info-card .label {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    color: var(--color-text-subtle);
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
}

.info-card .value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
}

.recipe-section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-5);
}

.empty-recipe {
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-8);
    text-align: center;
    color: var(--color-text-subtle);
    display: grid;
    gap: var(--spacing-3);
    justify-items: center;
    background: var(--color-card-muted);
}

.empty-recipe i {
    font-size: var(--font-size-3xl);
    color: var(--color-primary);
}

.product-detail-modal :global(.modal-backdrop.show) {
    background-color: rgba(15, 23, 42, 0.3);
    backdrop-filter: blur(2px);
}

@media (max-width: 992px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }

    .image-frame img {
        height: 220px;
    }

    .info-cards {
        grid-template-columns: 1fr;
    }
}
</style>
