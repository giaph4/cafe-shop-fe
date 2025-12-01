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

        <!-- Summary KPI Cards -->
        <div class="products-summary mb-4">
            <div class="row g-4">
                <div class="col-md-3 col-sm-6">
                    <div class="kpi-card kpi-card--total">
                        <div class="kpi-card__icon">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Tổng sản phẩm:</div>
                            <div class="kpi-card__value">{{ productStats.total }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="kpi-card kpi-card--active">
                        <div class="kpi-card__icon">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Đang kinh doanh:</div>
                            <div class="kpi-card__value">{{ productStats.active }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="kpi-card kpi-card--inactive">
                        <div class="kpi-card__icon">
                            <i class="bi bi-pause-circle"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Ngừng bán:</div>
                            <div class="kpi-card__value">{{ productStats.inactive }}</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="kpi-card kpi-card--categories">
                        <div class="kpi-card__icon">
                            <i class="bi bi-tags"></i>
                        </div>
                        <div class="kpi-card__content">
                            <div class="kpi-card__label">Danh mục đang dùng:</div>
                            <div class="kpi-card__value">{{ productStats.categories }}</div>
                        </div>
                    </div>
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
                <div class="products-tabs mb-4">
                    <button
                        type="button"
                        class="products-tab"
                        :class="{ active: isTableLayout }"
                        @click="setLayout('table')"
                    >
                        <i class="bi bi-table"></i>
                        <span>Bảng</span>
                    </button>
                    <button
                        type="button"
                        class="products-tab"
                        :class="{ active: !isTableLayout }"
                        @click="setLayout('grid')"
                    >
                        <i class="bi bi-grid-3x3-gap"></i>
                        <span>Thẻ</span>
                    </button>
                </div>

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
                                            type="button"
                                            class="btn btn-sm status-toggle-btn"
                                            :class="product.available ? 'status-toggle-btn--active' : 'status-toggle-btn--inactive'"
                                            :disabled="isToggling(product.id)"
                                            @click="handleToggleAvailability(product)"
                                        >
                                            <span v-if="isToggling(product.id)" class="spinner-border spinner-border-sm"></span>
                                            <template v-else>
                                                <i :class="product.available ? 'bi bi-pause-circle' : 'bi bi-play-circle'"></i>
                                                <span class="status-toggle-btn__label">
                                                    {{ product.available ? 'Ngừng bán' : 'Kinh doanh' }}
                                                </span>
                                            </template>
                                        </button>
                                        <button
                                            v-if="canDelete"
                                            class="action-button action-button--danger"
                                            type="button"
                                            @click="openDeleteModal(product)"
                                        >
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
                                    type="button"
                                    class="btn btn-sm status-toggle-btn"
                                    :class="product.available ? 'status-toggle-btn--active' : 'status-toggle-btn--inactive'"
                                    :disabled="isToggling(product.id)"
                                    @click="handleToggleAvailability(product)"
                                >
                                    <span v-if="isToggling(product.id)" class="spinner-border spinner-border-sm"></span>
                                    <template v-else>
                                        <i :class="product.available ? 'bi bi-pause-circle' : 'bi bi-play-circle'"></i>
                                        <span class="status-toggle-btn__label">
                                            {{ product.available ? 'Ngừng bán' : 'Kinh doanh' }}
                                        </span>
                                    </template>
                                </button>
                                <button
                                    v-if="canDelete"
                                    class="action-button action-button--danger"
                                    type="button"
                                    @click="openDeleteModal(product)"
                                >
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

        <!-- Delete Product Modal -->
        <Teleport to="body">
            <div
                class="modal fade"
                tabindex="-1"
                aria-labelledby="deleteProductModalLabel"
                aria-hidden="true"
                ref="deleteModalRef"
            >
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header__content">
                                <h5 class="modal-title" id="deleteProductModalLabel">Xóa sản phẩm</h5>
                                <p class="modal-subtitle mb-0">Hành động này không thể hoàn tác.</p>
                            </div>
                            <button
                                type="button"
                                class="btn-close"
                                @click="closeDeleteModal"
                                aria-label="Đóng"
                            ></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Bạn có chắc chắn muốn xóa sản phẩm này không?</p>
                            <div class="delete-info-card">
                                <div class="delete-info-item">
                                    <span class="delete-info-label">Tên sản phẩm:</span>
                                    <span class="delete-info-value">{{ deleteTarget?.name || '—' }}</span>
                                </div>
                                <div class="delete-info-item">
                                    <span class="delete-info-label">Mã sản phẩm:</span>
                                    <span class="delete-info-value">{{ deleteTarget?.code || '—' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="closeDeleteModal"
                                :disabled="deletingProduct"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                class="btn btn-danger"
                                @click="confirmDeleteProduct"
                                :disabled="deletingProduct"
                            >
                                <span
                                    v-if="deletingProduct"
                                    class="spinner-border spinner-border-sm me-2"
                                ></span>
                                Xóa sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Toggle Availability Modal -->
        <Teleport to="body">
            <div class="modal fade" tabindex="-1" ref="toggleModalRef" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header__content">
                                <h5 class="modal-title">Thay đổi trạng thái sản phẩm</h5>
                                <p class="modal-subtitle mb-0">
                                    Xác nhận chuyển trạng thái kinh doanh cho sản phẩm này.
                                </p>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">
                                Bạn có chắc chắn muốn
                                <strong>{{ toggleTarget?.available ? 'ngừng bán' : 'mở bán lại' }}</strong>
                                sản phẩm <strong>{{ toggleTarget?.name }}</strong>?
                            </p>
                            <div class="confirm-card" v-if="toggleTarget">
                                <div class="confirm-item">
                                    <span class="confirm-label">Mã sản phẩm</span>
                                    <span class="confirm-value">{{ toggleTarget.code }}</span>
                                </div>
                                <div class="confirm-item">
                                    <span class="confirm-label">Trạng thái hiện tại</span>
                                    <span class="confirm-value">
                                        {{ toggleTarget.available ? 'Đang kinh doanh' : 'Ngừng bán' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Hủy
                            </button>
                            <button
                                type="button"
                                class="btn btn-primary"
                                @click="handleToggleConfirm"
                                :disabled="toggleTarget && isToggling(toggleTarget.id)"
                            >
                                <span
                                    v-if="toggleTarget && isToggling(toggleTarget.id)"
                                    class="spinner-border spinner-border-sm me-2"
                                ></span>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Delete Product Modal -->
        <Teleport to="body">
            <div class="modal fade" tabindex="-1" ref="deleteModalRef" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-header__content">
                                <h5 class="modal-title">Xóa sản phẩm</h5>
                                <p class="modal-subtitle mb-0">Hành động này không thể hoàn tác.</p>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-4">
                                Bạn có chắc chắn muốn xóa sản phẩm
                                <strong>{{ deleteTarget?.name }}</strong> không?
                            </p>
                            <div class="confirm-card" v-if="deleteTarget">
                                <div class="confirm-item">
                                    <span class="confirm-label">Mã sản phẩm</span>
                                    <span class="confirm-value">{{ deleteTarget.code }}</span>
                                </div>
                                <div class="confirm-item">
                                    <span class="confirm-label">Danh mục</span>
                                    <span class="confirm-value">{{ deleteTarget.categoryName || '—' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button
                                type="button"
                                class="btn btn-outline-secondary"
                                data-bs-dismiss="modal"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                class="btn btn-danger"
                                @click="handleDeleteConfirm"
                            >
                                Xóa sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
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
import {Modal} from 'bootstrap'
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
const productStats = ref({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0
})
const deleteTarget = ref(null)
const deleteModalRef = ref(null)
const deletingProduct = ref(false)
let deleteModalInstance = null

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
        const list = response.content || []
        products.value = list

        // Cập nhật thống kê cho card KPI (dựa trên dữ liệu hiện có)
        const activeCount = list.filter((p) => p.available).length
        const inactiveCount = list.filter((p) => !p.available).length
        const categorySet = new Set(list.map((p) => p.categoryName).filter(Boolean))
        productStats.value = {
            total: response.totalElements ?? list.length,
            active: activeCount,
            inactive: inactiveCount,
            categories: categorySet.size
        }
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

const openDeleteModal = (product) => {
    if (!product?.id) return
    deleteTarget.value = product
    nextTick(() => {
        deleteModalInstance?.show()
    })
}

const closeDeleteModal = () => {
    deleteModalInstance?.hide()
}

const confirmDeleteProduct = async () => {
    if (!deleteTarget.value?.id) return
    deletingProduct.value = true
    try {
    await execute(async () => {
            await productService.deleteProduct(deleteTarget.value.id)
        toast.success('Đã xóa sản phẩm thành công')
        fetchProducts()
    }, 'Không thể xóa sản phẩm. Vui lòng thử lại.')
        deleteTarget.value = null
        closeDeleteModal()
    } finally {
        deletingProduct.value = false
    }
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

// Khởi tạo modal xóa
watch(
    () => deleteModalRef.value,
    (element) => {
        if (!element) return
        deleteModalInstance = new Modal(element, {backdrop: 'static'})
    },
    {immediate: true}
)
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

/* Status toggle button (table & grid) */
.status-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    border-width: 1px;
}

.status-toggle-btn--active {
    border-color: rgba(245, 158, 11, 0.4);
    color: var(--color-warning);
    background: var(--color-soft-amber);
}

.status-toggle-btn--inactive {
    border-color: rgba(16, 185, 129, 0.4);
    color: var(--color-success);
    background: var(--color-soft-emerald);
}

.status-toggle-btn__label {
    white-space: nowrap;
}

/* Product grid layout */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-6);
}

.product-card {
    border: 1px solid var(--color-border-soft);
    border-radius: 24px;
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
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


/* Header */
.products-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-soft);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
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

/* Dashboard-like layout tabs */
.products-tabs {
    display: flex;
    gap: 0.75rem;
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    padding: 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-soft);
    overflow-x: auto;
}

.products-tab {
    border: none;
    background: transparent;
    padding: 0.75rem 1.35rem;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: background 0.2s ease;
}

.products-tab i {
    font-size: 1.15rem;
}

.products-tab.active {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

/* KPI summary cards */
.products-summary {
    margin-bottom: var(--spacing-4);
}

.kpi-card {
    background: #f8fafc;
    border: 1px solid rgba(226, 232, 240, 0.5);
    border-radius: 24px;
    padding: var(--spacing-5);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    min-height: 120px;
    height: 100%;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06);
}

.kpi-card__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    flex-shrink: 0;
    color: #6366f1;
}

.kpi-card--total .kpi-card__icon {
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.kpi-card--active .kpi-card__icon {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.kpi-card--inactive .kpi-card__icon {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.18);
}

.kpi-card--categories .kpi-card__icon {
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.18);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin-bottom: var(--spacing-2);
}

.kpi-card__value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
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

    .status-toggle-btn__label {
        display: none;
    }
}

</style>
