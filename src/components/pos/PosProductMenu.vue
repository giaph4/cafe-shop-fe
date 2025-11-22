<template>
    <div class="pos-product-menu">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <button class="btn btn-outline-secondary" @click="$emit('back-to-tables')">
                <i class="bi bi-arrow-left"></i> Quay lại
            </button>
            <h2 class="page-title mb-0">Chọn sản phẩm</h2>
            <div class="text-muted small">
                <kbd>/</kbd> để tìm kiếm
            </div>
        </div>

        <!-- Quick Search -->
        <div class="pos-product-menu__search mb-4">
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

        <!-- Category Pills -->
        <div class="pos-product-menu__categories mb-4">
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button
                    class="btn category-pill"
                    :class="!filters.categoryId ? 'btn-primary' : 'btn-outline-primary'"
                    @click="filters.categoryId = ''"
                >
                    Tất cả
                </button>
                <button
                    v-for="category in categoriesList"
                    :key="category.id"
                    class="btn category-pill"
                    :class="filters.categoryId === category.id ? 'btn-primary' : 'btn-outline-primary'"
                    @click="filters.categoryId = category.id"
                >
                    {{ category.name }}
                </button>
            </div>
        </div>

        <!-- Product Count -->
        <div class="d-flex justify-content-between align-items-center mb-3">
            <small class="text-muted">
                Tìm thấy <strong>{{ filteredProducts.length }}</strong> sản phẩm
            </small>
            <div class="d-flex gap-2">
                <button
                    class="btn btn-sm btn-outline-secondary"
                    :class="{ active: viewMode === 'grid' }"
                    @click="viewMode = 'grid'"
                    title="Lưới"
                >
                    <i class="bi bi-grid-3x3"></i>
                </button>
                <button
                    class="btn btn-sm btn-outline-secondary"
                    :class="{ active: viewMode === 'list' }"
                    @click="viewMode = 'list'"
                    title="Danh sách"
                >
                    <i class="bi bi-list-ul"></i>
                </button>
            </div>
        </div>

        <!-- Product List -->
        <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Đang tải sản phẩm...</p>
        </div>
        <div v-else-if="isError" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Không thể tải sản phẩm. Vui lòng thử lại.
        </div>
        <div v-else-if="filteredProducts.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-search fs-1 d-block mb-3"></i>
            <p class="mb-0">Không tìm thấy sản phẩm nào phù hợp.</p>
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
    size: 200, // Load more products for POS
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

// Client-side filtering for better UX (backup if server-side filtering doesn't work)
const filteredProducts = computed(() => {
    // Create a copy of the array to avoid readonly issues
    let result = [...productList.value]

    // If server-side filtering didn't work, do client-side filtering
    // Filter by category (handle both string and number)
    if (filters.value.categoryId) {
        const categoryId = filters.value.categoryId
        result = result.filter(p => {
            const pCategoryId = p.categoryId || p.category?.id
            if (!pCategoryId) return false
            return String(pCategoryId) === String(categoryId) || Number(pCategoryId) === Number(categoryId)
        })
    }

    // Filter by name (case-insensitive)
    if (filters.value.name) {
        const searchTerm = filters.value.name.toLowerCase().trim()
        if (searchTerm) {
            result = result.filter(p =>
                p.name?.toLowerCase().includes(searchTerm) ||
                p.description?.toLowerCase().includes(searchTerm)
            )
        }
    }

    // Show available products first - create new sorted array instead of mutating
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

// Keyboard shortcuts
const handleKeydown = (event) => {
    // Focus search on "/"
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
.pos-product-menu__search {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-card);
    padding: 1rem 0;
    margin: -1rem 0 1rem;
}

.category-pill {
    border-radius: 999px;
    font-weight: 500;
    transition: all 0.2s;
}

.category-pill:hover {
    transform: translateY(-1px);
}

.pos-product-menu__products {
    display: grid;
    gap: 1rem;
}

.pos-product-menu__products.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.pos-product-menu__products.view-list {
    grid-template-columns: 1fr;
}

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
    height: 160px;
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

kbd {
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    font-family: monospace;
}

@media (max-width: 768px) {
    .pos-product-menu__products.view-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
}
</style>
