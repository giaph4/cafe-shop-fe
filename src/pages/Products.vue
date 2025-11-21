<template>
    <div class="products-page container-fluid" data-aos="fade-up">
        <div
            class="page-header d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
            <div>
                <h2 class="page-title text-primary mb-1">Quản lý Sản phẩm</h2>
                <p class="page-subtitle mb-0 text-muted">Theo dõi trạng thái, giá và công thức sản phẩm với bố cục linh
                    hoạt.</p>
            </div>
            <div class="page-actions d-flex flex-wrap gap-2 justify-content-lg-end">
                <div class="btn-group layout-toggle" role="group" aria-label="Chọn bố cục hiển thị">
                    <button
                        type="button"
                        class="btn"
                        :class="layoutMode === 'table' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="setLayout('table')"
                    >
                        <i class="bi bi-table me-2"></i>Bảng
                    </button>
                    <button
                        type="button"
                        class="btn"
                        :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="setLayout('grid')"
                    >
                        <i class="bi bi-grid-3x3-gap me-2"></i>Thẻ
                    </button>
                </div>
                <button class="btn btn-primary" @click="openModal()">
                    <i class="bi bi-plus-lg me-2"></i>Thêm sản phẩm
                </button>
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

        <div class="card">
            <div class="card-body">
                <div v-if="loading" class="state-block">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <div v-else-if="error" class="alert alert-danger d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>{{ error }}</span>
                </div>
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
                                        <button class="action-button" type="button" @click="openModal(product)">
                                            <i class="bi bi-pencil"></i>
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button
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
                                        <button class="action-button action-button--danger" type="button" @click="deleteProduct(product)">
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
                                <button class="action-button" type="button" @click="openModal(product)">
                                    <i class="bi bi-pencil"></i>
                                    <span>Chỉnh sửa</span>
                                </button>
                                <button
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
                                <button class="action-button action-button--danger" type="button" @click="deleteProduct(product)">
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
    </div>
</template>

<script setup>
import {computed, nextTick, reactive, ref, watch} from 'vue'
import {onBeforeRouteLeave, useRoute, useRouter} from 'vue-router'
import {toast} from 'vue3-toastify'
import * as productService from '@/api/productService'
import * as categoryService from '@/api/categoryService'
import {formatCurrency} from '@/utils/formatters'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ProductModal from '@/components/products/ProductModal.vue'
import ProductDetailModal from '@/components/products/ProductDetailModal.vue'
import {PaginationMode, usePagination} from '@/composables/usePagination'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref(null)
const selectedProduct = ref(null)
const detailProduct = ref(null)
const productModal = ref(null)
const productDetailModal = ref(null)
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
    loading.value = true
    error.value = null
    const requestedPage = zeroBasedPage.value
    try {
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
    } catch (err) {
        console.error(err)
        error.value = err.response?.data?.message || 'Không thể tải danh sách sản phẩm.'
    } finally {
        loading.value = false
    }
}

const fetchCategories = async () => {
    try {
        const response = await categoryService.getCategories()
        categories.value = Array.isArray(response?.content) ? response.content : response
    } catch (err) {
        console.error('Không thể tải danh mục:', err)
        toast.error('Không thể tải danh mục. Vui lòng thử lại.')
    }
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

const deleteProduct = async (product) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa "${product.name}"?`)
    if (!confirmDelete) return

    try {
        await productService.deleteProduct(product.id)
        toast.success('Đã xóa sản phẩm thành công')
        fetchProducts()
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm. Vui lòng thử lại.')
    }
}

const handleToggleAvailability = async (product) => {
    if (!product?.id) return
    togglingAvailability[product.id] = true
    try {
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
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại.')
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
.page-header {
    background: linear-gradient(102deg, rgba(99, 102, 241, 0.12) 0%, rgba(129, 140, 248, 0.08) 100%);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    backdrop-filter: blur(10px);
}

.page-title {
    font-weight: 700;
}

.page-subtitle {
    font-size: 0.95rem;
}

.layout-toggle .btn {
    min-width: 120px;
    font-weight: 600;
}

.filter-card {
    border-radius: 18px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.search-field .input-group-text {
    background: transparent;
    border-right: none;
}

.search-field .form-control {
    border-left: none;
}

.state-block {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.product-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
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
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.45rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.28);
    background: var(--color-button-muted-bg);
    color: var(--color-primary);
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
    background: var(--color-button-muted-hover);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.18);
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.65;
    pointer-events: none;
}

.action-button--success {
    border-color: rgba(16, 185, 129, 0.32);
    color: var(--color-success);
}

.action-button--success:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.12);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.18);
}

.action-button--warning {
    border-color: rgba(249, 115, 22, 0.32);
    color: var(--color-warning);
}

.action-button--warning:hover:not(:disabled) {
    background: rgba(249, 115, 22, 0.12);
    box-shadow: 0 6px 16px rgba(249, 115, 22, 0.18);
}

.action-button--danger {
    border-color: rgba(239, 68, 68, 0.32);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.12);
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.18);
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
}

.product-card {
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
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
    top: 1rem;
    left: 1rem;
    backdrop-filter: blur(6px);
    border: 1px solid transparent;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.15);
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
    padding: 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.product-card__title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-heading);
}

.product-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.9rem;
}

.product-card__price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: var(--color-primary);
}

.product-card__actions {
    padding: 0 1.25rem 1.25rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.product-card__actions .action-button {
    width: 100%;
}

@media (max-width: 768px) {
    .page-header {
        padding: 1.25rem 1.5rem;
    }

    .product-card__actions {
        grid-template-columns: 1fr;
    }

    .action-grid {
        grid-template-columns: 1fr;
    }
}

</style>
