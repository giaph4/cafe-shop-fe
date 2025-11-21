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
        console.error(err)
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
        console.error(err)
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
    gap: 2rem;
}

.detail-media {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.image-frame {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.16);
}

.image-frame img {
    width: 100%;
    height: 260px;
    object-fit: cover;
}

.status-block {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    font-weight: 600;
    width: fit-content;
}

.status-block--active {
    background: rgba(16, 185, 129, 0.16);
    color: var(--color-success);
}

.status-block--inactive {
    background: rgba(248, 113, 113, 0.18);
    color: var(--color-danger);
}

.meta-list {
    display: grid;
    gap: 0.75rem;
    padding: 1.25rem;
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.4);
    background: var(--color-card-muted);
}

.meta-list dt {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
}

.meta-list dd {
    margin: 0;
    font-weight: 600;
    color: var(--color-heading);
}

.detail-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.detail-header h3 {
    font-weight: 700;
    margin-bottom: 0.35rem;
}

.info-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
}

.info-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.info-card .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: var(--color-text-subtle);
    letter-spacing: 0.06em;
}

.info-card .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-heading);
}

.recipe-section {
    border-top: 1px solid var(--color-border);
    padding-top: 1.25rem;
}

.empty-recipe {
    border: 1px dashed rgba(148, 163, 184, 0.4);
    border-radius: 16px;
    padding: 1.75rem;
    text-align: center;
    color: var(--color-text-subtle);
    display: grid;
    gap: 0.75rem;
    justify-items: center;
}

.empty-recipe i {
    font-size: 2rem;
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
