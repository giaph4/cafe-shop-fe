<template>
  <Teleport to="body">
    <div
      class="create-po-modal modal fade show"
      tabindex="-1"
      style="display: block;"
      @click.self="handleClose"
    >
      <div
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
      >
        <div
          class="modal-content"
          @click.stop
        >
          <div class="modal-header">
            <div class="modal-header__content">
              <h5 class="modal-title">
                Tạo Đơn đặt hàng từ Dự báo
              </h5>
              <p class="modal-subtitle mb-0">
                Tạo đơn đặt hàng dựa trên dự báo nhu cầu
              </p>
            </div>
            <button
              type="button"
              class="btn-close"
              aria-label="Đóng"
              @click="handleClose"
            />
          </div>
          <div class="modal-body">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2" />
              Tính năng này sẽ được tích hợp với hệ thống đơn đặt hàng trong tương lai.
            </div>
            <div class="table-responsive">
              <table class="table table-minimal">
                <thead>
                  <tr>
                    <th>Nguyên liệu</th>
                    <th>Đơn vị</th>
                    <th>Đề xuất số lượng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="ingredient in ingredients"
                    :key="ingredient.ingredientId"
                  >
                    <td>
                      <div class="fw-semibold">
                        {{ ingredient.name }}
                      </div>
                      <small class="text-muted">Dự báo 30 ngày: {{ formatNumber(ingredient.forecast30d, 2) }}</small>
                    </td>
                    <td>{{ ingredient.unit }}</td>
                    <td>
                      <input
                        v-model.number="orderQuantities[ingredient.ingredientId]"
                        type="number"
                        class="form-control form-control-sm clean-input"
                        min="0"
                        style="width: 120px;"
                      >
                    </td>
                    <td>
                      <button
                        class="btn btn-flat btn-flat--outline btn-sm"
                        @click="removeIngredient(ingredient.ingredientId)"
                      >
                        <i class="bi bi-x" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-flat btn-flat--outline"
              @click="handleClose"
            >
              Hủy
            </button>
            <button
              type="button"
              class="btn btn-flat btn-flat--primary"
              :disabled="creating || ingredients.length === 0"
              @click="handleCreate"
            >
              <span
                v-if="creating"
                class="spinner-border spinner-border-sm me-2"
              />
              <i
                v-else
                class="bi bi-check me-2"
              />
              Tạo đơn đặt hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatNumber } from '@/utils/formatters'

const props = defineProps({
    ingredients: {
        type: Array,
        required: true,
        default: () => []
    }
})

const emit = defineEmits(['close'])

const creating = ref(false)
const orderQuantities = ref({})

const removeIngredient = (ingredientId) => {
    const index = props.ingredients.findIndex(i => i.ingredientId === ingredientId)
    if (index > -1) {
        delete orderQuantities.value[ingredientId]
    }
}

const handleClose = () => {
    emit('close')
}

const handleCreate = async () => {
    creating.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Đơn đặt hàng đã được tạo thành công! (Tính năng demo)')
        handleClose()
    } catch (err) {
        console.error('Failed to create PO', err)
        alert('Không thể tạo đơn đặt hàng. Vui lòng thử lại.')
    } finally {
        creating.value = false
    }
}

onMounted(() => {
    props.ingredients.forEach(ing => {
        orderQuantities.value[ing.ingredientId] = ing.suggestedOrder
    })
})
</script>

<style scoped>
.create-po-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
    margin-bottom: var(--spacing-4);
}

.alert-info {
    background: var(--color-soft-sky);
    border-color: var(--color-info);
    color: var(--color-text);
}
</style>

