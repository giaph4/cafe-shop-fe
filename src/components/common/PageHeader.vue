<template>
    <header class="page-header">
        <div class="page-header__content">
            <div>
                <h2 class="page-header__title">{{ title }}</h2>
                <p v-if="subtitle" class="page-header__subtitle mb-0">{{ subtitle }}</p>
            </div>
            <div v-if="$slots.actions" class="page-header__actions">
                <slot name="actions"></slot>
            </div>
        </div>
    </header>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    }
})
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
    margin-bottom: 1.5rem;
}

.page-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
}

.page-header__title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
}

.page-header__subtitle {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin: 0;
}

.page-header__actions {
    display: inline-flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-header__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
