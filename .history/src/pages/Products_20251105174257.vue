<template>
    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Sản phẩm</h2>
            <router-link to="/products/new" class="btn btn-primary">
                <i class="bi bi-plus-lg me-2"></i> Thêm mới
            </router-link>
        </div>

        <div class="card mb-4">
            <div class="card-body d-flex flex-wrap gap-3 justify-content-between">
                <div class="input-group" style="max-width: 400px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm kiếm theo tên sản phẩm..."
                        v-model="filters.name">
                </div>
                <div class="input-group" style="max-width: 250px;">
                    <span class="input-group-text"><i class="bi bi-tags-fill"></i></span>
                    <select class="form-select" v-model="filters.categoryId">
                        <option value="">Tất cả danh mục</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                            {{ category.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <div v-if="isLoading" class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>

                <div v-else-if="isError" class="alert alert-danger">
                    Không thể tải dữ liệu: {{ error.message }}
                </div>

                <div v-else-if="products" class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th scope="col">Sản phẩm</th>
                                <th scope="col">Giá</th>
                                <th scope="col">Danh mục</th>
                                <th scope="col" class="text-center">Trạng thái</th>
                                <th scope="col" class="text-end">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="product in products.content" :key="product.id">
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img :src="product.imageUrl || '/placeholder.png'" alt=""
                                            class="rounded me-3" width="60" height="60" style="object-fit: cover;">
                                        <span class="fw-bold">{{ product.name }}</span>
                                    </div>
                                </td>
                                <td class="text-danger fw-bold">{{ formatMoney(product.price) }}</td>
                                <td>
                                    <span class="badge bg-light text-dark">{{ product.categoryName || 'N/A' }}</span>
                                </td>
                                <td class="text-center">
                                    <div class="form-check form-switch d-inline-block">
                                        <input class="form-check-input" type="checkbox" role="switch"
                                            :id="`switch-${product.id}`" :checked="product.isAvailable"
                                            @change="() => toggleAvailabilityMutation.mutate(product.id)">
                                        <label class="form-check-label" :for="`switch-${product.id}`">{{
                                            product.isAvailable ? 'Có sẵn' : 'Hết hàng' }}</label>
                                    </div>
                                </td>
                                <td class="text-end">
                                    <router-link :to="`/products/${product.id}/edit`"
                                        class="btn btn-sm btn-outline-primary me-2">
                                        <i class="bi bi-pencil-fill"></i> Sửa
                                    </router-link>
                                    <button class="btn btn-sm btn-outline-danger" @click="handleDelete(product)">
                                        <i class="bi bi-trash-fill"></i> Xoá
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="products.content.length === 0">
                                <td colspan="5" class="text-center text-muted">Không tìm thấy sản phẩm nào.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Pagination v-if="products && products.totalPages > 1" :totalPages="products.totalPages"
                    :currentPage="filters.page" @page-changed="onPageChange" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { toast } from 'vue3-toastify';
import { getProducts, deleteProduct, toggleProductAvailability } from '@/api/productService';
import { getCategories } from '@/api/categoryService';
import { formatMoney } from '@/utils/formatMoney';
import Pagination from '@/components/Pagination.vue';
import { debounce } from 'lodash';

const queryClient = useQueryClient();

const filters = reactive({
    name: '',
    categoryId: '',
    page: 0,
    size: 10,
});

const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    keepPreviousData: true,
});

const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
});

const toggleAvailabilityMutation = useMutation({
    mutationFn: toggleProductAvailability,
    onSuccess: (updatedProduct) => {
        toast.success(`Cập nhật trạng thái "${updatedProduct.name}" thành công!`);
        queryClient.invalidateQueries(['products', filters]);
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái.');
    },
});

const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
        toast.success('Xoá sản phẩm thành công!');
        queryClient.invalidateQueries(['products', filters]);
    },
    onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể xoá sản phẩm.');
    },
});

const handleDelete = (product) => {
    if (confirm(`Bạn có chắc chắn muốn xoá sản phẩm "${product.name}"?`)) {
        deleteMutation.mutate(product.id);
    }
};

const onPageChange = (page) => {
    filters.page = page;
};

watch(() => filters.name, debounce((newName) => {
    filters.page = 0;
}, 300));

watch(() => filters.categoryId, (newCategory) => {
    filters.page = 0;
});

</script>

<style scoped>
.page-title {
    color: #A36B4A;
}

.table-hover tbody tr:hover {
    background-color: #fdfaf7;
}

.form-check-input:checked {
    background-color: #A36B4A;
    border-color: #A36B4A;
}
</style>
