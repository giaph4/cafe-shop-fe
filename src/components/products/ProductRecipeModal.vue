<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-list-check me-2"></i>
                            Quản lý công thức: {{ product?.name || '—' }}
                        </h5>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>
                    <div class="modal-body">
                        <div v-if="loading" class="text-center py-5">
                            <div class="spinner-border text-primary"></div>
                        </div>
                        <div v-else-if="error" class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            {{ error }}
                        </div>
                        <div v-else>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <p class="mb-0 text-muted">
                                    Thêm nguyên liệu và số lượng cần thiết để tạo công thức cho sản phẩm này.
                                </p>
                                <button class="btn btn-sm btn-primary" type="button" @click="addIngredientRow" :disabled="submitting">
                                    <i class="bi bi-plus-lg me-1"></i>
                                    Thêm nguyên liệu
                                </button>
                            </div>

                            <div v-if="recipeItems.length === 0" class="text-center py-5 text-muted">
                                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p class="mb-0">Chưa có nguyên liệu nào trong công thức.</p>
                                <p class="mb-0 small">Nhấn "Thêm nguyên liệu" để bắt đầu.</p>
                            </div>

                            <div v-else class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th width="40%">Nguyên liệu</th>
                                            <th width="30%">Số lượng cần</th>
                                            <th width="20%">Đơn vị</th>
                                            <th width="10%" class="text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, index) in recipeItems" :key="index">
                                            <td>
                                                <select 
                                                    class="form-select form-select-sm" 
                                                    v-model="item.ingredientId"
                                                    :class="{'is-invalid': item.errors?.ingredientId}"
                                                    :disabled="submitting"
                                                >
                                                    <option value="">Chọn nguyên liệu</option>
                                                    <option 
                                                        v-for="ingredient in availableIngredients" 
                                                        :key="ingredient.id" 
                                                        :value="ingredient.id"
                                                        :disabled="isIngredientUsed(ingredient.id, index)"
                                                    >
                                                        {{ ingredient.name }}
                                                    </option>
                                                </select>
                                                <div class="invalid-feedback" v-if="item.errors?.ingredientId">
                                                    {{ item.errors.ingredientId }}
                                                </div>
                                            </td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    min="0.01"
                                                    class="form-control form-control-sm" 
                                                    v-model.number="item.quantityNeeded"
                                                    :class="{'is-invalid': item.errors?.quantityNeeded}"
                                                    :disabled="submitting"
                                                    placeholder="0.00"
                                                />
                                                <div class="invalid-feedback" v-if="item.errors?.quantityNeeded">
                                                    {{ item.errors.quantityNeeded }}
                                                </div>
                                            </td>
                                            <td>
                                                <span class="badge bg-secondary">
                                                    {{ getIngredientUnit(item.ingredientId) || '—' }}
                                                </span>
                                            </td>
                                            <td class="text-center">
                                                <button 
                                                    class="btn btn-sm btn-outline-danger" 
                                                    type="button"
                                                    @click="removeIngredientRow(index)"
                                                    :disabled="submitting"
                                                >
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide" :disabled="submitting">
                            Hủy
                        </button>
                        <button 
                            type="button" 
                            class="btn btn-primary" 
                            @click="handleSave"
                            :disabled="submitting || loading || recipeItems.length === 0"
                        >
                            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-check-lg me-1"></i>
                            Lưu công thức
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { getProductRecipe, updateProductRecipe } from '@/api/productService'
import { getIngredients } from '@/api/ingredientService'
import logger from '@/utils/logger'

const props = defineProps({
    product: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['saved'])

const modalRef = ref(null)
let modalInstance = null

const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const ingredients = ref([])
const recipeItems = reactive([])

const availableIngredients = computed(() => ingredients.value)

const getIngredientUnit = (ingredientId) => {
    const ingredient = ingredients.value.find(ing => ing.id === ingredientId)
    return ingredient?.unit || ''
}

const isIngredientUsed = (ingredientId, currentIndex) => {
    if (!ingredientId) return false
    return recipeItems.some((item, index) => 
        index !== currentIndex && item.ingredientId === ingredientId
    )
}

const addIngredientRow = () => {
    recipeItems.push({
        ingredientId: null,
        quantityNeeded: null,
        errors: {}
    })
}

const removeIngredientRow = (index) => {
    recipeItems.splice(index, 1)
}

const validateRecipe = () => {
    let valid = true
    const usedIngredientIds = new Set()
    
    recipeItems.forEach((item, index) => {
        item.errors = {}
        
        // Validate ingredient selection
        if (!item.ingredientId) {
            item.errors.ingredientId = 'Vui lòng chọn nguyên liệu.'
            valid = false
        } else if (usedIngredientIds.has(item.ingredientId)) {
            item.errors.ingredientId = 'Nguyên liệu này đã được thêm vào công thức.'
            valid = false
        } else {
            usedIngredientIds.add(item.ingredientId)
        }
        
        // Validate quantity
        const quantity = Number(item.quantityNeeded)
        if (!item.quantityNeeded || isNaN(quantity) || quantity <= 0) {
            item.errors.quantityNeeded = 'Số lượng phải lớn hơn 0.'
            valid = false
        } else if (quantity > 1000000) {
            // Giới hạn số lượng hợp lý (tránh nhập sai)
            item.errors.quantityNeeded = 'Số lượng quá lớn. Vui lòng kiểm tra lại.'
            valid = false
        }
        
        // Validate unit consistency (nếu có yêu cầu)
        // Có thể thêm logic check unit consistency ở đây nếu cần
        // Ví dụ: tất cả ingredients phải cùng unit, hoặc convert unit
    })
    
    // Validate tổng số lượng (nếu cần)
    // Có thể thêm validation tổng quantity không vượt quá một giá trị nào đó
    const totalQuantity = recipeItems.reduce((sum, item) => {
        const qty = Number(item.quantityNeeded) || 0
        return sum + qty
    }, 0)
    
    if (totalQuantity <= 0 && recipeItems.length > 0) {
        // Nếu có items nhưng tổng quantity = 0, có lỗi
        valid = false
    }
    
    return valid
}

const loadIngredients = async () => {
    try {
        const data = await getIngredients({ page: 0, size: 1000 })
        ingredients.value = data?.content || []
    } catch (err) {
        logger.error('Failed to load ingredients:', err)
        toast.error('Không thể tải danh sách nguyên liệu.')
    }
}

const loadRecipe = async () => {
    if (!props.product?.id) return
    
    loading.value = true
    error.value = ''
    
    try {
        const recipe = await getProductRecipe(props.product.id)
        recipeItems.splice(0, recipeItems.length)
        
        if (recipe && recipe.length > 0) {
            recipe.forEach(item => {
                recipeItems.push({
                    id: item.id,
                    ingredientId: item.ingredientId,
                    quantityNeeded: Number(item.quantityNeeded),
                    errors: {}
                })
            })
        }
    } catch (err) {
        logger.error('Failed to load recipe:', err)
        error.value = err.response?.data?.message || 'Không thể tải công thức sản phẩm.'
        recipeItems.splice(0, recipeItems.length)
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    if (!validateRecipe()) {
        toast.error('Vui lòng kiểm tra lại thông tin công thức.')
        return
    }
    
    submitting.value = true
    
    try {
        const payload = {
            ingredients: recipeItems.map(item => ({
                ingredientId: item.ingredientId,
                quantityNeeded: Number(item.quantityNeeded)
            }))
        }
        
        await updateProductRecipe(props.product.id, payload)
        toast.success('Đã lưu công thức sản phẩm thành công!')
        emit('saved')
        hide()
    } catch (err) {
        logger.error('Failed to save recipe:', err)
        toast.error(err.response?.data?.message || 'Không thể lưu công thức sản phẩm.')
    } finally {
        submitting.value = false
    }
}

const show = async () => {
    if (!props.product?.id) {
        toast.warning('Vui lòng chọn sản phẩm.')
        return
    }
    
    await Promise.all([loadIngredients(), loadRecipe()])
    modalInstance?.show()
}

const hide = () => {
    modalInstance?.hide()
    recipeItems.splice(0, recipeItems.length)
    error.value = ''
}

watch(() => props.product, (newProduct) => {
    if (newProduct?.id && modalInstance?._isShown) {
        loadRecipe()
    }
}, { deep: true })

defineExpose({
    show,
    hide
})

onMounted(() => {
    modalInstance = new Modal(modalRef.value, { backdrop: 'static' })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
    modalInstance = null
})
</script>

<style scoped>
.modal-content {
    border-radius: 18px;
}

.modal-header {
    border-bottom: 1px solid var(--color-border);
    padding: 1.25rem 1.5rem;
}

.modal-body {
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    border-top: 1px solid var(--color-border);
    padding: 1.25rem 1.5rem;
}

.table th {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.table td {
    vertical-align: middle;
}
</style>

