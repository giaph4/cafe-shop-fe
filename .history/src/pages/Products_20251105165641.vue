<template>
    <div>
        <div data-aos="fade-up">
        <div class="page-header d-flex justify-content-between align-items-center mb-4">
            <h2 class="page-title">Quản lý Sản phẩm</h2>
            <div class="d-flex gap-2 flex-wrap" style="max-width: 1000px;">
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
                <select class="form-select" v-model="filterCategoryId">
                    <option :value="null">Tất cả danh mục</option>
                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <select class="form-select" v-model="filterStatus">
                    <option :value="null">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng bán</option>
                </select>
                <button class="btn btn-primary ms-auto" @click="openCreate">
                    <i class="bi bi-plus-lg me-1"></i> Thêm sản phẩm
                </button>
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
                                <div class="mt-auto d-flex flex-wrap gap-2 align-items-center">
                                    <button class="btn btn-sm btn-outline-secondary" @click="openRecipe(p)">
                                        <i class="bi bi-list-ul"></i> Công thức
                                    </button>
                                    <label class="btn btn-sm btn-outline-primary mb-0">
                                        <i class="bi bi-upload"></i> Ảnh
                                        <input type="file" class="d-none" accept="image/*" @change="onUploadImage($event, p)" />
                                    </label>
                                    <button class="btn btn-sm btn-outline-warning" @click="openEdit(p)">
                                        <i class="bi bi-pencil-square"></i> Sửa
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="openConfirm(p)">
                                        <i class="bi bi-trash"></i>
                                    </button>
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

        </div>

        <!-- Modal Chi tiết (đặt ngoài data-aos để tránh xung đột backdrop) -->
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

        <!-- Modal Công thức (đặt ngoài data-aos) -->
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
                            <div class="row g-2 align-items-end mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Thêm nguyên liệu</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                                        <input type="text" class="form-control" placeholder="Tìm nguyên liệu..." v-model="ingredientSearch">
                                        <button class="btn btn-outline-primary" @click="loadIngredients">Tìm</button>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Chọn nguyên liệu</label>
                                    <div class="d-flex gap-2">
                                        <select class="form-select" v-model="selectedIngredientId">
                                            <option :value="null">-- Chọn --</option>
                                            <option v-for="ing in ingredientOptions" :key="ing.id" :value="ing.id">{{ ing.name }} ({{ ing.unit }})</option>
                                        </select>
                                        <input type="number" class="form-control" style="max-width:120px" min="0" step="0.1" v-model.number="selectedIngredientQty" placeholder="SL" />
                                        <button class="btn btn-primary" @click="addIngredientToRecipe"><i class="bi bi-plus-lg"></i></button>
                                    </div>
                                </div>
                            </div>
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

        <!-- Modal Thêm/Sửa sản phẩm (đặt ngoài data-aos) -->
        <div class="modal fade" id="productFormModal" tabindex="-1" ref="formModalEl" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ formMode === 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm' }}</h5>
                        <button type="button" class="btn-close" @click="closeForm"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Tên sản phẩm</label>
                                <input type="text" class="form-control" v-model="formData.name" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Mã sản phẩm</label>
                                <input type="text" class="form-control" v-model="formData.code" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Giá</label>
                                <input type="number" min="0" class="form-control" v-model.number="formData.price" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Danh mục</label>
                                <select class="form-select" v-model="formData.categoryId">
                                    <option :value="null">-- Chọn danh mục --</option>
                                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-control" rows="3" v-model="formData.description"></textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Trạng thái</label>
                                <select class="form-select" v-model="formData.status">
                                    <option value="ACTIVE">Đang bán</option>
                                    <option value="INACTIVE">Ngừng bán</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="closeForm">Huỷ</button>
                        <button class="btn btn-primary" :disabled="saveProductMutation.isPending.value" @click="saveProduct">
                            <span v-if="saveProductMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Xác nhận xoá (đặt ngoài data-aos) -->
        <div class="modal fade" id="confirmDeleteModal" tabindex="-1" ref="confirmModalEl" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Xoá sản phẩm</h5>
                        <button type="button" class="btn-close" @click="closeConfirm"></button>
                    </div>
                    <div class="modal-body">
                        Bạn có chắc muốn xoá sản phẩm <strong>{{ selectedProduct?.name }}</strong>?
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="closeConfirm">Huỷ</button>
                        <button class="btn btn-danger" :disabled="deleteProductMutation.isPending.value" @click="confirmDelete">
                            <span v-if="deleteProductMutation.isPending.value" class="spinner-border spinner-border-sm me-2"></span>
                            Xoá
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
import { getProducts, getProductById, uploadProductImage, getProductRecipe, updateProductRecipe, createProduct, updateProduct, deleteProduct } from '@/api/productService'
import { getCategories } from '@/api/categoryService'

const queryClient = useQueryClient()

const currentPage = ref(1)
const sort = ref('createdAt,desc')
const keyword = ref('')
const filterCategoryId = ref(null)
const filterStatus = ref(null)
const categories = ref([])

onMounted(async () => {
    try {
        categories.value = await getCategories()
    } catch (e) {
        // ignore
    }
})

const { data: pageData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', currentPage, sort, keyword, filterCategoryId, filterStatus],
    queryFn: () => getProducts({ page: currentPage.value - 1, size: 12, sort: sort.value, keyword: keyword.value, categoryId: filterCategoryId.value, status: filterStatus.value }),
    keepPreviousData: true
})

watch([sort, keyword, filterCategoryId, filterStatus], () => {
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

// Tạo / Sửa sản phẩm
const formModalEl = ref(null)
const formBs = ref(null)
const formMode = ref('create') // 'create' | 'edit'
const formData = reactive({ id: null, name: '', code: '', price: null, categoryId: null, description: '', status: 'ACTIVE' })
onMounted(() => { if (formModalEl.value) formBs.value = new Modal(formModalEl.value) })
onUnmounted(() => formBs.value?.dispose())

const openCreate = () => {
    formMode.value = 'create'
    Object.assign(formData, { id: null, name: '', code: '', price: null, categoryId: null, description: '', status: 'ACTIVE' })
    formBs.value?.show()
}
const openEdit = async (p) => {
    formMode.value = 'edit'
    const detail = await getProductById(p.id)
    Object.assign(formData, { id: detail.id, name: detail.name, code: detail.code, price: detail.price, categoryId: detail.category?.id || null, description: detail.description || '', status: detail.status || 'ACTIVE' })
    formBs.value?.show()
}
const closeForm = () => formBs.value?.hide()

const saveProductMutation = useMutation({
    mutationFn: (payload) => payload.id ? updateProduct({ id: payload.id, data: payload }) : createProduct(payload),
    onSuccess: () => {
        toast.success('Lưu sản phẩm thành công')
        closeForm()
        queryClient.invalidateQueries(['products'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể lưu sản phẩm')
})
const saveProduct = () => {
    const payload = { id: formData.id, name: formData.name, code: formData.code, price: formData.price, description: formData.description, status: formData.status, categoryId: formData.categoryId }
    saveProductMutation.mutate(payload)
}

// Xoá sản phẩm
const confirmModalEl = ref(null)
const confirmBs = ref(null)
onMounted(() => { if (confirmModalEl.value) confirmBs.value = new Modal(confirmModalEl.value) })
onUnmounted(() => confirmBs.value?.dispose())
const openConfirm = (p) => { selectedProduct.value = p; confirmBs.value?.show() }
const closeConfirm = () => confirmBs.value?.hide()
const deleteProductMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
        toast.success('Đã xoá sản phẩm')
        queryClient.invalidateQueries(['products'])
        closeConfirm()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xoá sản phẩm')
})
const confirmDelete = () => deleteProductMutation.mutate(selectedProduct.value.id)
</script>

<style scoped>
.page-title { color: #A36B4A; }
.product-card { transition: transform .15s ease, box-shadow .15s ease; }
.product-card:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.1) !important; }
.product-thumb img { object-fit: cover; }
.btn-primary, .page-title { background-color: #A36B4A; border-color: #A36B4A; }
.btn-outline-primary { color: #A36B4A; border-color: #A36B4A; }
.btn-outline-primary:hover { background-color: #A36B4A; color: #fff; }
</style>