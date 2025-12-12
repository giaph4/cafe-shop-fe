<template>
  <div
    ref="containerRef"
    class="pull-to-refresh"
    :class="{ 'pull-to-refresh--pulling': isPulling, 'pull-to-refresh--refreshing': isRefreshing }"
  >
    <div class="pull-to-refresh__indicator">
      <div
        v-if="isRefreshing"
        class="pull-to-refresh__spinner"
      >
        <div class="spinner-border spinner-border-sm" />
      </div>
      <i
        v-else
        class="bi bi-arrow-down pull-to-refresh__arrow"
        :style="{ transform: `rotate(${pullDistance}deg)` }"
      />
      <span class="pull-to-refresh__text">
        {{ isRefreshing ? 'Đang làm mới...' : pullDistance > threshold ? 'Thả để làm mới' : 'Kéo để làm mới' }}
      </span>
    </div>
    <div class="pull-to-refresh__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSwipeGestures } from '@/composables/useSwipeGestures'

const props = defineProps({
    threshold: {
        type: Number,
        default: 80
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['refresh'])

const containerRef = ref(null)
const isPulling = ref(false)
const isRefreshing = ref(false)
const pullDistance = ref(0)

const { setupSwipe, removeSwipe } = useSwipeGestures({
    onSwipeDown: ({ distance }) => {
        if (props.disabled || isRefreshing.value) return

        // Check if at top of scroll
        if (containerRef.value) {
            const scrollTop = containerRef.value.scrollTop || window.scrollY
            if (scrollTop > 0) return
        }

        isPulling.value = true
        pullDistance.value = Math.min(distance, props.threshold * 1.5)
    },
    onSwipeUp: () => {
        if (isPulling.value && !isRefreshing.value) {
            if (pullDistance.value >= props.threshold) {
                // Trigger refresh
                isRefreshing.value = true
                emit('refresh')
            } else {
                // Reset
                isPulling.value = false
                pullDistance.value = 0
            }
        }
    }
})

const handleRefreshComplete = () => {
    isRefreshing.value = false
    isPulling.value = false
    pullDistance.value = 0
}

onMounted(() => {
    if (containerRef.value) {
        setupSwipe(containerRef.value)
    }
})

onBeforeUnmount(() => {
    if (containerRef.value) {
        removeSwipe(containerRef.value)
    }
})

defineExpose({
    refreshComplete: handleRefreshComplete
})
</script>

<style scoped>
.pull-to-refresh {
    position: relative;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.pull-to-refresh__indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3);
    transform: translateY(-100%);
    transition: transform var(--transition-base);
    z-index: 10;
    background: var(--color-card);
}

.pull-to-refresh--pulling .pull-to-refresh__indicator,
.pull-to-refresh--refreshing .pull-to-refresh__indicator {
    transform: translateY(0);
}

.pull-to-refresh__spinner {
    margin-bottom: var(--spacing-2);
}

.pull-to-refresh__arrow {
    font-size: 24px;
    color: var(--color-primary);
    margin-bottom: var(--spacing-2);
    transition: transform var(--transition-base);
}

.pull-to-refresh__text {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-align: center;
}

.pull-to-refresh__content {
    min-height: 100%;
}
</style>

