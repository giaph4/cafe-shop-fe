import { ref, onMounted } from 'vue'
import { performanceMonitor } from '@/utils/performanceMonitor'

/**
 * Composable for tracking component performance
 */
export function usePerformance (componentName) {
    const renderStartTime = ref(null)
    const renderDuration = ref(0)

    const startRender = () => {
        renderStartTime.value = performance.now()
    }

    const endRender = () => {
        if (renderStartTime.value) {
            renderDuration.value = performance.now() - renderStartTime.value
            if (componentName) {
                performanceMonitor.trackRender(componentName, renderDuration.value)
            }
        }
    }

    onMounted(() => {
        endRender()
    })

    return {
        renderDuration,
        startRender,
        endRender
    }
}

/**
 * Composable for tracking API call performance
 */
export function useApiPerformance () {
    const trackApiCall = (url, method, startTime, status, size = 0) => {
        const duration = performance.now() - startTime
        performanceMonitor.trackApiCall(url, method, duration, status, size)
        return duration
    }

    return {
        trackApiCall
    }
}

