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
    gap: var(--spacing-3);
    text-align: center;
    padding: var(--spacing-10) var(--spacing-6);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
    background: var(--color-card-muted);
}

.empty-state__icon {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    background: var(--color-primary-soft);
    display: grid;
    place-items: center;
    font-size: var(--font-size-3xl);
    color: var(--color-primary);
    margin-bottom: var(--spacing-2);
}

.empty-state__text h6 {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
}

.empty-state__text p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    max-width: 400px;
}

.empty-state__action {
    margin-top: var(--spacing-2);
}
</style>
