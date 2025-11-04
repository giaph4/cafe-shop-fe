<template>
    <nav v-if="totalPages > 1">
        <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="gotoPage(1)">&laquo;</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="gotoPage(currentPage - 1)">&lsaquo;</a>
            </li>

            <li v-for="page in pages" :key="page" class="page-item"
                :class="{ active: currentPage === page, disabled: page === '...' }">
                <a v-if="page !== '...'" class="page-link" href="#" @click.prevent="gotoPage(page)">
                    {{ page }}
                </a>
                <span v-else class="page-link">...</span>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="gotoPage(currentPage + 1)">&rsaquo;</a>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="gotoPage(totalPages)">&raquo;</a>
            </li>
        </ul>
    </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    currentPage: {
        type: Number,
        required: true,
    },
    totalPages: {
        type: Number,
        required: true,
    },
    maxVisiblePages: {
        type: Number,
        default: 5,
    },
})

const emit = defineEmits(['page-change'])

const gotoPage = (page) => {
    if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
        emit('page-change', page)
    }
}

// tính toán các trang hiển thị (vd: 1, 2, ..., 5, 6, 7, ..., 10)
const pages = computed(() => {
    const pages = []
    const { currentPage, totalPages, maxVisiblePages } = props

    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i)
        }
        return pages
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1)
    }

    if (start > 1) {
        pages.push(1)
        if (start > 2) {
            pages.push('...')
        }
    }

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    if (end < totalPages) {
        if (end < totalPages - 1) {
            pages.push('...')
        }
        pages.push(totalPages)
    }

    return pages
})
</script>

<style scoped>
.page-link {
    color: #A36B4A;
}

.page-item.active .page-link {
    background-color: #A36B4A;
    border-color: #A36B4A;
    color: white;
}

.page-item.disabled .page-link {
    color: #aaa;
}
</style>