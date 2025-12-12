<template>
  <div class="component-styling">
    <div class="component-styling__header">
      <h3 class="component-styling__title">
        <i class="bi bi-paint-bucket" />
        Phong Cách Component
      </h3>
      <p class="component-styling__description">
        Tùy chỉnh phong cách của các component: button, table, card, input.
      </p>
    </div>

    <div class="component-styling__content">
      <!-- Button Style -->
      <div class="component-styling__section">
        <div class="component-styling__section-header">
          <label class="component-styling__label">
            <i class="bi bi-cursor" />
            Phong cách Button
          </label>
          <p class="component-styling__hint">
            Chọn kiểu hiển thị của các nút bấm
          </p>
        </div>
        <div class="component-styling__preview">
          <div class="component-styling__preview-item">
            <button
              v-for="option in buttonStyleOptions"
              :key="option.value"
              class="component-styling__preview-btn"
              :class="[
                `component-styling__preview-btn--${option.value}`,
                { 'component-styling__preview-btn--active': styles.buttonStyle === option.value }
              ]"
              @click="updateStyle('buttonStyle', option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="component-styling__options">
          <button
            v-for="option in buttonStyleOptions"
            :key="option.value"
            class="component-styling__option"
            :class="{ 'component-styling__option--active': styles.buttonStyle === option.value }"
            @click="updateStyle('buttonStyle', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Table Style -->
      <div class="component-styling__section">
        <div class="component-styling__section-header">
          <label class="component-styling__label">
            <i class="bi bi-table" />
            Phong cách Table
          </label>
          <p class="component-styling__hint">
            Chọn kiểu hiển thị của bảng
          </p>
        </div>
        <div class="component-styling__preview">
          <table class="component-styling__preview-table">
            <thead>
              <tr>
                <th>Cột 1</th>
                <th>Cột 2</th>
                <th>Cột 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dữ liệu 1</td>
                <td>Dữ liệu 2</td>
                <td>Dữ liệu 3</td>
              </tr>
              <tr>
                <td>Dữ liệu 4</td>
                <td>Dữ liệu 5</td>
                <td>Dữ liệu 6</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="component-styling__options">
          <button
            v-for="option in tableStyleOptions"
            :key="option.value"
            class="component-styling__option"
            :class="{ 'component-styling__option--active': styles.tableStyle === option.value }"
            @click="updateStyle('tableStyle', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Card Style -->
      <div class="component-styling__section">
        <div class="component-styling__section-header">
          <label class="component-styling__label">
            <i class="bi bi-card-text" />
            Phong cách Card
          </label>
          <p class="component-styling__hint">
            Chọn kiểu hiển thị của card
          </p>
        </div>
        <div class="component-styling__preview">
          <div
            class="component-styling__preview-card"
            :class="`component-styling__preview-card--${styles.cardStyle}`"
          >
            <div class="component-styling__preview-card-title">
              Card Title
            </div>
            <div class="component-styling__preview-card-content">
              Đây là nội dung của card để xem trước phong cách.
            </div>
          </div>
        </div>
        <div class="component-styling__options">
          <button
            v-for="option in cardStyleOptions"
            :key="option.value"
            class="component-styling__option"
            :class="{ 'component-styling__option--active': styles.cardStyle === option.value }"
            @click="updateStyle('cardStyle', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Input Style -->
      <div class="component-styling__section">
        <div class="component-styling__section-header">
          <label class="component-styling__label">
            <i class="bi bi-input-cursor-text" />
            Phong cách Input
          </label>
          <p class="component-styling__hint">
            Chọn kiểu hiển thị của ô nhập liệu
          </p>
        </div>
        <div class="component-styling__preview">
          <input
            type="text"
            placeholder="Nhập văn bản..."
            class="component-styling__preview-input"
            :class="`component-styling__preview-input--${styles.inputStyle}`"
          >
        </div>
        <div class="component-styling__options">
          <button
            v-for="option in inputStyleOptions"
            :key="option.value"
            class="component-styling__option"
            :class="{ 'component-styling__option--active': styles.inputStyle === option.value }"
            @click="updateStyle('inputStyle', option.value)"
          >
            <i :class="`bi ${option.icon}`" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Reset Button -->
      <div class="component-styling__actions">
        <button
          class="component-styling__reset-btn"
          @click="resetStyles"
        >
          <i class="bi bi-arrow-counterclockwise" />
          Đặt lại mặc định
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { useToast } from '@/composables/useToast'

const settingsStore = useSettingsStore()
const toast = useToast()

const styles = ref({ ...settingsStore.componentStyles })

const buttonStyleOptions = [
    { value: 'flat', label: 'Phẳng', icon: 'bi-square' },
    { value: 'outlined', label: 'Viền', icon: 'bi-square-outline' },
    { value: 'filled', label: 'Đầy', icon: 'bi-square-fill' }
]

const tableStyleOptions = [
    { value: 'minimal', label: 'Tối giản', icon: 'bi-table' },
    { value: 'bordered', label: 'Có viền', icon: 'bi-border-all' },
    { value: 'striped', label: 'Sọc', icon: 'bi-list-stars' }
]

const cardStyleOptions = [
    { value: 'flat', label: 'Phẳng', icon: 'bi-square' },
    { value: 'elevated', label: 'Nổi', icon: 'bi-layers' },
    { value: 'bordered', label: 'Viền', icon: 'bi-border' }
]

const inputStyleOptions = [
    { value: 'square', label: 'Vuông', icon: 'bi-square' },
    { value: 'rounded', label: 'Bo tròn', icon: 'bi-square-rounded' },
    { value: 'outlined', label: 'Viền', icon: 'bi-border' }
]

const updateStyle = (key, value) => {
    styles.value[key] = value
    settingsStore.updateComponentStyles(styles.value)
    toast.success('Đã cập nhật phong cách component')
}

const resetStyles = () => {
    styles.value = {
        buttonStyle: 'filled',
        tableStyle: 'bordered',
        cardStyle: 'elevated',
        inputStyle: 'rounded'
    }
    settingsStore.updateComponentStyles(styles.value)
    toast.info('Đã đặt lại về mặc định')
}

// Watch for external changes
watch(() => settingsStore.componentStyles, (newStyles) => {
    styles.value = { ...newStyles }
}, { deep: true })
</script>

<style scoped>
.component-styling {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.component-styling__header {
    margin-bottom: var(--spacing-4);
}

.component-styling__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-2) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.component-styling__title i {
    color: var(--color-primary);
}

.component-styling__description {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
}

.component-styling__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.component-styling__section {
    padding: var(--spacing-5);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
}

.component-styling__section-header {
    margin-bottom: var(--spacing-4);
}

.component-styling__label {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.component-styling__label i {
    color: var(--color-primary);
}

.component-styling__hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: var(--spacing-1) 0 0 0;
}

.component-styling__preview {
    margin-bottom: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--color-card-muted);
    border-radius: var(--radius-sm);
}

.component-styling__preview-item {
    display: flex;
    gap: var(--spacing-3);
    flex-wrap: wrap;
}

.component-styling__preview-btn {
    padding: var(--spacing-2) var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all var(--transition-base);
}

.component-styling__preview-btn--flat {
    border: none;
    background: transparent;
}

.component-styling__preview-btn--outlined {
    background: transparent;
}

.component-styling__preview-btn--filled {
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    border-color: var(--color-primary);
}

.component-styling__preview-btn--active {
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.2);
}

.component-styling__preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
}

.component-styling__preview-table th,
.component-styling__preview-table td {
    padding: var(--spacing-2) var(--spacing-3);
    text-align: left;
}

.component-styling__preview-table th {
    background: var(--color-table-header);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
}

[data-table-style="minimal"] .component-styling__preview-table {
    border: none;
}

[data-table-style="bordered"] .component-styling__preview-table th,
[data-table-style="bordered"] .component-styling__preview-table td {
    border: 1px solid var(--color-border);
}

[data-table-style="striped"] .component-styling__preview-table tbody tr:nth-child(even) {
    background: var(--color-card-muted);
}

.component-styling__preview-card {
    padding: var(--spacing-4);
    background: var(--color-card);
    border-radius: var(--radius-md);
}

.component-styling__preview-card--flat {
    border: none;
    box-shadow: none;
}

.component-styling__preview-card--elevated {
    box-shadow: var(--shadow-md);
}

.component-styling__preview-card--bordered {
    border: 2px solid var(--color-border);
    box-shadow: none;
}

.component-styling__preview-card-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

.component-styling__preview-card-content {
    font-size: var(--font-size-sm);
    color: var(--color-text);
}

.component-styling__preview-input {
    width: 100%;
    padding: var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
}

.component-styling__preview-input--square {
    border-radius: 0;
}

.component-styling__preview-input--rounded {
    border-radius: var(--radius-md);
}

.component-styling__preview-input--outlined {
    background: transparent;
    border-width: 2px;
}

.component-styling__options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--spacing-3);
}

.component-styling__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-base);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

.component-styling__option:hover {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.component-styling__option--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.15);
}

.component-styling__option i {
    font-size: var(--font-size-xl);
}

.component-styling__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}

.component-styling__reset-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-5);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
}

.component-styling__reset-btn:hover {
    border-color: var(--color-danger);
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

/* Responsive */
@media (max-width: 768px) {
    .component-styling__options {
        grid-template-columns: 1fr;
    }
}
</style>

