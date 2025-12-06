<template>
    <div class="products-page container-fluid" data-aos="fade-up" style="background: var(--color-body-bg); padding: var(--spacing-4);">
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
                                            @click="openToggleModal(product)"
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
                                    @click="openToggleModal(product)"
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

const toggleTarget = ref(null)
const toggleModalRef = ref(null)
let toggleModalInstance = null

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

// Pagination truyền thống
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
        // Chỉ gửi categoryId nếu có giá trị (không phải null hoặc undefined)
        const params = {
            name: filters.name || undefined,
            available: filters.available !== null ? filters.available : undefined,
            page: requestedPage,
            size: pageSize.value
        }
        
        // Chỉ thêm categoryId nếu có giá trị
        if (filters.categoryId !== null && filters.categoryId !== undefined) {
            params.categoryId = filters.categoryId
        }
        
        const response = await productService.getProducts(params)
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
            restoreRemembered()
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
        // Reset về trang đầu khi filter thay đổi
        setPageFromZero(0)
        rememberCurrent()
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

const openToggleModal = (product) => {
    if (!product?.id) return
    toggleTarget.value = product
    nextTick(() => {
        toggleModalInstance?.show()
    })
}

const closeToggleModal = () => {
    toggleModalInstance?.hide()
    toggleTarget.value = null
}

const handleToggleConfirm = async () => {
    if (!toggleTarget.value?.id) return
    await handleToggleAvailability(toggleTarget.value)
    closeToggleModal()
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

onBeforeRouteLeave(() => {
    rememberCurrent()
})

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

// Khởi tạo modal toggle
watch(
    () => toggleModalRef.value,
    (element) => {
        if (!element) return
        toggleModalInstance = new Modal(element, {backdrop: 'static'})
    },
    {immediate: true}
)
</script>

<style scoped>
/* Page-specific styles only - Global styles (.page-header, .page-title, .page-subtitle, .filter-card, .state-block) are in components.scss */

/* Filter Card - Chuẩn hóa theo base.css */
.filter-card {
    margin-bottom: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.filter-card :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.filter-card :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control),
.filter-card :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.filter-card :global(.form-control:focus),
.filter-card :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.filter-card :global(.input-group-text) {
    height: 40px;
    background: var(--color-card-muted);
    border-color: var(--color-border);
    color: var(--color-text-muted);
    padding: var(--spacing-2) var(--spacing-3);
}

.filter-card :global(.input-group-text i) {
    font-size: 18px;
    line-height: 1;
}

.filter-card :global(.btn-outline-secondary) {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    font-family: var(--font-family-sans);
}

.filter-card :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.filter-card :global(.btn-outline-secondary i) {
    font-size: 18px;
    line-height: 1;
}

.layout-toggle .btn {
    min-width: 120px;
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.layout-toggle .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.layout-toggle .btn-outline-primary {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.layout-toggle .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

/* Table - Minimal Table Styling */
.products-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.products-page :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.products-page :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.products-page :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.products-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.products-page :global(.table .fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.product-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

/* Status Pill - Chuẩn hóa */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.status-pill--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.status-pill--inactive {
    background: var(--color-soft-rose);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
}

/* Action Buttons - Flat Design */
.action-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    justify-content: center;
}

.action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-primary);
    background: var(--color-card);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    white-space: nowrap;
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.action-button:hover:not(:disabled) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.action-button:active:not(:disabled) {
    background: var(--color-card-muted);
}

.action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.action-button i {
    font-size: 16px;
    line-height: 1;
}

.action-button--info {
    border-color: var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
}

.action-button--info:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.action-button--danger {
    border-color: var(--color-border);
    background: var(--color-card);
    color: var(--color-danger);
}

.action-button--danger:hover:not(:disabled) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* Status Toggle Button - Flat Design */
.status-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-width: 1px;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.status-toggle-btn i {
    font-size: 16px;
    line-height: 1;
}

.status-toggle-btn--active {
    border-color: var(--color-border);
    color: var(--color-warning);
    background: var(--color-card);
}

.status-toggle-btn--active:hover:not(:disabled) {
    background: var(--color-soft-amber);
    border-color: var(--color-warning);
    color: var(--color-warning);
}

.status-toggle-btn--inactive {
    border-color: var(--color-border);
    color: var(--color-success);
    background: var(--color-card);
}

.status-toggle-btn--inactive:hover:not(:disabled) {
    background: var(--color-soft-emerald);
    border-color: var(--color-success);
    color: var(--color-success);
}

.status-toggle-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status-toggle-btn__label {
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

/* Product Grid Layout - Chuẩn hóa */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-4);
}

.product-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    transition: all var(--transition-base);
}

.product-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
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
    top: var(--spacing-3);
    left: var(--spacing-3);
    backdrop-filter: blur(6px);
    box-shadow: var(--shadow-base);
}

.product-card__body {
    padding: 0 var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.product-card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.product-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.product-card__meta i {
    font-size: 16px;
    line-height: 1;
}

.product-card__price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.product-card__price .label {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.product-card__actions {
    padding: 0 var(--spacing-4) var(--spacing-4);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-2);
}

.product-card__actions .action-button {
    width: 100%;
}


/* Header - Chuẩn hóa theo base.css */
.products-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.products-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.products-header__title-section {
    flex: 1;
    min-width: 0;
}

.products-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.products-header__subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-weight: var(--font-weight-normal);
    font-family: var(--font-family-sans);
}

.products-header__actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.products-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.products-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.products-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.products-header__actions .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.products-header__actions .btn i {
    font-size: 18px;
    line-height: 1;
}

.products-header__actions .btn-group {
    display: flex;
    gap: var(--spacing-2);
}

.products-header__actions .btn-group .btn {
    min-width: 120px;
}

/* Tabs - Flat Design */
.products-tabs {
    display: flex;
    gap: var(--spacing-2);
    background: var(--color-card-muted);
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    overflow-x: auto;
}

.products-tab {
    border: none;
    background: transparent;
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-base);
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.products-tab i {
    font-size: 18px;
    line-height: 1;
}

.products-tab:hover:not(.active) {
    background: var(--color-card);
    color: var(--color-heading);
}

.products-tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

/* KPI Cards - Flat Design */
.products-summary {
    margin-bottom: var(--spacing-4);
}

.kpi-card {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    min-height: 120px;
    height: 100%;
    transition: all var(--transition-base);
}

.kpi-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.kpi-card__icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

/* Màu icon - dùng var(--color-soft-*) */
.kpi-card--total .kpi-card__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.kpi-card--active .kpi-card__icon {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.kpi-card--inactive .kpi-card__icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.kpi-card--categories .kpi-card__icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.kpi-card__content {
    flex: 1;
    min-width: 0;
}

.kpi-card__label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.kpi-card__value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Cards - Chuẩn hóa */
.products-page :global(.card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.products-page :global(.tabs-card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

/* Delete Info Card - Chuẩn hóa */
.delete-info-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.delete-info-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.delete-info-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.delete-info-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Confirm Card - Chuẩn hóa */
.confirm-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.confirm-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
}

.confirm-label {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    flex-shrink: 0;
    min-width: 120px;
    font-family: var(--font-family-sans);
}

.confirm-value {
    font-size: var(--font-size-base);
    color: var(--color-heading);
    text-align: right;
    word-break: break-word;
    font-family: var(--font-family-sans);
}

/* Modal - Chuẩn hóa */
.products-page :global(.modal-content) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-header__content) {
    flex: 1;
}

.products-page :global(.modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: 0;
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-subtitle) {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

.products-page :global(.modal-body p) {
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-body strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-card);
}

.products-page :global(.modal-footer .btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.products-page :global(.modal-footer .btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.products-page :global(.modal-footer .btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.modal-footer .btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.products-page :global(.modal-footer .btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.products-page :global(.modal-footer .btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
}

.products-page :global(.modal-footer .btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.products-page :global(.modal-footer .btn:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Global Button Styles - Đồng bộ với các trang trước */
.products-page :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.products-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.products-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.btn-outline-secondary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-outline-secondary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.products-page :global(.btn-danger) {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.products-page :global(.btn-danger:hover:not(:disabled)) {
    background: var(--color-danger-dark);
}

.products-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 992px) {
    .products-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .products-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .kpi-card {
        flex-direction: column;
        text-align: center;
        min-height: auto;
    }

    .kpi-card__icon {
        width: 48px;
        height: 48px;
        font-size: 20px;
    }
}

@media (max-width: 768px) {
    .product-card__actions {
        grid-template-columns: 1fr;
    }

    .action-grid {
        flex-direction: column;
        width: 100%;
    }

    .action-button {
        width: 100%;
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

    .product-grid {
        grid-template-columns: 1fr;
    }
}

/* Infinite scroll sentinel */
.infinite-scroll-sentinel {
    padding: var(--spacing-6) var(--spacing-4);
    text-align: center;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.no-more-data {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.no-more-data i {
    font-size: 18px;
}

</style>
