<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <div class="products-header">
            <div class="products-header__content">
                <div class="products-header__title-section">
                    <h2 class="products-header__title">Quản lý Sản phẩm</h2>
                    <p class="products-header__subtitle">Theo dõi trạng thái, giá và công thức sản phẩm với bố cục linh hoạt.</p>
                </div>
                <div class="products-header__actions">
                    <div class="btn-group layout-toggle" role="group" aria-label="Chọn bố cục hiển thị">
                        <button
                            type="button"
                            class="btn btn-sm"
                            :class="layoutMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
                            @click="setLayout('table')"
                        >
                            <i class="bi bi-table me-2"></i>Bảng
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm"
                            :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
                            @click="setLayout('grid')"
                        >
                            <i class="bi bi-grid-3x3-gap me-2"></i>Thẻ
                        </button>
                    </div>
                    <button v-if="canCreate" class="btn btn-primary btn-sm" @click="openModal()">
                        <i class="bi bi-plus-lg me-2"></i>Thêm sản phẩm
                    </button>
                </div>
            </div>
        </div>

        <div class="card filter-card mb-4">
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-lg-4 col-md-6">
                        <label class="form-label">Tìm theo tên</label>
                        <div class="input-group search-field">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input
                                v-model="filters.name"
                                type="text"
                                class="form-control"
                                placeholder="Nhập tên sản phẩm"
                                @input="handleSearchInput"
                            />
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Danh mục</label>
                        <select class="form-select" v-model="filters.categoryId">
                            <option :value="null">Tất cả danh mục</option>
                            <option v-for="category in categories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                    </div>
                    <div class="col-lg-3 col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="filters.available">
                            <option :value="null">Tất cả</option>
                            <option :value="true">Đang kinh doanh</option>
                            <option :value="false">Ngừng bán</option>
                        </select>
                    </div>
                    <div class="col-lg-2 col-md-6">
                        <button class="btn btn-outline-secondary w-100" type="button" @click="resetFilters">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>Thiết lập lại
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card tabs-card">
            <div class="card-body">
                <LoadingState v-if="loading" />
                <ErrorState v-else-if="error" :message="error" @retry="fetchProducts" />
                <EmptyState
                    v-else-if="!products.length"
                    title="Chưa có sản phẩm"
                    message="Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý."
                />
                <div v-else>
                    <div v-if="isTableLayout" class="table-responsive">
                        <table class="table align-middle table-hover">
                            <thead>
                            <tr>
                                <th>Ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Mã</th>
                                <th>Giá bán</th>
                                <th>Danh mục</th>
                                <th>Trạng thái</th>
                                <th class="text-center">Hành động</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr v-for="product in products" :key="product.id">
                                <td>
                                    <img :src="product.imageUrl || '/placeholder.png'" alt="Ảnh sản phẩm"
                                         class="product-thumb"/>
                                </td>
                                <td class="fw-semibold">{{ product.name }}</td>
                                <td>{{ product.code }}</td>
                                <td>{{ formatCurrency(product.price) }}</td>
                                <td>{{ product.categoryName }}</td>
                                <td>
                                        <span
                                            class="status-pill"
                                            :class="product.available ? 'status-pill--active' : 'status-pill--inactive'"
                                        >
                                            {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                                        </span>
                                </td>
                                <td>
                                    <div class="action-grid">
                                        <button class="action-button" type="button" @click="openDetailModal(product)">
                                            <i class="bi bi-eye"></i>
                                            <span>Chi tiết</span>
                                        </button>
                                        <button v-if="canEdit" class="action-button" type="button" @click="openModal(product)">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button v-if="canEdit" class="action-button action-button--info" type="button" @click="openRecipeModal(product)">
                                            <i class="bi bi-list-check"></i>
                                            <span>Công thức</span>
                                        </button>
                                        <button
                                            v-if="canToggle"
                                            class="action-button"
                                            type="button"
                                            :class="product.available ? 'action-button--warning' : 'action-button--success'"
                                            :disabled="isToggling(product.id)"
                                            @click="handleToggleAvailability(product)"
                                        >
                                            <span v-if="isToggling(product.id)" class="spinner-border spinner-border-sm"></span>
                                            <template v-else>
                                                <i :class="product.available ? 'bi bi-slash-circle' : 'bi bi-check-circle'"></i>
                                                <span>{{ product.available ? 'Ngừng bán' : 'Kinh doanh' }}</span>
                                            </template>
                                        </button>
                                        <button v-if="canDelete" class="action-button action-button--danger" type="button" @click="deleteProduct(product)">
                                            <i class="bi bi-trash"></i>
                                            <span>Xóa</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="product-grid">
                        <article v-for="product in products" :key="product.id" class="product-card">
                            <div class="product-card__media">
                                <img :src="product.imageUrl || '/placeholder.png'" alt="Ảnh sản phẩm"/>
                                <span
                                    class="status-pill"
                                    :class="product.available ? 'status-pill--active' : 'status-pill--inactive'"
                                >
                                    {{ product.available ? 'Kinh doanh' : 'Ngừng bán' }}
                                </span>
                            </div>
                            <div class="product-card__body">
                                <h5 class="product-card__title">{{ product.name }}</h5>
                                <div class="product-card__meta">
                                    <span><i class="bi bi-tag me-1"></i>{{ product.code }}</span>
                                    <span><i class="bi bi-box-seam me-1"></i>{{ product.categoryName }}</span>
                                </div>
                                <div class="product-card__price">
                                    <span class="label">Giá bán</span>
                                    <span class="value">{{ formatCurrency(product.price) }}</span>
                                </div>
                            </div>
                            <div class="product-card__actions">
                                <button class="action-button" type="button" @click="openDetailModal(product)">
                                    <i class="bi bi-eye"></i>
                                    <span>Chi tiết</span>
                                </button>
                                <button v-if="canEdit" class="action-button" type="button" @click="openModal(product)">
                                    <i class="bi bi-pencil"></i>
                                    <span>Chỉnh sửa</span>
                                </button>
                                <button v-if="canEdit" class="action-button action-button--info" type="button" @click="openRecipeModal(product)">
                                    <i class="bi bi-list-check"></i>
                                    <span>Công thức</span>
                                </button>
                                <button
                                    v-if="canToggle"
                                    class="action-button"
                                    type="button"
                                    :class="product.available ? 'action-button--warning' : 'action-button--success'"
                                    :disabled="isToggling(product.id)"
                                    @click="handleToggleAvailability(product)"
                                >
                                    <span v-if="isToggling(product.id)" class="spinner-border spinner-border-sm"></span>
                                    <template v-else>
                                        <i :class="product.available ? 'bi bi-slash-circle' : 'bi bi-check-circle'"></i>
                                        <span>{{ product.available ? 'Ngừng bán' : 'Kinh doanh' }}</span>
                                    </template>
                                </button>
                                <button v-if="canDelete" class="action-button action-button--danger" type="button" @click="deleteProduct(product)">
                                    <i class="bi bi-trash"></i>
                                    <span>Xóa</span>
                                </button>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </div>

        <Pagination
            v-if="totalPages > 1"
            mode="zero-based"
            :total-pages="totalPages"
            :current-page="zeroBasedPage"
            @page-change="handlePageChange"
        />

        <ProductModal
            ref="productModal"
            :product="selectedProduct"
            :categories="categories"
            @saved="handleProductSaved"
        />

        <ProductDetailModal ref="productDetailModal" :product="detailProduct"/>
        
        <ProductRecipeModal ref="productRecipeModal" :product="selectedProduct" @saved="handleRecipeSaved" />
    </div>
</template>

<script setup>
import {computed, nextTick, reactive, ref, watch} from 'vue'
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router'
import {toast} from 'vue3-toastify'
import {storeToRefs} from 'pinia'
import * as productService from '@/api/productService'
import * as categoryService from '@/api/categoryService'
import {formatCurrency} from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ProductModal from '@/components/products/ProductModal.vue'
import ProductDetailModal from '@/components/products/ProductDetailModal.vue'
import ProductRecipeModal from '@/components/products/ProductRecipeModal.vue'
import {PaginationMode, usePagination} from '@/composables/usePagination'
import {useAuthStore} from '@/store/auth'
import {useAsyncOperation} from '@/composables/useAsyncOperation'

const authStore = useAuthStore()
const {isAdmin, isManager, isStaff} = storeToRefs(authStore)

// Permission checks
const canCreate = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canEdit = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canToggle = computed(() => isAdmin.value || isManager.value || isStaff.value)
const canDelete = computed(() => isAdmin.value || isManager.value) // Only Admin and Manager can delete

const {loading, error, execute} = useAsyncOperation({context: 'Products'})

const products = ref([])
const categories = ref([])
const selectedProduct = ref(null)
const detailProduct = ref(null)
const productModal = ref(null)
const productDetailModal = ref(null)
const productRecipeModal = ref(null)
const layoutMode = ref('table')
const togglingAvailability = reactive({})

const debounce = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
        if (timeoutId) {
            window.clearTimeout(timeoutId)
        }
        timeoutId = window.setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

const filters = reactive({
    name: '',
    categoryId: null,
    available: null
})

const isTableLayout = computed(() => layoutMode.value === 'table')

const router = useRouter()
const route = useRoute()

const {
    zeroBasedPage,
    currentPage,
    pageSize,
    totalPages,
    setPageFromZero,
    updatePageSize,
    updateFromResponse,
    rememberCurrent,
    restoreRemembered,
    syncQuery
} = usePagination({
    mode: PaginationMode.ZERO_BASED,
    pageSize: 10,
    persistKey: 'products'
})

syncQuery(route, router, {
    queryMode: PaginationMode.ZERO_BASED,
    pageParam: 'page',
    sizeParam: 'size'
})

onBeforeRouteLeave(() => {
    rememberCurrent()
})

const setLayout = (mode) => {
    if (layoutMode.value === mode) return
    layoutMode.value = mode
    rememberCurrent()
    updatePageSize(mode === 'grid' ? 12 : 10, {reset: false})
}

const isToggling = (id) => Boolean(togglingAvailability[id])

let suppressWatcherFetch = false

const fetchProducts = async () => {
    const requestedPage = zeroBasedPage.value
    
    await execute(async () => {
        const response = await productService.getProducts({
            name: filters.name,
            categoryId: filters.categoryId,
            available: filters.available,
            page: requestedPage,
            size: pageSize.value
        })
        products.value = response.content || []
        suppressWatcherFetch = true
        const {adjusted} = updateFromResponse({
            page: response.number,
            totalPages: response.totalPages,
            totalElements: response.totalElements
        })
        suppressWatcherFetch = false
        if (adjusted) {
            toast.info('Trang đang xem đã được điều chỉnh theo số trang khả dụng.', {autoClose: 2500})
        }
    }, 'Không thể tải danh sách sản phẩm.')
}

const fetchCategories = async () => {
    await execute(async () => {
        const response = await categoryService.getCategories()
        categories.value = Array.isArray(response?.content) ? response.content : response
    }, 'Không thể tải danh mục. Vui lòng thử lại.', {
        showToast: false // Không hiển thị toast cho categories, chỉ log error
    })
}

const debouncedFetchProducts = debounce(() => {
    rememberCurrent()
    fetchProducts()
}, 300)

const handleSearchInput = () => {
    debouncedFetchProducts()
}

watch(
    () => [filters.categoryId, filters.available],
    () => {
        fetchProducts()
    }
)

const openModal = (product = null) => {
    selectedProduct.value = product ? {...product} : null
    productModal.value?.show()
}

const openDetailModal = async (product) => {
    detailProduct.value = product ? {...product} : null
    await nextTick()
    productDetailModal.value?.show()
}

const openRecipeModal = (product) => {
    selectedProduct.value = product ? {...product} : null
    productRecipeModal.value?.show()
}

const handleRecipeSaved = () => {
    // Recipe saved successfully
}

const deleteProduct = async (product) => {
    if (!product?.id || !product?.name) return
    
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?\n\nHành động này không thể hoàn tác.`)
    if (!confirmed) return

    await execute(async () => {
        await productService.deleteProduct(product.id)
        toast.success('Đã xóa sản phẩm thành công')
        fetchProducts()
    }, 'Không thể xóa sản phẩm. Vui lòng thử lại.')
}

const handleToggleAvailability = async (product) => {
    if (!product?.id) return
    togglingAvailability[product.id] = true
    try {
        await execute(async () => {
            const updated = await productService.toggleProductAvailability(product.id)
            toast.success(updated.available ? 'Sản phẩm đã mở bán trở lại' : 'Sản phẩm đã ngừng bán')
            if (filters.available !== null && updated.available !== filters.available) {
                fetchProducts()
            } else {
                const index = products.value.findIndex((item) => item.id === updated.id)
                if (index !== -1) {
                    products.value.splice(index, 1, {...products.value[index], ...updated})
                }
            }
        }, 'Không thể thay đổi trạng thái. Vui lòng thử lại.', {
            showToast: false // Đã có toast riêng
        })
    } finally {
        delete togglingAvailability[product.id]
    }
}

const handleProductSaved = () => {
    fetchProducts()
}

const handlePageChange = (page) => {
    rememberCurrent()
    setPageFromZero(page)
}

const resetFilters = () => {
    filters.name = ''
    filters.categoryId = null
    filters.available = null
    fetchProducts()
}

watch(
    () => [zeroBasedPage.value, pageSize.value],
    () => {
        if (suppressWatcherFetch) return
        fetchProducts()
    },
    {immediate: true}
)

fetchCategories()
</script>

<style scoped>
/* Page-specific styles only - Global styles (.page-header, .page-title, .page-subtitle, .filter-card, .state-block) are in components.scss */

.layout-toggle .btn {
    min-width: 120px;
    font-weight: var(--font-weight-semibold);
}

.search-field .input-group-text {
    background: var(--color-card-muted);
    border-right: none;
    color: var(--color-text-muted);
}

.search-field .form-control {
    border-left: none;
    background: var(--color-card);
}

.product-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-normal);
}

.status-pill--active {
    background: var(--color-pill-active-bg);
    color: var(--color-pill-active-text);
}

.status-pill--inactive {
    background: var(--color-pill-inactive-bg);
    color: var(--color-pill-inactive-text);
}

.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
}

.action-button:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button--success {
    border-color: rgba(16, 185, 129, 0.3);
    color: var(--color-success);
}

.action-button--success:hover:not(:disabled) {
    background: var(--color-soft-emerald);
    border-color: var(--color-success);
}

.action-button--warning {
    border-color: rgba(245, 158, 11, 0.3);
    color: var(--color-warning);
}

.action-button--warning:hover:not(:disabled) {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
}

.action-button--info {
    border-color: rgba(99, 102, 241, 0.3);
    color: var(--color-primary);
}

.action-button--info:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary);
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    border-color: var(--color-danger);
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--spacing-6);
}

.product-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.product-card__media {
    position: relative;
}

.product-card__media img {
    width: 100%;
    height: 170px;
    object-fit: cover;
}

.product-card__media .status-pill {
    position: absolute;
    top: var(--spacing-4);
    left: var(--spacing-4);
    backdrop-filter: blur(6px);
    border: 1px solid transparent;
    box-shadow: var(--shadow-md);
}

.product-card__media .status-pill--active {
    background: var(--color-pill-active-overlay-bg);
    color: var(--color-pill-active-overlay-text);
    border-color: var(--color-pill-active-overlay-border);
}

.product-card__media .status-pill--inactive {
    background: var(--color-pill-inactive-overlay-bg);
    color: var(--color-pill-inactive-overlay-text);
    border-color: var(--color-pill-inactive-overlay-border);
}

.product-card__body {
    padding: 0 var(--spacing-5);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.product-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
}

.product-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
}

.product-card__price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
}

.product-card__actions {
    padding: 0 var(--spacing-5) var(--spacing-5);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-2);
}

.product-card__actions .action-button {
    width: 100%;
}


.products-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.products-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
}

.products-header__title-section {
    flex: 1;
    min-width: 0;
}

.products-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.products-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    font-weight: var(--font-weight-normal);
}

.products-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .products-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .products-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .product-card__actions {
        grid-template-columns: 1fr;
    }

    .action-grid {
        flex-direction: column;
    }

    .layout-toggle {
        width: 100%;
    }

    .layout-toggle .btn {
        flex: 1;
    }
}

</style>
