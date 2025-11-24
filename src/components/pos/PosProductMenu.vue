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
            <div v-if="isLoading" class="pos-product-menu__loading">
                <div class="spinner-border text-primary" role="status"></div>
                <p>Đang tải sản phẩm...</p>
            </div>
            <div v-else-if="isError" class="pos-product-menu__error">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Không thể tải sản phẩm. Vui lòng thử lại.</p>
            </div>
            <div v-else-if="filteredProducts.length === 0" class="pos-product-menu__empty">
                <i class="bi bi-search"></i>
                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
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
.pos-product-menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.25rem;
    overflow: hidden;
}

/* Header */
.pos-product-menu__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.875rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.btn-back {
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s;
}

.btn-back:hover {
    color: var(--color-primary);
}

.pos-product-menu__title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-heading);
    margin: 0;
    flex: 1;
    text-align: center;
}

.pos-product-menu__search-hint {
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

kbd {
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    font-family: monospace;
}

/* Search */
.pos-product-menu__search {
    margin-bottom: 1.25rem;
    flex-shrink: 0;
}

.input-group-lg .form-control {
    font-size: 1rem;
    padding: 0.75rem 1rem;
}

.input-group-text {
    background: var(--color-bg-muted);
    border-color: var(--color-border);
}

/* Categories */
.pos-product-menu__categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.category-pill {
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    cursor: pointer;
}

.category-pill:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--color-primary);
    transform: translateY(-1px);
}

.category-pill--active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* List Header */
.pos-product-menu__list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-shrink: 0;
}

.pos-product-menu__count {
    color: var(--color-text-muted);
    font-size: 0.875rem;
}

.pos-product-menu__view-toggle {
    display: flex;
    gap: 0.5rem;
}

.view-toggle-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    border-radius: 8px;
    color: var(--color-text-muted);
    transition: all 0.2s ease;
    cursor: pointer;
}

.view-toggle-btn:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.view-toggle-btn--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

/* Content */
.pos-product-menu__content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.pos-product-menu__loading,
.pos-product-menu__error,
.pos-product-menu__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--color-text-muted);
}

.pos-product-menu__error i,
.pos-product-menu__empty i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

/* Products Grid */
.pos-product-menu__products {
    display: grid;
    gap: 1rem;
}

.pos-product-menu__products.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.pos-product-menu__products.view-list {
    grid-template-columns: 1fr;
}

/* Product Card */
.product-card {
    cursor: pointer;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.product-card__image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
}

.product-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.product-card:hover .product-card__image img {
    transform: scale(1.05);
}

.product-card__badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.product-card__body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.product-card__title {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-heading);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-card__price {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-primary);
}

.product-card__description {
    font-size: 0.8rem;
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
