<template>
    <div class="error-state" :class="containerClass">
        <div class="error-state__icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h5 v-if="title" class="error-state__title">{{ title }}</h5>
        <p class="error-state__message">{{ message }}</p>
        <div v-if="showRetry && retryHandler" class="error-state__actions">
            <button class="btn btn-primary" @click="handleRetry">
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
    padding: 2rem;
    text-align: center;
    gap: 1rem;
}

.error-state__icon {
    font-size: 3rem;
    color: var(--color-danger);
    margin-bottom: 0.5rem;
}

.error-state__icon .bi-exclamation-triangle-fill {
    display: block;
}

.error-state__title {
    color: var(--color-heading);
    font-weight: 600;
    margin: 0;
    font-size: 1.25rem;
}

.error-state__message {
    color: var(--color-text-muted);
    margin: 0;
    font-size: 0.9375rem;
    max-width: 500px;
}

.error-state__actions {
    margin-top: 0.5rem;
}

/* Variant styles */
.error-state--warning .error-state__icon {
    color: var(--color-warning);
}

.error-state--info .error-state__icon {
    color: var(--color-primary);
}
</style>

