<template>
    <div class="error-state" :class="containerClass">
        <div class="error-state__icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h5 v-if="title" class="error-state__title">{{ title }}</h5>
        <p class="error-state__message">{{ message }}</p>
        <div v-if="showRetry && retryHandler" class="error-state__actions">
            <button class="btn btn-primary error-state__retry-btn" @click="handleRetry">
                <i class="bi bi-arrow-clockwise me-2"></i>
                Thử lại
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    /**
     * Error message to display
     */
    message: {
        type: String,
        required: true
    },
    /**
     * Error title (optional)
     */
    title: {
        type: String,
        default: 'Đã xảy ra lỗi'
    },
    /**
     * Show retry button
     */
    showRetry: {
        type: Boolean,
        default: true
    },
    /**
     * Retry handler function
     */
    retryHandler: {
        type: Function,
        default: null
    },
    /**
     * Container class
     */
    containerClass: {
        type: String,
        default: ''
    },
    /**
     * Error variant: 'danger' | 'warning' | 'info'
     */
    variant: {
        type: String,
        default: 'danger',
        validator: (value) => ['danger', 'warning', 'info'].includes(value)
    }
})

const emit = defineEmits(['retry'])

const handleRetry = () => {
    if (props.retryHandler) {
        props.retryHandler()
    }
    emit('retry')
}
</script>

<style scoped>
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--spacing-8);
    text-align: center;
    gap: var(--spacing-4);
}

.error-state__icon {
    font-size: var(--font-size-3xl);
    color: var(--color-danger);
    margin-bottom: var(--spacing-2);
    display: flex;
    align-items: center;
    justify-content: center;
}

.error-state__icon .bi-exclamation-triangle-fill {
    display: block;
}

.error-state__title {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
    margin: 0;
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.error-state__message {
    color: var(--color-text-muted);
    margin: 0;
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    max-width: 500px;
    font-family: var(--font-family-sans);
}

.error-state__actions {
    margin-top: var(--spacing-2);
}

.error-state__retry-btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.error-state__retry-btn:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

/* Variant styles */
.error-state--warning .error-state__icon {
    color: var(--color-warning);
}

.error-state--info .error-state__icon {
    color: var(--color-primary);
}
</style>

