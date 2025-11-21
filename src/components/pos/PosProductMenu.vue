<template>
    <div>
        <div class="d-flex justify-content-between align-items-center mb-4">
            <button class="btn btn-outline-secondary" @click="$emit('back-to-tables')">
                <i class="bi bi-arrow-left"></i> Quay lại
            </button>
            <h2 class="page-title mb-0">Chọn sản phẩm</h2>
        </div>

        <!-- Filters -->
        <div class="row mb-3">
            <div class="col-md-6">
                <input type="text" class="form-control" placeholder="Tìm sản phẩm..." v-model="filters.name">
            </div>
            <div class="col-md-6">
                <select class="form-select" v-model="filters.categoryId">
                    <option value="">Tất cả danh mục</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
                </select>
            </div>
        </div>

        <!-- Product List -->
        <div v-if="isLoading" class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
        </div>
        <div v-else-if="isError" class="alert alert-danger">
            Không thể tải sản phẩm.
        </div>
        <div v-else class="row g-3">
            <div v-for="product in productList" :key="product.id" class="col-md-4">
                <div class="card h-100" @click="selectProduct(product)">
                    <img :src="product.imageUrl || '/placeholder.png'" class="card-img-top" alt="Product Image">
                    <div class="card-body">
                        <h5 class="card-title">{{ product.name }}</h5>
                        <p class="card-text text-primary fw-bold">{{ formatCurrency(product.price) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { getProducts } from '@/api/productService.js'
import { getCategories } from '@/api/categoryService.js'
import { formatCurrency } from '@/utils/formatters.js'

const emit = defineEmits(['product-selected', 'back-to-tables'])

const filters = ref({
    name: '',
    categoryId: '',
    page: 0,
    size: 100, // Assuming we want to show a large number of products in POS
})

const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', filters.value],
    queryFn: () => getProducts(filters.value),
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

const debounce = (fn, delay = 300) => {
    let timerId
    return (...args) => {
        if (timerId) {
            window.clearTimeout(timerId)
        }
        timerId = window.setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

const debouncedRefetch = debounce(refetch, 300)

watch(filters, debouncedRefetch, { deep: true })

const selectProduct = (product) => {
    emit('product-selected', product)
}
</script>

<style scoped>
.card {
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.card-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-heading);
}

.card-text {
    color: var(--color-primary);
}
.card-img-top {
    height: 150px;
    object-fit: cover;
}
</style>
