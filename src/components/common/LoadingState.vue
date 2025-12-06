<template>
    <div class="loading-state" :class="containerClass">
        <div class="loading-state__spinner">
            <div class="spinner-border" :class="spinnerClass" role="status">
                <span class="visually-hidden">{{ loadingText }}</span>
            </div>
        </div>
        <p v-if="showText" class="loading-state__text">{{ loadingText }}</p>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    /**
     * Loading text to display
     */
    text: {
        type: String,
        default: 'Đang tải...'
    },
    /**
     * Show text below spinner
     */
    showText: {
        type: Boolean,
        default: true
    },
    /**
     * Spinner size: 'sm' | 'md' | 'lg'
     */
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    /**
     * Container class
     */
    containerClass: {
        type: String,
        default: ''
    },
    /**
     * Spinner color variant
     */
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
    }
})

const loadingText = computed(() => props.text)

const spinnerClass = computed(() => {
    const classes = []
    
    if (props.size === 'sm') {
        classes.push('spinner-border-sm')
    }
    
    classes.push(`text-${props.variant}`)
    
    return classes.join(' ')
})
</script>

<style scoped>
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--spacing-8);
    gap: var(--spacing-4);
}

.loading-state__spinner {
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-state__text {
    color: var(--color-text-muted);
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    font-family: var(--font-family-sans);
}

/* Size variants */
.loading-state--sm {
    min-height: 100px;
    padding: var(--spacing-4);
    gap: var(--spacing-2);
}

.loading-state--sm .loading-state__text {
    font-size: var(--font-size-sm);
}

.loading-state--lg {
    min-height: 300px;
    padding: var(--spacing-12);
    gap: var(--spacing-6);
}

.loading-state--lg .loading-state__text {
    font-size: var(--font-size-lg);
}
</style>

