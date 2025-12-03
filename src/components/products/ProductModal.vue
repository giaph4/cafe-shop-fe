<template>
    <Teleport to="body">
        <div class="modal fade product-modal" ref="modal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <form @submit.prevent="handleFormSubmit">
                        <div class="modal-body modal-body-scroll">
                            <div class="modal-tabs">
                                <button type="button" :class="['tab-btn', { active: activeTab === 'info' }]"
                                        @click="setTab('info')">
                                    <i class="bi bi-info-circle me-2"></i>Thông tin
                                </button>
                                <button
                                    type="button"
                                    :class="['tab-btn', { active: activeTab === 'recipe' }]"
                                    :disabled="!isEditMode"
                                    title="Lưu sản phẩm trước để quản lý công thức"
                                    @click="setTab('recipe')"
                                >
                                    <i class="bi bi-diagram-3 me-2"></i>Công thức
                                </button>
                            </div>

                            <div v-if="activeTab === 'info'" class="tab-panel">
                                <div class="row g-4">
                                    <div class="col-lg-8 col-md-7">
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <label class="form-label">Tên sản phẩm<span class="text-danger">*</span></label>
                                                <input
                                                    v-model.trim="form.name"
                                                    type="text"
                                                    class="form-control"
                                                    required
                                                    maxlength="120"
                                                />
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Mã sản phẩm<span class="text-danger">*</span></label>
                                                <input
                                                    v-model.trim="form.code"
                                                    type="text"
                                                    class="form-control"
                                                    required
                                                    maxlength="60"
                                                />
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Danh mục<span
                                                    class="text-danger">*</span></label>
                                                <select v-model="form.categoryId" class="form-select" required>
                                                    <option disabled value="">Chọn danh mục</option>
                                                    <option
                                                        v-for="category in categories"
                                                        :key="category.id"
                                                        :value="category.id"
                                                    >
                                                        {{ category.name }}
                                                    </option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Giá bán (VNĐ)<span
                                                    class="text-danger">*</span></label>
                                                <input
                                                    v-model.number="form.price"
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    class="form-control"
                                                    required
                                                />
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Giá vốn (VNĐ)</label>
                                                <input
                                                    v-model.number="form.cost"
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    class="form-control"
                                                />
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Mô tả</label>
                                                <textarea
                                                    v-model.trim="form.description"
                                                    class="form-control"
                                                    rows="3"
                                                    maxlength="500"
                                                    placeholder="Mô tả ngắn về sản phẩm"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-lg-4 col-md-5">
                                        <label class="form-label">Ảnh sản phẩm</label>
                                        <div class="image-uploader">
                                            <img :src="previewImage" alt="Product preview"/>
                                            <label class="upload-btn">
                                                <input type="file" accept="image/*" @change="handleImageSelect"/>
                                                <span><i class="bi bi-cloud-arrow-up me-2"></i>Tải ảnh</span>
                                            </label>
                                            <button
                                                v-if="imageFile || form.imageUrl"
                                                type="button"
                                                class="btn btn-sm btn-outline-danger"
                                                :disabled="removingImage"
                                                @click="clearImage"
                                            >
                                                {{ removingImage ? 'Đang xóa...' : 'Xóa ảnh hiện tại' }}
                                            </button>
                                        </div>
                                        <p class="text-muted small mt-2">Định dạng hỗ trợ: JPG, PNG. Kích thước &lt;
                                            2MB.</p>
                                    </div>
                                </div>

                                <div
                                    v-if="form.createdAt"
                                    class="product-meta-info mt-4 mb-0"
                                >
                                    <span><i class="bi bi-clock-history me-2"></i>Đã tạo: {{
                                            formatDate(form.createdAt)
                                        }}</span>
                                    <span class="product-meta-badge"
                                          :class="form.available ? 'product-meta-badge--active' : 'product-meta-badge--inactive'">
                                    {{ form.available ? 'Đang kinh doanh' : 'Ngừng bán' }}
                                </span>
                                </div>
                            </div>

                            <div v-else class="tab-panel">
                                <ProductRecipeManager v-if="isEditMode" :product-id="props.product?.id"/>
                                <EmptyState
                                    v-else
                                    title="Chưa thể thiết lập công thức"
                                    message="Vui lòng lưu sản phẩm trước, sau đó bạn có thể thêm nguyên liệu và định lượng."
                                />
                            </div>
                        </div>

                        <div v-if="activeTab === 'info'" class="modal-footer dual-buttons">
                            <button type="button" class="btn btn-outline-secondary" @click="hide">Hủy</button>
                            <button type="submit" class="btn btn-primary" :disabled="saving">
                                {{ saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo mới' }}
                            </button>
                        </div>

                        <div v-else class="modal-footer dual-buttons">
                            <button type="button" class="btn btn-outline-secondary" @click="setTab('info')">
                                Quay lại thông tin
                            </button>
                            <button type="button" class="btn btn-primary" @click="hide">Đóng</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {computed, onMounted, onBeforeUnmount, ref, watch} from 'vue'
import {Modal} from 'bootstrap'
import {toast} from 'vue3-toastify'
import {
    createProduct,
    createProductWithImage,
    updateProduct,
    updateProductWithImage,
    deleteProductImage
} from '@/api/productService'
import {formatDateTime} from '@/utils/formatters'
import ProductRecipeManager from '@/components/products/ProductRecipeManager.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    product: {type: Object, default: null},
    categories: {type: Array, default: () => []}
})

const emit = defineEmits(['saved'])

const modal = ref(null)
let modalInstance = null

const defaultForm = () => ({
    name: '',
    code: '',
    price: null,
    cost: null,
    description: '',
    categoryId: '',
    imageUrl: null,
    createdAt: null,
    available: true
})

const form = ref(defaultForm())
const imageFile = ref(null)
const previewImage = ref('/placeholder.png')
const generatedPreviewUrl = ref(null)
const activeTab = ref('info')
const saving = ref(false)
const removingImage = ref(false)

const isEditMode = computed(() => Boolean(props.product?.id))

watch(
    () => props.product,
    (product) => {
        if (product) {
            form.value = {
                ...defaultForm(),
                ...product,
                categoryId: product.categoryId ?? product.category?.id ?? product.categoryId,
                createdAt: product.createdAt ?? null
            }
            previewImage.value = product.imageUrl || '/placeholder.png'
        } else {
            form.value = defaultForm()
            previewImage.value = '/placeholder.png'
        }
        imageFile.value = null
        if (generatedPreviewUrl.value) {
            URL.revokeObjectURL(generatedPreviewUrl.value)
            generatedPreviewUrl.value = null
        }
        activeTab.value = 'info'
    },
    {immediate: true}
)

watch(isEditMode, (value) => {
    if (!value && activeTab.value === 'recipe') {
        activeTab.value = 'info'
    }
})

const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn đúng định dạng ảnh')
        return
    }
    if (file.size > 2 * 1024 * 1024) {
        toast.error('Ảnh vượt quá kích thước 2MB')
        return
    }

    imageFile.value = file
    if (generatedPreviewUrl.value) {
        URL.revokeObjectURL(generatedPreviewUrl.value)
    }
    generatedPreviewUrl.value = URL.createObjectURL(file)
    previewImage.value = generatedPreviewUrl.value
}

const clearImage = async () => {
    if (removingImage.value) return

    if (isEditMode.value && form.value.imageUrl) {
        try {
            removingImage.value = true
            await deleteProductImage(props.product.id)
            form.value.imageUrl = null
            toast.success('Đã xóa ảnh sản phẩm')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể xóa ảnh. Vui lòng thử lại.')
            return
        } finally {
            removingImage.value = false
        }
    }
    imageFile.value = null
    if (generatedPreviewUrl.value) {
        URL.revokeObjectURL(generatedPreviewUrl.value)
        generatedPreviewUrl.value = null
    }
    previewImage.value = '/placeholder.png'
}

const buildPayload = () => ({
    name: form.value.name?.trim(),
    code: form.value.code?.trim(),
    price: Number(form.value.price) || 0,
    cost:
        form.value.cost !== null && form.value.cost !== undefined && form.value.cost !== ''
            ? Number(form.value.cost)
            : null,
    description: form.value.description?.trim() || null,
    categoryId: form.value.categoryId
})

const handleSubmit = async () => {
    if (saving.value) return
    const payload = buildPayload()
    if (!payload.name || !payload.code || !payload.categoryId || payload.price <= 0) {
        toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc và giá bán hợp lệ.')
        return
    }

    try {
        saving.value = true
        const action = isEditMode.value ? 'update' : 'create'
        if (isEditMode.value) {
            if (imageFile.value) {
                await updateProductWithImage(props.product.id, payload, imageFile.value)
            } else {
                await updateProduct(props.product.id, payload)
            }
        } else {
            if (imageFile.value) {
                await createProductWithImage(payload, imageFile.value)
            } else {
                await createProduct(payload)
            }
        }
        toast.success(isEditMode.value ? 'Cập nhật sản phẩm thành công' : 'Tạo sản phẩm thành công')
        emit('saved', action)
        hide()
    } catch (error) {
        const message = error.response?.data?.message || 'Không thể lưu sản phẩm. Vui lòng thử lại.'
        toast.error(message)
    } finally {
        saving.value = false
    }
}

const handleFormSubmit = () => {
    if (activeTab.value === 'info') {
        handleSubmit()
    }
}

const setTab = (tab) => {
    if (tab === 'recipe' && !isEditMode.value) return
    activeTab.value = tab
}

const show = () => modalInstance?.show()
const hide = () => modalInstance?.hide()

onMounted(() => {
    modalInstance = new Modal(modal.value, {backdrop: 'static'})
})

onBeforeUnmount(() => {
    if (generatedPreviewUrl.value) {
        URL.revokeObjectURL(generatedPreviewUrl.value)
    }
})

const formatDate = (date) => (date ? formatDateTime(date) : '')

defineExpose({show, hide, setTab})
</script>

<style scoped>
/* Modal - Chuẩn hóa theo base.css */
.product-modal :global(.modal-content) {
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    box-shadow: var(--shadow-modal);
}

.product-modal :global(.modal-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
}

.product-modal :global(.modal-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
}

.product-modal :global(.modal-body) {
    padding: var(--spacing-4);
    background: var(--color-bg);
}

.product-modal :global(.modal-footer) {
    padding: var(--spacing-4);
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
}

.product-modal :global(.modal-footer .btn) {
    padding: 8px 16px;
    border-radius: var(--radius-base);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
}

.product-modal :global(.modal-footer .btn:hover:not(:disabled)) {
    filter: brightness(1.05);
}

.product-modal :global(.modal-footer .btn:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Form Controls - Chuẩn hóa */
.product-modal :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    margin-bottom: var(--spacing-2);
}

.product-modal :global(.form-control),
.product-modal :global(.form-select) {
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-bg);
    color: var(--color-text);
    transition: all var(--transition-base);
}

.product-modal :global(.form-control:focus),
.product-modal :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
}

.product-modal :global(textarea.form-control) {
    height: auto;
    min-height: 80px;
    resize: vertical;
}

/* Tabs - Chuẩn hóa */
.modal-tabs {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-4);
}

.tab-btn {
    flex: 1;
    border: 1px solid var(--color-border);
    background: var(--color-bg-muted);
    color: var(--color-text);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-base);
    padding: var(--spacing-2) var(--spacing-4);
    transition: all var(--transition-base);
    font-size: var(--font-size-base);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.tab-btn i {
    font-size: 18px;
    line-height: 1;
}

.tab-btn:hover:not(.active):not(:disabled) {
    background: var(--color-bg);
    color: var(--color-text);
}

.tab-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
}

.tab-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.tab-panel {
    animation: fadeIn 0.25s ease;
}

.modal-body-scroll {
    max-height: 70vh;
    overflow: auto;
    padding-right: var(--spacing-4);
}

/* Image Uploader - Chuẩn hóa */
.image-uploader {
    background: var(--color-bg-muted);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-base);
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: center;
}

.image-uploader img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--radius-base);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
}

.upload-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 6px;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-base);
    background: var(--color-bg);
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
}

.upload-btn:hover {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary);
}

.upload-btn i {
    font-size: 18px;
    line-height: 1;
}

.upload-btn input {
    display: none;
}

.upload-btn + .btn {
    margin-top: var(--spacing-2);
}

/* Product Meta Info - Chuẩn hóa */
.product-meta-info {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-base);
    border: 1px solid var(--color-border);
    background: var(--color-bg-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-3);
    font-size: var(--font-size-base);
    color: var(--color-text);
}

.product-meta-info i {
    font-size: 18px;
    line-height: 1;
}

.product-meta-badge {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-base);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
}

.product-meta-badge--active {
    background: var(--color-bg-muted);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.product-meta-badge--inactive {
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

/* Dual Buttons - Chuẩn hóa */
.dual-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-2);
}

.dual-buttons .btn {
    width: 100%;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .modal-tabs {
        flex-direction: column;
    }

    .tab-btn {
        width: 100%;
    }

    .product-meta-info {
        flex-direction: column;
        align-items: flex-start;
    }
}

</style>
