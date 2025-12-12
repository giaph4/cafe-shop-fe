<template>
  <div class="filter-presets">
    <div class="filter-presets__header">
      <label class="filter-presets__label">
        <i class="bi bi-bookmark me-2" />
        Bộ lọc đã lưu
      </label>
      <button
        v-if="presets.length > 0"
        class="filter-presets__manage-btn"
        type="button"
        @click="showManage = true"
      >
        <i class="bi bi-gear" />
      </button>
    </div>

    <div class="filter-presets__list">
      <button
        v-for="preset in presets"
        :key="preset.id"
        class="filter-presets__item"
        :class="{ 'filter-presets__item--active': activePresetId === preset.id }"
        type="button"
        @click="selectPreset(preset)"
      >
        <i class="bi bi-bookmark-fill" />
        <span>{{ preset.name }}</span>
        <button
          v-if="showManage"
          class="filter-presets__delete"
          type="button"
          @click.stop="deletePreset(preset.id)"
        >
          <i class="bi bi-trash" />
        </button>
      </button>

      <button
        v-if="presets.length === 0"
        class="filter-presets__empty"
        type="button"
        @click="showSaveDialog = true"
      >
        <i class="bi bi-bookmark-plus" />
        Lưu bộ lọc hiện tại
      </button>
    </div>

    <!-- Save Preset Dialog -->
    <div
      v-if="showSaveDialog"
      class="filter-presets__dialog-overlay"
      @click="showSaveDialog = false"
    >
      <div
        class="filter-presets__dialog"
        @click.stop
      >
        <h4>Lưu bộ lọc</h4>
        <input
          v-model="presetName"
          type="text"
          class="form-control"
          placeholder="Tên bộ lọc..."
          @keydown.enter="handleSave"
        >
        <div class="filter-presets__dialog-actions">
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="showSaveDialog = false"
          >
            Hủy
          </button>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="!presetName.trim()"
            @click="handleSave"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSearchStore } from '@/store/search'

const props = defineProps({
    pageName: {
        type: String,
        required: true
    },
    currentFilters: {
        type: Object,
        default: () => ({})
    },
    activePresetId: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['select', 'save', 'delete'])

const searchStore = useSearchStore()
const showManage = ref(false)
const showSaveDialog = ref(false)
const presetName = ref('')

const presets = computed(() => searchStore.getFilterPresets(props.pageName))

const selectPreset = (preset) => {
    emit('select', preset)
}

const handleSave = () => {
    if (!presetName.value.trim()) return

    const preset = searchStore.saveFilterPreset(
        props.pageName,
        presetName.value.trim(),
        props.currentFilters
    )

    emit('save', preset)
    showSaveDialog.value = false
    presetName.value = ''
}

const deletePreset = (presetId) => {
    searchStore.deleteFilterPreset(props.pageName, presetId)
    emit('delete', presetId)
}

watch(() => props.pageName, () => {
    showManage.value = false
    showSaveDialog.value = false
})
</script>

<style scoped>
.filter-presets {
    margin-bottom: 20px;
}

.filter-presets__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.filter-presets__label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-heading);
    display: flex;
    align-items: center;
    margin: 0;
}

.filter-presets__manage-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-presets__manage-btn:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.filter-presets__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.filter-presets__item {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    border-radius: 8px;
    text-align: left;
    color: var(--color-heading);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
}

.filter-presets__item:hover {
    border-color: var(--color-primary);
    background: var(--color-card-muted);
}

.filter-presets__item--active {
    border-color: var(--color-primary);
    background: rgba(44, 120, 115, 0.1);
    color: var(--color-primary);
}

.filter-presets__item i:first-child {
    color: var(--color-primary);
    font-size: 0.85rem;
}

.filter-presets__item span {
    flex: 1;
}

.filter-presets__delete {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
}

.filter-presets__item:hover .filter-presets__delete {
    opacity: 1;
}

.filter-presets__delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.filter-presets__empty {
    width: 100%;
    padding: 12px;
    border: 1px dashed var(--color-border);
    background: transparent;
    border-radius: 8px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.filter-presets__empty:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(44, 120, 115, 0.05);
}

.filter-presets__dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.filter-presets__dialog {
    background: var(--color-card);
    border-radius: var(--radius-lg);
    padding: 24px;
    min-width: 300px;
    max-width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.filter-presets__dialog h4 {
    margin: 0 0 16px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-heading);
}

.filter-presets__dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
}
</style>

