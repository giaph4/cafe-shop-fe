<template>
    <div class="pos-product-menu">
        <!-- Header -->
        <div class="pos-product-menu__header">
            <button class="btn btn-link btn-back" @click="$emit('back-to-tables')">
                <i class="bi bi-arrow-left"></i> Quay lại
            </button>
            <h2 class="pos-product-menu__title">Chọn sản phẩm</h2>
            <div class="pos-product-menu__search-hint">
                <kbd>/</kbd> để tìm kiếm
            </div>
        </div>

        <!-- Search Bar -->
        <div class="pos-product-menu__search">
            <div class="input-group input-group-lg">
                <span class="input-group-text">
                    <i class="bi bi-search"></i>
                </span>
                <input
                    ref="searchInputRef"
                    type="text"
                    class="form-control"
                    placeholder="Tìm sản phẩm nhanh (nhấn / để focus)..."
                    v-model="filters.name"
                    @keydown.escape="clearSearch"
                >
                <button
                    v-if="filters.name"
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="clearSearch"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>

        <!-- Category Filters -->
        <div class="pos-product-menu__categories">
            <button
                class="category-pill"
                :class="!filters.categoryId ? 'category-pill--active' : ''"
                @click="filters.categoryId = ''"
            >
                Tất cả
            </button>
            <button
                v-for="category in categoriesList"
                :key="category.id"
                class="category-pill"
                :class="filters.categoryId === category.id ? 'category-pill--active' : ''"
                @click="filters.categoryId = category.id"
            >
                {{ category.name }}
            </button>
        </div>

        <!-- Product List Header -->
        <div class="pos-product-menu__list-header">
            <span class="pos-product-menu__count">
                Tìm thấy <strong>{{ filteredProducts.length }}</strong> sản phẩm
            </span>
            <div class="pos-product-menu__view-toggle">
                <button
                    class="view-toggle-btn"
                    :class="{ 'view-toggle-btn--active': viewMode === 'grid' }"
                    @click="viewMode = 'grid'"
                    title="Lưới"
                >
                    <i class="bi bi-grid-3x3"></i>
                </button>
                <button
                    class="view-toggle-btn"
                    :class="{ 'view-toggle-btn--active': viewMode === 'list' }"
                    @click="viewMode = 'list'"
                    title="Danh sách"
                >
                    <i class="bi bi-list-ul"></i>
                </button>
            </div>
        </div>

        <!-- Product List -->
        <div class="pos-product-menu__content">
            <LoadingState v-if="isLoading" text="Đang tải sản phẩm..." />
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
                    <i class="bi bi-search"></i>
                </template>
            </EmptyState>
            <div v-else class="pos-product-menu__products" :class="`view-${viewMode}`">
                <div
                    v-for="product in filteredProducts"
                    :key="product.id"
                    class="product-card"
                    :class="{ 'product-card--unavailable': !product.available }"
                    @click="selectProduct(product)"
                    @keydown.enter="selectProduct(product)"
                    tabindex="0"
                >
                    <div class="product-card__image">
                        <img
                            :src="product.imageUrl || '/placeholder.png'"
                            :alt="product.name"
                            @error="handleImageError"
                        >
                        <div v-if="!product.available" class="product-card__badge">
                            <i class="bi bi-slash-circle"></i> Ngừng bán
                        </div>
                    </div>
                    <div class="product-card__body">
                        <h6 class="product-card__title">{{ product.name }}</h6>
                        <div class="product-card__price">{{ formatCurrency(product.price) }}</div>
                        <div v-if="product.description" class="product-card__description">
                            {{ product.description }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getProducts } from '@/api/productService.js'
import { getCategories } from '@/api/categoryService.js'
import { formatCurrency } from '@/utils/formatters.js'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const emit = defineEmits(['product-selected', 'back-to-tables'])

const searchInputRef = ref(null)
const viewMode = ref('grid')

const filters = ref({
    name: '',
    categoryId: '',
    page: 0,
    size: 200,
})

const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: computed(() => ['products', 'pos', {
        page: filters.value.page,
        size: filters.value.size,
        name: filters.value.name || undefined,
        categoryId: filters.value.categoryId || undefined
    }]),
    queryFn: () => getProducts({
        page: filters.value.page,
        size: filters.value.size,
        name: filters.value.name || undefined,
        categoryId: filters.value.categoryId || undefined
    }),
})

const productList = computed(() => {
    if (!products?.value) return []
    if (Array.isArray(products.value)) return products.value
    if (Array.isArray(products.value?.content)) return products.value.content
    return []
})

const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
})

const categoriesList = computed(() => {
    if (!categories?.value) return []
    if (Array.isArray(categories.value)) return categories.value
    if (Array.isArray(categories.value?.content)) return categories.value.content
    return []
})

const filteredProducts = computed(() => {
    let result = [...productList.value]

    if (filters.value.categoryId) {
        const categoryId = filters.value.categoryId
        result = result.filter(p => {
            const pCategoryId = p.categoryId || p.category?.id
            if (!pCategoryId) return false
            return String(pCategoryId) === String(categoryId) || Number(pCategoryId) === Number(categoryId)
        })
    }

    if (filters.value.name) {
        const searchTerm = filters.value.name.toLowerCase().trim()
        if (searchTerm) {
            result = result.filter(p =>
                p.name?.toLowerCase().includes(searchTerm) ||
                p.description?.toLowerCase().includes(searchTerm)
            )
        }
    }

    return [...result].sort((a, b) => {
        if (a.available && !b.available) return -1
        if (!a.available && b.available) return 1
        return 0
    })
})

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

onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    searchInputRef.value?.focus()
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
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
}

.btn-back:hover {
    color: var(--color-primary);
    background: var(--color-bg-muted);
}

.btn-back i {
    font-size: 18px;
    line-height: 1;
}

.pos-product-menu__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
    flex: 1;
    text-align: center;
    line-height: var(--line-height-tight);
}

.pos-product-menu__search-hint {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
}

kbd {
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-base);
    font-family: monospace;
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
    border-radius: var(--radius-base);
}

.input-group-text {
    background: var(--color-bg-muted);
    border-color: var(--color-border);
    border-radius: var(--radius-base) 0 0 var(--radius-base);
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
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    cursor: pointer;
    white-space: nowrap;
}

.category-pill:hover:not(.category-pill--active) {
    background: var(--color-bg-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.category-pill--active {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
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
    background: var(--color-bg);
    border-radius: var(--radius-base);
    color: var(--color-text-muted);
    transition: all var(--transition-base);
    cursor: pointer;
}

.view-toggle-btn:hover:not(.view-toggle-btn--active) {
    background: var(--color-bg-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.view-toggle-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
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
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-base);
    transition: all var(--transition-base);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    box-shadow: var(--shadow-hover);
    border-color: var(--color-primary);
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
    box-shadow: var(--shadow-base);
    border-color: var(--color-border);
}

.product-card__image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: var(--color-bg-muted);
}

.product-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-base);
}

.product-card:hover .product-card__image img {
    transform: scale(1.05);
}

/* Badge - Chuẩn hóa theo badge/pill hệ thống */
.product-card__badge {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    background: var(--color-bg-muted);
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    display: flex;
    align-items: center;
    gap: 6px;
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
    color: var(--color-text);
    margin: 0;
    line-height: var(--line-height-base);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-card__price {
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
    color: var(--color-primary);
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
</style>
