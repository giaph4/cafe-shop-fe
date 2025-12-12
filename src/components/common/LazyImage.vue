<template>
  <div
    ref="containerRef"
    class="lazy-image"
    :class="{ 'lazy-image--loaded': isLoaded, 'lazy-image--error': hasError }"
    :style="{ aspectRatio: aspectRatio }"
  >
    <img
      v-if="isVisible && src"
      :src="src"
      :alt="alt"
      :class="imageClass"
      @load="handleLoad"
      @error="handleError"
    >
    <div
      v-if="!isLoaded && !hasError"
      class="lazy-image__placeholder"
    >
      <div class="lazy-image__skeleton" />
    </div>
    <div
      v-if="hasError"
      class="lazy-image__error"
    >
      <i class="bi bi-image" />
      <span>{{ errorText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useLazyLoad } from '@/composables/useLazyLoad'

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        default: ''
    },
    aspectRatio: {
        type: String,
        default: '16/9'
    },
    imageClass: {
        type: String,
        default: ''
    },
    errorText: {
        type: String,
        default: 'Không thể tải ảnh'
    },
    placeholder: {
        type: String,
        default: null
    }
})

const { isVisible, elementRef: containerRef } = useLazyLoad({
    rootMargin: '50px',
    threshold: 0.1
})

const isLoaded = ref(false)
const hasError = ref(false)

const handleLoad = () => {
    isLoaded.value = true
    hasError.value = false
}

const handleError = () => {
    hasError.value = true
    isLoaded.value = false
}

watch(() => props.src, () => {
    isLoaded.value = false
    hasError.value = false
})
</script>

<style scoped>
.lazy-image {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: var(--color-card-muted);
}

.lazy-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
}

.lazy-image--loaded img {
    opacity: 1;
}

.lazy-image__placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lazy-image__skeleton {
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        var(--color-card-muted) 0%,
        var(--color-border) 50%,
        var(--color-card-muted) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.lazy-image__error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    gap: 8px;
}

.lazy-image__error i {
    font-size: 2rem;
}

.lazy-image__error span {
    font-size: 0.875rem;
}
</style>

