<template>
  <div class="pos-product-menu">
    <!-- Header -->
    <div class="pos-product-menu__header">
      <button
        class="btn"
        @click="$emit('back-to-tables')"
      >
        <i class="bi bi-arrow-left" /> Quay lại
      </button>
      <h2 class="pos-product-menu__title">
        Chọn sản phẩm
      </h2>
      <div class="pos-product-menu__search-hint">
        <kbd>/</kbd> <span class="search-hint-text">để tìm kiếm</span>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="pos-product-menu__search">
      <div class="input-group input-group-lg">
        <span class="input-group-text">
          <i class="bi bi-search" />
        </span>
        <input
          ref="searchInputRef"
          v-model="filters.name"
          type="text"
          class="form-control"
          placeholder="Tìm sản phẩm nhanh (nhấn / để focus)..."
          @keydown.escape="clearSearch"
        >
        <button
          v-if="filters.name"
          class="btn btn-outline-secondary"
          type="button"
          @click="clearSearch"
        >
          <i class="bi bi-x-lg" />
        </button>
      </div>
    </div>

    <!-- Category Filters -->
    <div class="pos-product-menu__categories">
      <button
        class="category-pill"
        :class="!filters.categoryId || filters.categoryId === '' ? 'category-pill--active' : ''"
        @click="filters.categoryId = ''"
      >
        Tất cả
      </button>
      <button
        v-for="category in categoriesList"
        :key="category.id"
        class="category-pill"
        :class="String(filters.categoryId) === String(category.id) ? 'category-pill--active' : ''"
        @click="filters.categoryId = category.id"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Advanced Filters -->
    <div class="pos-product-menu__advanced-filters">
      <div class="row g-2">
        <div class="col-md-3 col-6">
          <label class="form-label small">Giá từ (₫)</label>
          <input
            v-model.number="filters.priceMin"
            type="number"
            class="form-control form-control-sm"
            placeholder="Từ"
            min="0"
            step="1000"
          >
        </div>
        <div class="col-md-3 col-6">
          <label class="form-label small">Giá đến (₫)</label>
          <input
            v-model.number="filters.priceMax"
            type="number"
            class="form-control form-control-sm"
            placeholder="Đến"
            min="0"
            step="1000"
          >
        </div>
        <div class="col-md-3 col-6">
          <label class="form-label small">Bán chạy</label>
          <select
            v-model="filters.bestseller"
            class="form-select form-select-sm"
          >
            <option :value="null">
              Tất cả
            </option>
            <option :value="true">
              Chỉ bán chạy
            </option>
            <option :value="false">
              Không bán chạy
            </option>
          </select>
        </div>
        <div class="col-md-3 col-6">
          <label class="form-label small">Sắp xếp</label>
          <select
            v-model="sortState"
            class="form-select form-select-sm"
          >
            <option value="">
              Mặc định
            </option>
            <option value="name-asc">
              Tên A-Z
            </option>
            <option value="name-desc">
              Tên Z-A
            </option>
            <option value="price-asc">
              Giá tăng dần
            </option>
            <option value="price-desc">
              Giá giảm dần
            </option>
            <option value="bestseller-desc">
              Bán chạy nhất
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Product List Header -->
    <div class="pos-product-menu__list-header">
      <span class="pos-product-menu__count">
        Tìm thấy <strong>{{ paginatedProducts.length }}</strong> sản phẩm
        <span
          v-if="totalFiltered > paginatedProducts.length"
          class="text-muted"
        >
          ({{ totalFiltered }} tổng cộng)
        </span>
      </span>
      <div class="pos-product-menu__view-toggle">
        <button
          class="view-toggle-btn"
          :class="{ 'view-toggle-btn--active': viewMode === 'grid' }"
          title="Lưới"
          @click="viewMode = 'grid'"
        >
          <i class="bi bi-grid-3x3" />
        </button>
        <button
          class="view-toggle-btn"
          :class="{ 'view-toggle-btn--active': viewMode === 'list' }"
          title="Danh sách"
          @click="viewMode = 'list'"
        >
          <i class="bi bi-list-ul" />
        </button>
      </div>
    </div>

    <!-- Product List -->
    <div class="pos-product-menu__content">
      <LoadingState
        v-if="isLoading"
        text="Đang tải sản phẩm..."
      />
      <ErrorState
        v-else-if="isError"
        message="Không thể tải sản phẩm. Vui lòng thử lại."
        :show-retry="true"
        :retry-handler="refetch"
      />
      <EmptyState
        v-else-if="filteredProducts.length === 0"
        title="Không tìm thấy sản phẩm"
        message="Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại."
      >
        <template #icon>
          <i class="bi bi-search" />
        </template>
      </EmptyState>
      <div
        v-else
        class="pos-product-menu__products"
        :class="`view-${viewMode}`"
      >
        <div
          v-for="product in paginatedProducts"
          :key="product.id"
          class="product-card"
          :class="{ 'product-card--unavailable': !product.available }"
          tabindex="0"
          @click="selectProduct(product)"
          @keydown.enter="selectProduct(product)"
        >
          <div class="product-card__image">
            <img
              :src="product.imageUrl || '/placeholder.png'"
              :alt="product.name"
              @error="handleImageError"
            >
            <div
              v-if="!product.available"
              class="product-card__badge"
            >
              <i class="bi bi-slash-circle" /> Ngừng bán
            </div>
          </div>
          <div class="product-card__body">
            <h6 class="product-card__title">
              {{ product.name }}
            </h6>
            <div class="product-card__price">
              {{ formatCurrency(product.price) }}
            </div>
            <div
              v-if="product.description"
              class="product-card__description"
            >
              {{ product.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="pos-product-menu__pagination"
    >
      <nav aria-label="Phân trang sản phẩm">
        <ul class="pagination pagination-sm justify-content-center mb-0">
          <li
            class="page-item"
            :class="{ disabled: currentPage === 0 }"
          >
            <button
              class="page-link"
              :disabled="currentPage === 0"
              @click="goToPage(currentPage - 1)"
            >
              <i class="bi bi-chevron-left" />
            </button>
          </li>
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage + 1 }"
          >
            <button
              v-if="page !== '...'"
              class="page-link"
              @click="goToPage(page - 1)"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="page-link"
            >{{ page }}</span>
          </li>
          <li
            class="page-item"
            :class="{ disabled: currentPage >= totalPages - 1 }"
          >
            <button
              class="page-link"
              :disabled="currentPage >= totalPages - 1"
              @click="goToPage(currentPage + 1)"
            >
              <i class="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getProducts } from '@/api/productService.js'
import { getCategories } from '@/api/categoryService.js'
import * as reportService from '@/api/reportService.js'
import { formatCurrency } from '@/utils/formatters.js'
import logger from '@/utils/logger'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const emit = defineEmits(['product-selected', 'back-to-tables'])

const searchInputRef = ref(null)
const viewMode = ref('grid')

const filters = ref({
    name: '',
    categoryId: '',
    priceMin: null,
    priceMax: null,
    bestseller: null,
    page: 0,
    size: 1000 // Lấy nhiều để filter client-side
})

const sortState = ref('')
const currentPage = ref(0)
const pageSize = ref(24) // 24 sản phẩm mỗi trang

// Bestseller data
const bestsellerProductIds = ref(new Set())
const bestsellerData = ref({})

const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: computed(() => ['products', 'pos', {
        page: filters.value.page,
        size: filters.value.size,
        name: filters.value.name || undefined,
        categoryId: filters.value.categoryId || undefined
    }]),
    queryFn: () => {
        const params = {
            page: filters.value.page,
            size: filters.value.size
        }

        // Chỉ thêm name nếu có giá trị
        if (filters.value.name && filters.value.name.trim()) {
            params.name = filters.value.name.trim()
        }

        // Chỉ thêm categoryId nếu có giá trị (không phải empty string)
        if (filters.value.categoryId && filters.value.categoryId !== '') {
            params.categoryId = filters.value.categoryId
        }

        return getProducts(params)
    }
})

const productList = computed(() => {
    if (!products?.value) return []
    if (Array.isArray(products.value)) return products.value
    if (Array.isArray(products.value?.content)) return products.value.content
    return []
})

const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
})

const categoriesList = computed(() => {
    if (!categories?.value) return []
    if (Array.isArray(categories.value)) return categories.value
    if (Array.isArray(categories.value?.content)) return categories.value.content
    return []
})

// Fetch bestseller data
const fetchBestsellerData = async () => {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        const bestsellerResponse = await reportService.getBestSellers(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            100,
            'quantity'
        )

        const ids = new Set()
        const dataMap = {}

        if (bestsellerResponse?.items) {
            bestsellerResponse.items.forEach((item) => {
                if (item.productId) {
                    ids.add(item.productId)
                    dataMap[item.productId] = {
                        totalQuantitySold: item.totalQuantitySold || 0,
                        totalRevenueGenerated: item.totalRevenueGenerated || 0,
                        rank: item.rank || 0
                    }
                }
            })
        }

        bestsellerProductIds.value = ids
        bestsellerData.value = dataMap
    } catch (error) {
        logger.warn('Không thể tải dữ liệu bán chạy:', error)
    }
}

const filteredProducts = computed(() => {
    let result = [...productList.value]

    // Filter theo giá
    if (filters.value.priceMin !== null && filters.value.priceMin !== undefined && filters.value.priceMin > 0) {
        result = result.filter((p) => (p.price || 0) >= filters.value.priceMin)
    }
    if (filters.value.priceMax !== null && filters.value.priceMax !== undefined && filters.value.priceMax > 0) {
        result = result.filter((p) => (p.price || 0) <= filters.value.priceMax)
    }

    // Filter theo bestseller
    if (filters.value.bestseller !== null && filters.value.bestseller !== undefined) {
        if (filters.value.bestseller === true) {
            result = result.filter((p) => bestsellerProductIds.value.has(p.id))
        } else if (filters.value.bestseller === false) {
            result = result.filter((p) => !bestsellerProductIds.value.has(p.id))
        }
    }

    // Sort: available products first, then by sortState
    result.sort((a, b) => {
        // Available first
        if (a.available && !b.available) return -1
        if (!a.available && b.available) return 1

        // Then by sortState
        if (sortState.value) {
            const [field, order] = sortState.value.split('-')
            const isAsc = order === 'asc'
            let comparison = 0

            if (field === 'name') {
                comparison = (a.name || '').localeCompare(b.name || '', 'vi')
            } else if (field === 'price') {
                comparison = (a.price || 0) - (b.price || 0)
            } else if (field === 'bestseller') {
                const aIsBestseller = bestsellerProductIds.value.has(a.id)
                const bIsBestseller = bestsellerProductIds.value.has(b.id)
                if (aIsBestseller && !bIsBestseller) comparison = -1
                else if (!aIsBestseller && bIsBestseller) comparison = 1
                else {
                    const aSales = bestsellerData.value[a.id]?.totalQuantitySold || 0
                    const bSales = bestsellerData.value[b.id]?.totalQuantitySold || 0
                    comparison = bSales - aSales
                }
            }

            return isAsc ? comparison : -comparison
        }

        return 0
    })

    return result
})

const totalFiltered = computed(() => filteredProducts.value.length)
const totalPages = computed(() => Math.ceil(totalFiltered.value / pageSize.value))

const paginatedProducts = computed(() => {
    const start = currentPage.value * pageSize.value
    const end = start + pageSize.value
    return filteredProducts.value.slice(start, end)
})

const visiblePages = computed(() => {
    const pages = []
    const total = totalPages.value
    const current = currentPage.value + 1

    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i)
        }
    } else {
        if (current <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i)
            pages.push('...')
            pages.push(total)
        } else if (current >= total - 2) {
            pages.push(1)
            pages.push('...')
            for (let i = total - 3; i <= total; i++) pages.push(i)
        } else {
            pages.push(1)
            pages.push('...')
            for (let i = current - 1; i <= current + 1; i++) pages.push(i)
            pages.push('...')
            pages.push(total)
        }
    }

    return pages
})

const goToPage = (page) => {
    if (page >= 0 && page < totalPages.value) {
        currentPage.value = page
        // Scroll to top
        const contentEl = document.querySelector('.pos-product-menu__content')
        if (contentEl) {
            contentEl.scrollTop = 0
        }
    }
}

const clearSearch = () => {
    filters.value.name = ''
    searchInputRef.value?.focus()
}

const handleImageError = (event) => {
    event.target.src = '/placeholder.png'
}

const selectProduct = (product) => {
    if (!product.available) {
        return
    }
    emit('product-selected', product)
}

const handleKeydown = (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        event.preventDefault()
        searchInputRef.value?.focus()
    }
}

// Watch cho name và categoryId để fetch lại
let nameWatchTimeout = null
watch(
    () => [filters.value.name, filters.value.categoryId],
    () => {
        if (nameWatchTimeout) clearTimeout(nameWatchTimeout)
        nameWatchTimeout = setTimeout(() => {
            filters.value.page = 0
            currentPage.value = 0
        }, 300)
    }
)

// Watch cho price, bestseller, sort để reset pagination
watch(
    () => [filters.value.priceMin, filters.value.priceMax, filters.value.bestseller, sortState.value],
    () => {
        currentPage.value = 0
    }
)

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    searchInputRef.value?.focus()
    fetchBestsellerData()
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Product Menu - Chuẩn hóa theo base.css */
.pos-product-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-4);
    overflow: hidden;
}

/* Header - Chuẩn hóa */
.pos-product-menu__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.btn-back {
    color: var(--color-text-muted);
    text-decoration: none;
    padding: var(--spacing-2);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all var(--transition-base);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.btn-back:hover {
    color: var(--color-primary);
    background: var(--color-card-muted);
}

.btn-back i {
    font-size: 18px;
    line-height: 1;
}

.pos-product-menu__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0;
    flex: 1;
    text-align: center;
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.pos-product-menu__search-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.search-hint-text {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

kbd {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    font-family: 'Courier New', monospace;
    color: var(--color-heading);
    min-width: 24px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Search - Chuẩn hóa */
.pos-product-menu__search {
    margin-bottom: var(--spacing-4);
    flex-shrink: 0;
}

.input-group-lg .form-control {
    font-size: var(--font-size-base);
    padding: var(--spacing-2) var(--spacing-3);
    height: 40px;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-sans);
}

.input-group-lg .form-control:focus {
    box-shadow: none;
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
}

.input-group-text {
    background: var(--color-card-muted);
    border-color: var(--color-border);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.input-group-text i {
    font-size: 18px;
    line-height: 1;
}

/* Categories - Chuẩn hóa pill */
.pos-product-menu__categories {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.category-pill {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    cursor: pointer;
    white-space: nowrap;
    font-family: var(--font-family-sans);
}

.category-pill:hover:not(.category-pill--active) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.category-pill--active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

/* Advanced Filters */
.pos-product-menu__advanced-filters {
    margin-bottom: var(--spacing-4);
    padding: var(--spacing-3);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    flex-shrink: 0;
}

.pos-product-menu__advanced-filters .form-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.pos-product-menu__advanced-filters .form-control,
.pos-product-menu__advanced-filters .form-select {
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

/* List Header - Chuẩn hóa */
.pos-product-menu__list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-4);
    flex-shrink: 0;
}

.pos-product-menu__count {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

.pos-product-menu__view-toggle {
    display: flex;
    gap: var(--spacing-2);
}

.view-toggle-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    transition: all var(--transition-base);
    cursor: pointer;
}

.view-toggle-btn:hover:not(.view-toggle-btn--active) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.view-toggle-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.view-toggle-btn i {
    font-size: 18px;
    line-height: 1;
}

/* Content */
.pos-product-menu__content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

/* Products Grid */
.pos-product-menu__products {
    display: grid;
    gap: var(--spacing-4);
}

.pos-product-menu__products.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.pos-product-menu__products.view-list {
    grid-template-columns: 1fr;
}

/* Product Card - Chuẩn hóa */
.product-card {
    cursor: pointer;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    transition: all var(--transition-base);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    border-color: var(--color-primary);
    background: var(--color-card-muted);
}

.product-card:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.product-card--unavailable {
    opacity: 0.6;
    cursor: not-allowed;
}

.product-card--unavailable:hover {
    border-color: var(--color-border);
    background: var(--color-card);
}

.product-card__image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: var(--color-card-muted);
}

.product-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-base);
}

.product-card:hover .product-card__image img {
    transform: scale(1.02);
}

/* Badge - Chuẩn hóa theo badge/pill hệ thống */
.product-card__badge {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    background: var(--color-soft-rose);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-family-sans);
}

.product-card__badge i {
    font-size: 16px;
    line-height: 1;
}

.product-card__body {
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    flex: 1;
}

.product-card__title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    margin: 0;
    line-height: var(--line-height-base);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-family: var(--font-family-sans);
}

.product-card__price {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-primary);
    font-family: var(--font-family-sans);
}

.product-card__description {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.pos-product-menu__products.view-list .product-card {
    flex-direction: row;
}

.pos-product-menu__products.view-list .product-card__image {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
}

.pos-product-menu__products.view-list .product-card__body {
    flex: 1;
}

@media (max-width: 768px) {
    .pos-product-menu {
        padding: 1rem;
    }

    .pos-product-menu__header {
        flex-wrap: wrap;
    }

    .pos-product-menu__title {
        order: 3;
        width: 100%;
        text-align: left;
    }

    .pos-product-menu__products.view-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
}

/* Pagination */
.pos-product-menu__pagination {
    margin-top: var(--spacing-4);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
}

.pos-product-menu__pagination .pagination {
    margin: 0;
}

.pos-product-menu__pagination .page-link {
    border-color: var(--color-border);
    color: var(--color-text);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-sm);
    transition: all var(--transition-base);
}

.pos-product-menu__pagination .page-link:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.pos-product-menu__pagination .page-item.active .page-link {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.pos-product-menu__pagination .page-item.disabled .page-link {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
