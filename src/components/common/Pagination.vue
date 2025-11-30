<template>
    <nav v-if="totalPages > 1" class="pagination-wrapper" aria-label="Pagination">
        <ul class="pagination justify-content-center mb-0">
            <li class="page-item" :class="{ disabled: normalizedCurrent === 0 }">
                <button class="page-link" type="button" @click="changePage(normalizedCurrent - 1)">
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
            <li v-for="page in pages" :key="page" class="page-item" :class="{ active: page === normalizedCurrent }">
                <button class="page-link" type="button" @click="changePage(page)">
                    {{ displayLabel(page) }}
                </button>
            </li>
            <li class="page-item" :class="{ disabled: normalizedCurrent === totalPages - 1 }">
                <button class="page-link" type="button" @click="changePage(normalizedCurrent + 1)">
                    <i class="bi bi-chevron-right"></i>
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
        let endPage = Math.min(pageCount - 1, startPage + pagesToShow - 1)

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
    border-radius: var(--radius-full);
    overflow: hidden;
}

.page-link {
    border: none;
    min-width: 42px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-heading);
    background: var(--color-card);
    box-shadow: inset 0 0 0 1px var(--color-border-soft), var(--shadow-md);
    transition: all var(--transition-fast);
    cursor: pointer;
}

.page-link:hover:not(:disabled),
.page-link:focus:not(:disabled) {
    color: var(--color-primary);
    box-shadow: inset 0 0 0 1px var(--color-primary), var(--shadow-lg);
    transform: translateY(-1px);
}

.page-item.active .page-link {
    background: linear-gradient(122deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: var(--color-primary-contrast);
    box-shadow: var(--shadow-lg);
    border: none;
}

.page-item.active .page-link:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-xl);
}

.page-item.disabled .page-link {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}
</style>
