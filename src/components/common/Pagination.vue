<template>
  <nav
    v-if="totalPages > 1"
    class="pagination-wrapper"
    aria-label="Pagination"
  >
    <ul class="pagination justify-content-center mb-0">
      <li
        class="page-item"
        :class="{ disabled: normalizedCurrent === 0 }"
      >
        <button
          class="page-link"
          type="button"
          @click="changePage(normalizedCurrent - 1)"
        >
          <i class="bi bi-chevron-left" />
        </button>
      </li>
      <li
        v-for="page in pages"
        :key="page"
        class="page-item"
        :class="{ active: page === normalizedCurrent }"
      >
        <button
          class="page-link"
          type="button"
          @click="changePage(page)"
        >
          {{ displayLabel(page) }}
        </button>
      </li>
      <li
        class="page-item"
        :class="{ disabled: normalizedCurrent === totalPages - 1 }"
      >
        <button
          class="page-link"
          type="button"
          @click="changePage(normalizedCurrent + 1)"
        >
          <i class="bi bi-chevron-right" />
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    totalPages: {
        type: Number,
        required: true
    },
    currentPage: {
        type: Number,
        required: true
    },
    mode: {
        type: String,
        default: 'zero-based', // 'zero-based' | 'one-based'
        validator: (value) => ['zero-based', 'one-based'].includes(value)
    }
})

const emit = defineEmits(['page-change'])

const normalizedCurrent = computed(() =>
    props.mode === 'one-based' ? Math.max(0, props.currentPage - 1) : Math.max(0, props.currentPage)
)

const displayLabel = (pageIndex) =>
    props.mode === 'one-based' ? pageIndex + 1 : pageIndex + 1

const pages = computed(() => {
    const pageCount = props.totalPages
    const current = normalizedCurrent.value
    const pagesToShow = 5
    const result = []

    if (pageCount <= pagesToShow) {
        for (let i = 0; i < pageCount; i++) {
            result.push(i)
        }
    } else {
        let startPage = Math.max(0, current - Math.floor(pagesToShow / 2))
        const endPage = Math.min(pageCount - 1, startPage + pagesToShow - 1)

        if (endPage - startPage + 1 < pagesToShow) {
            startPage = Math.max(0, endPage - pagesToShow + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            result.push(i)
        }
    }

    return result
})

const changePage = (normalizedTarget) => {
    if (normalizedTarget < 0 || normalizedTarget >= props.totalPages) return

    const target = props.mode === 'one-based' ? normalizedTarget + 1 : normalizedTarget
    emit('page-change', target)
}
</script>

<style scoped>
.pagination-wrapper {
    margin-top: var(--spacing-6);
}

.pagination {
    gap: var(--spacing-2);
}

.page-item {
    border-radius: var(--radius-sm);
    overflow: visible;
}

.page-link {
    border: 1px solid var(--color-border);
    min-width: 42px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    background: var(--color-card);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    cursor: pointer;
    font-family: var(--font-family-sans);
}

.page-link:hover:not(:disabled),
.page-link:focus:not(:disabled) {
    color: var(--color-primary);
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.page-item.active .page-link {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

.page-item.active .page-link:hover {
    background: var(--color-primary-dark);
}

.page-item.disabled .page-link {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}
</style>
