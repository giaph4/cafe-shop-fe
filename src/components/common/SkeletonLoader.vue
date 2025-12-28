<template>
  <div
    class="skeleton-loader"
    :class="[`skeleton-loader--${variant}`, { 'skeleton-loader--animated': animated }]"
    :style="{ width: width, height: height, borderRadius: borderRadius }"
  />
</template>

<script setup>
defineProps({
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'text', 'circular', 'rectangular'].includes(value)
    },
    width: {
        type: String,
        default: '100%'
    },
    height: {
        type: String,
        default: '1rem'
    },
    borderRadius: {
        type: String,
        default: 'var(--radius-sm)'
    },
    animated: {
        type: Boolean,
        default: true
    }
})
</script>

<style scoped>
.skeleton-loader {
    background: var(--color-card-muted);
    position: relative;
    overflow: hidden;
}

.skeleton-loader--animated::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-loader--text {
    height: 1rem;
    border-radius: var(--radius-sm);
}

.skeleton-loader--circular {
    border-radius: 50%;
    aspect-ratio: 1;
}

.skeleton-loader--rectangular {
    border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>

