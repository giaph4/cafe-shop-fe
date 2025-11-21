<template>
    <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Sản phẩm</h2>
            <div class="d-flex gap-2" style="max-width: 520px;">
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm theo tên, mã..." v-model="keyword">
                </div>
                <select class="form-select" v-model="sort">
                    <option value="createdAt,desc">Mới nhất</option>
                    <option value="name,asc">Tên A-Z</option>
                    <option value="price,asc">Giá tăng</option>
                    <option value="price,desc">Giá giảm</option>
                </select>
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

                <div v-else-if="pageData && pageData.content" class="row g-3">
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3" v-for="p in pageData.content" :key="p.id">
                        <div class="card h-100 product-card shadow-sm">
                            <div class="ratio ratio-4x3 product-thumb" @click="openDetail(p)">
                                <img :src="getImageUrl(p)" class="card-img-top" alt="thumb">
                            </div>
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title mb-1">{{ p.name }}</h5>
                                <div class="text-muted small mb-2">#{{ p.code }}</div>
                                <div class="mb-2">
                                    <span class="badge bg-light text-dark me-1" v-if="p.category?.name">{{ p.category.name }}</span>
                                </div>
                                <div class="fw-bold text-primary mb-3">{{ formatPrice(p.price) }}</div>
                                <div class="mt-auto d-flex gap-2">
                                    <button class="btn btn-sm btn-outline-secondary" @click="openRecipe(p)">
                                        <i class="bi bi-list-ul"></i> Công thức
                                    </button>
                                    <label class="btn btn-sm btn-outline-primary mb-0">
                                        <i class="bi bi-upload"></i> Ảnh
                                        <input type="file" class="d-none" accept="image/*" @change="onUploadImage($event, p)" />
                                    </label>
                                    <button class="btn btn-sm btn-outline-dark ms-auto" @click="openDetail(p)">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-footer d-flex justify-content-end">
                <Pagination v-if="pageData" :current-page="currentPage" :total-pages="pageData.totalPages" @page-change="handlePageChange" />
            </div>
        </div>

        <!-- Modal Chi tiết -->
        <div class="modal fade" id="productDetailModal" tabindex="-1" ref="detailModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chi tiết sản phẩm: {{ selectedProduct?.name }}</h5>
                        <button type="button" class="btn-close" @click="closeDetail"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-5">
                                <img :src="getImageUrl(selectedProduct)" class="img-fluid rounded border" />
                            </div>
                            <div class="col-md-7">
                                <div class="mb-2"><strong>Mã:</strong> {{ selectedProduct?.code }}</div>
                                <div class="mb-2"><strong>Danh mục:</strong> {{ selectedProduct?.category?.name || '-' }}</div>
                                <div class="mb-2"><strong>Giá:</strong> {{ formatPrice(selectedProduct?.price) }}</div>
                                <div class="mb-2"><strong>Mô tả:</strong> {{ selectedProduct?.description || '-' }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="closeDetail">Đóng</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Công thức -->
        <div class="modal fade" id="recipeModal" tabindex="-1" ref="recipeModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Công thức: {{ selectedProduct?.name }}</h5>
                        <button type="button" class="btn-close" @click="closeRecipe"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="recipeLoading" class="text-center my-3">
                            <span class="spinner-border spinner-border-sm"></span> Đang tải công thức...
                        </div>
                        <div v-else>
                            <div v-if="recipeItems.length === 0" class="alert alert-warning">Chưa có công thức.</div>
                            <div v-else class="list-group">
                                <div class="list-group-item d-flex align-items-center" v-for="(it, idx) in recipeItems" :key="it.ingredientId">
                                    <div class="flex-grow-1">
                                        <div class="fw-bold">{{ it.ingredientName }}</div>
                                        <div class="text-muted small">{{ it.unit }}</div>
                                    </div>
                                    <div class="d-flex align-items-center gap-2">
                                        <input type="number" class="form-control" style="width: 120px" min="0" step="0.1" v-model.number="recipeItems[idx].quantity" />
                                        <button class="btn btn-sm btn-outline-danger" @click="removeRecipeItem(idx)"><i class="bi bi-x"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="closeRecipe">Đóng</button>
                        <button class="btn btn-primary" :disabled="updateRecipeMutation.isPending.value" @click="saveRecipe">
                            <span v-if="updateRecipeMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu công thức
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import Pagination from '@/components/Pagination.vue'
import { getProducts, getProductById, uploadProductImage, getProductRecipe, updateProductRecipe } from '@/api/productService'

const queryClient = useQueryClient()

const currentPage = ref(1)
const sort = ref('createdAt,desc')
const keyword = ref('')

const { data: pageData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', currentPage, sort, keyword],
    queryFn: () => getProducts({ page: currentPage.value - 1, size: 12, sort: sort.value, keyword: keyword.value }),
    keepPreviousData: true
})

watch([sort, keyword], () => {
    currentPage.value = 1
    refetch()
})

const handlePageChange = (page) => { currentPage.value = page }

const formatPrice = (v) => {
    if (v == null) return '-'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

const getImageUrl = (p) => {
    if (!p) return ''
    // nếu backend trả về imageUrl tuyệt đối thì dùng trực tiếp, nếu chỉ trả fileName thì lấy từ /uploads/products
    return p.imageUrl || `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1','')}/uploads/products/${p.imageFileName || p.image || ''}`
}

// Modal Chi tiết
const detailModalEl = ref(null)
const detailBs = ref(null)
const selectedProduct = ref(null)
onMounted(() => { if (detailModalEl.value) detailBs.value = new Modal(detailModalEl.value) })
onUnmounted(() => detailBs.value?.dispose())
const openDetail = async (p) => {
    try {
        const data = await getProductById(p.id)
        selectedProduct.value = data
        detailBs.value?.show()
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải chi tiết sản phẩm')
    }
}
const closeDetail = () => detailBs.value?.hide()

// Upload ảnh
const onUploadImage = async (evt, p) => {
    const file = evt.target.files?.[0]
    if (!file) return
    try {
        await uploadProductImage(p.id, file)
        toast.success('Tải ảnh thành công')
        queryClient.invalidateQueries(['products'])
        if (selectedProduct.value?.id === p.id) {
            const data = await getProductById(p.id)
            selectedProduct.value = data
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Tải ảnh thất bại')
    } finally {
        evt.target.value = ''
    }
}

// Modal Công thức
const recipeModalEl = ref(null)
const recipeBs = ref(null)
const recipeItems = ref([])
const recipeLoading = ref(false)
onMounted(() => { if (recipeModalEl.value) recipeBs.value = new Modal(recipeModalEl.value) })
onUnmounted(() => recipeBs.value?.dispose())

const openRecipe = async (p) => {
    selectedProduct.value = p
    recipeItems.value = []
    recipeLoading.value = true
    recipeBs.value?.show()
    try {
        const data = await getProductRecipe(p.id)
        // Chuẩn hóa dữ liệu hiển thị
        recipeItems.value = (data.items || data || []).map(it => ({
            ingredientId: it.ingredientId,
            ingredientName: it.ingredientName || it.ingredient?.name,
            quantity: it.quantity,
            unit: it.unit || it.ingredient?.unit
        }))
    } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể tải công thức')
    } finally {
        recipeLoading.value = false
    }
}
const closeRecipe = () => recipeBs.value?.hide()
const removeRecipeItem = (idx) => { recipeItems.value.splice(idx, 1) }

const updateRecipeMutation = useMutation({
    mutationFn: ({ productId, items }) => updateProductRecipe(productId, items),
    onSuccess: () => {
        toast.success('Cập nhật công thức thành công')
        closeRecipe()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể cập nhật công thức')
})

const saveRecipe = () => {
    updateRecipeMutation.mutate({ productId: selectedProduct.value.id, items: recipeItems.value })
}
</script>

<style scoped>
.page-title { color: #A36B4A; }
.product-card { transition: transform .15s ease, box-shadow .15s ease; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.1) !important; }
.product-thumb img { object-fit: cover; }
</style>