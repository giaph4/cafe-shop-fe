<template>
  <div class="recipe-manager">
    <div class="recipe-header">
      <div>
        <h5>Danh sách nguyên liệu</h5>
        <p>Điều chỉnh định lượng cho từng nguyên liệu trong công thức.</p>
      </div>
      <button
        class="btn btn-outline-primary btn-sm"
        type="button"
        :disabled="loading"
        @click="refresh"
      >
        <span
          v-if="loading"
          class="spinner-border spinner-border-sm me-2"
        />
        <i
          v-else
          class="bi bi-arrow-repeat me-2"
        />
        Tải lại
      </button>
    </div>

    <div
      v-if="loading"
      class="state-block"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />
    </div>
    <div
      v-else-if="error"
      class="alert alert-warning recipe-error-alert d-flex align-items-center gap-2"
    >
      <i class="bi bi-exclamation-triangle" />
      <span>{{ error }}</span>
    </div>
    <EmptyState
      v-else-if="!recipe.value.length"
      title="Chưa có công thức"
      message="Thêm nguyên liệu đầu tiên để bắt đầu xây dựng công thức cho sản phẩm."
    />
    <div
      v-else
      class="table-responsive recipe-table"
    >
      <table class="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>Nguyên liệu</th>
            <th style="width: 140px;">
              Đơn vị
            </th>
            <th
              style="width: 180px;"
              class="text-end"
            >
              Định lượng
            </th>
            <th
              style="width: 160px;"
              class="text-end"
            >
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in recipe.value"
            :key="item.id || item.ingredientId"
          >
            <td>
              <div class="fw-semibold">
                {{ item.ingredientName }}
              </div>
              <div class="text-muted small">
                Mã: {{ item.ingredientCode ?? '—' }}
              </div>
            </td>
            <td>{{ item.ingredientUnit || '—' }}</td>
            <td>
              <div class="input-group input-group-sm justify-content-end">
                <input
                  v-model="quantityDrafts[item.id || item.ingredientId]"
                  type="number"
                  class="form-control text-end"
                  min="0.001"
                  step="0.001"
                  :disabled="isRowSaving(item)"
                  @keydown.enter.prevent="() => updateQuantity(item)"
                >
              </div>
            </td>
            <td>
              <div class="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="isRowSaving(item)"
                  @click="() => updateQuantity(item)"
                >
                  <span
                    v-if="isRowSaving(item) && rowSavingKey === getItemKey(item)"
                    class="spinner-border spinner-border-sm"
                  />
                  <span v-else><i class="bi bi-save me-1" />Lưu</span>
                </button>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  :disabled="isRowSaving(item)"
                  @click="() => removeIngredient(item)"
                >
                  <span
                    v-if="isRowSaving(item) && removalKey === getItemKey(item)"
                    class="spinner-border spinner-border-sm"
                  />
                  <span v-else><i class="bi bi-trash me-1" />Xóa</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="add-section">
      <h6 class="mb-3">
        Thêm nguyên liệu mới
      </h6>
      <div class="row g-2 align-items-end">
        <div class="col-md-6">
          <label class="form-label"><span class="text-danger">*</span> Nguyên liệu</label>
          <select
            v-model="newIngredientId"
            class="form-select"
            :disabled="saving"
          >
            <option :value="null">
              Chọn nguyên liệu
            </option>
            <option
              v-for="ingredient in availableIngredients"
              :key="ingredient.id"
              :value="ingredient.id"
            >
              {{ ingredient.name }} ({{ ingredient.unit }})
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label"><span class="text-danger">*</span> Định lượng</label>
          <div class="input-group">
            <input
              v-model="newQuantity"
              type="number"
              class="form-control"
              min="0.001"
              step="0.001"
              placeholder="0"
              :disabled="saving"
            >
            <span class="input-group-text">{{ selectedIngredientUnit }}</span>
          </div>
        </div>
        <div class="col-md-2 d-grid">
          <button
            class="btn btn-primary"
            type="button"
            :disabled="saving"
            @click="addIngredient"
          >
            <span
              v-if="saving"
              class="spinner-border spinner-border-sm"
            />
            <span v-else><i class="bi bi-plus-lg me-1" />Thêm</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import EmptyState from '@/components/common/EmptyState.vue'
import { getProductRecipe, updateProductRecipe } from '@/api/productService.js'
import { getAllIngredients } from '@/api/ingredientService.js'
import logger from '@/utils/logger'

const props = defineProps({
    productId: {
        type: Number,
        required: true
    }
})

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const recipe = reactive({ value: [] })
const ingredientOptions = ref([])
const quantityDrafts = reactive({})
const newIngredientId = ref(null)
const newQuantity = ref('')
const rowSavingKey = ref(null)
const removalKey = ref(null)

const getItemKey = (item) => item.id ?? item.ingredientId

const syncDrafts = () => {
    Object.keys(quantityDrafts).forEach((key) => delete quantityDrafts[key])
    recipe.value.forEach((item) => {
        quantityDrafts[getItemKey(item)] = Number(item.quantityNeeded).toString()
    })
}

const fetchRecipe = async () => {
    if (!props.productId) return
    try {
        loading.value = true
        error.value = null
        const data = await getProductRecipe(props.productId)
        recipe.value = Array.isArray(data) ? data : data?.data || []
        syncDrafts()
    } catch (err) {
        logger.error('Failed to load product recipe:', err)
        error.value = err.response?.data?.message || 'Không thể tải công thức sản phẩm.'
        recipe.value = []
        syncDrafts()
    } finally {
        loading.value = false
    }
}

const fetchIngredients = async () => {
    try {
        const data = await getAllIngredients()
        ingredientOptions.value = Array.isArray(data) ? data : []
    } catch (err) {
        logger.error('Failed to load ingredients:', err)
        toast.error('Không thể tải danh sách nguyên liệu. Vui lòng thử lại.')
        ingredientOptions.value = []
    }
}

const refresh = async () => {
    await Promise.all([fetchRecipe(), fetchIngredients()])
}

watch(
    () => props.productId,
    (id) => {
        if (id) {
            refresh()
        }
    },
    { immediate: true }
)

const availableIngredients = computed(() => {
    const existingIds = new Set(recipe.value.map((item) => item.ingredientId))
    return ingredientOptions.value.filter((ingredient) => !existingIds.has(ingredient.id))
})

const selectedIngredientUnit = computed(() => {
    const ingredient = ingredientOptions.value.find((item) => item.id === newIngredientId.value)
    return ingredient?.unit || ''
})

const sanitizeQuantity = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return null
    }
    return Number(numeric.toFixed(3))
}

const buildPayload = (items) =>
    items.map((item) => ({
        ingredientId: item.ingredientId,
        quantityNeeded: sanitizeQuantity(item.quantityNeeded)
    }))

const validatePayload = (payload) => payload.every((item) => item.ingredientId && item.quantityNeeded)

const commitRecipe = async (items, { successMessage, spinnerKey } = {}) => {
    if (!items.length) {
        toast.warning('Công thức phải có ít nhất một nguyên liệu.')
        return false
    }
    const payload = buildPayload(items)
    if (!validatePayload(payload)) {
        toast.warning('Vui lòng kiểm tra lại định lượng nguyên liệu.')
        return false
    }

    try {
        saving.value = true
        if (spinnerKey) {
            rowSavingKey.value = spinnerKey
        }
        const data = await updateProductRecipe(props.productId, payload)
        recipe.value = Array.isArray(data) ? data : data?.data || []
        syncDrafts()
        if (successMessage) {
            toast.success(successMessage)
        }
        return true
    } catch (err) {
        logger.error('Failed to update recipe:', err)
        toast.error(err.response?.data?.message || 'Không thể cập nhật công thức. Vui lòng thử lại.')
        return false
    } finally {
        saving.value = false
        rowSavingKey.value = null
        removalKey.value = null
    }
}

const addIngredient = async () => {
    const ingredientId = Number(newIngredientId.value)
    const quantity = sanitizeQuantity(newQuantity.value)

    if (!ingredientId) {
        toast.warning('Vui lòng chọn nguyên liệu.')
        return
    }
    if (!quantity) {
        toast.warning('Định lượng phải lớn hơn 0.')
        return
    }
    if (recipe.value.some((item) => item.ingredientId === ingredientId)) {
        toast.warning('Nguyên liệu đã tồn tại trong công thức.')
        return
    }

    const updatedItems = [
        ...recipe.value.map((item) => ({ ...item })),
        { ingredientId, quantityNeeded: quantity }
    ]
    const success = await commitRecipe(updatedItems, {
        successMessage: 'Đã thêm nguyên liệu vào công thức.'
    })

    if (success) {
        newIngredientId.value = null
        newQuantity.value = ''
    }
}

const isRowSaving = (item) => saving.value && rowSavingKey.value === getItemKey(item)

const updateQuantity = async (item) => {
    const key = getItemKey(item)
    const draft = quantityDrafts[key]
    const quantity = sanitizeQuantity(draft)
    if (!quantity) {
        toast.warning('Định lượng phải lớn hơn 0.')
        quantityDrafts[key] = Number(item.quantityNeeded).toString()
        return
    }

    const updatedItems = recipe.value.map((entry) =>
        entry.ingredientId === item.ingredientId
            ? { ...entry, quantityNeeded: quantity }
            : { ...entry }
    )

    await commitRecipe(updatedItems, {
        successMessage: 'Đã cập nhật định lượng nguyên liệu.',
        spinnerKey: key
    })
}

const removeIngredient = async (item) => {
    if (recipe.value.length === 1) {
        toast.warning('Công thức phải có ít nhất một nguyên liệu.')
        return
    }

    if (!item?.ingredientName) return

    const confirmed = window.confirm(`Bạn chắc chắn muốn xóa "${item.ingredientName}" khỏi công thức?\n\nHành động này không thể hoàn tác.`)
    if (!confirmed) return

    const updatedItems = recipe.value
        .filter((entry) => entry.ingredientId !== item.ingredientId)
        .map((entry) => ({ ...entry }))

    removalKey.value = getItemKey(item)
    await commitRecipe(updatedItems, {
        successMessage: 'Đã xóa nguyên liệu khỏi công thức.',
        spinnerKey: removalKey.value
    })
}
</script>

<style scoped>
.recipe-manager {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.recipe-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-4);
}

.recipe-header h5 {
    margin-bottom: var(--spacing-1);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.recipe-header p {
    margin-bottom: 0;
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.recipe-header .btn {
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.recipe-header .btn-outline-primary {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.recipe-header .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.state-block {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.recipe-table .table {
    margin-bottom: 0;
}

.recipe-table :global(.table thead) {
    background: var(--color-card-muted);
}

.recipe-table :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.table tbody td),
.recipe-table :global(.table tbody th) {
    padding: var(--spacing-3);
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.table tbody tr:last-child td),
.recipe-table :global(.table tbody tr:last-child th) {
    border-bottom: none;
}

.recipe-table :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.recipe-table :global(.fw-semibold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.text-muted) {
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.recipe-table :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.recipe-table :global(.btn-outline-primary) {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.recipe-table :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.recipe-table :global(.btn-outline-danger) {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: transparent;
}

.recipe-table :global(.btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.recipe-error-alert {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-warning-soft, #fff3cd);
    color: var(--color-warning-dark, #856404);
    padding: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.add-section {
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-4);
}

.add-section h6 {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    margin-bottom: var(--spacing-3);
    font-family: var(--font-family-sans);
}

.add-section :global(.form-label) {
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.add-section :global(.form-select),
.add-section :global(.form-control) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.add-section :global(.form-select:focus),
.add-section :global(.form-control:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.add-section :global(.input-group-text) {
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.add-section :global(.input-group .form-control) {
    border-right: none;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.add-section :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.add-section :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

@media (max-width: 768px) {
    .recipe-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
