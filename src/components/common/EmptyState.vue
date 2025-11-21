<template>
    <div class="empty-state">
        <div class="empty-state__icon">
            <slot name="icon">
                <i class="bi bi-clipboard-data"></i>
            </slot>
        </div>
        <div class="empty-state__text">
            <h6>{{ title }}</h6>
            <p>{{ message }}</p>
        </div>
        <div v-if="$slots.action" class="empty-state__action">
            <slot name="action"></slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {type: String, default: 'Không có dữ liệu'},
    message: {type: String, default: 'Hãy thử điều chỉnh bộ lọc hoặc tạo mới dữ liệu.'}
})
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    text-align: center;
    padding: 2.5rem 1.5rem;
    border-radius: var(--radius-md);
    border: 1px dashed var(--color-border);
    background: var(--color-card-muted);
}

.empty-state__icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--color-soft-primary);
    display: grid;
    place-items: center;
    font-size: 1.8rem;
    color: var(--color-primary);
}

.empty-state__text h6 {
    margin: 0;
    font-weight: 600;
}

.empty-state__text p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;
}
</style>
