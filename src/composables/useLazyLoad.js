import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for lazy loading components and data
 */
export function useLazyLoad (options = {}) {
    const {
        root = null,
        rootMargin = '50px',
        threshold = 0.1,
        immediate = false
    } = options

    const isVisible = ref(false)
    const elementRef = ref(null)
    let observer = null

    const observe = () => {
        if (!elementRef.value || observer) return

        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        isVisible.value = true
                        if (observer) {
                            observer.unobserve(entry.target)
                        }
                    }
                })
            },
            {
                root,
                rootMargin,
                threshold
            }
        )

        observer.observe(elementRef.value)
    }

    const unobserve = () => {
        if (observer && elementRef.value) {
            observer.unobserve(elementRef.value)
            observer.disconnect()
            observer = null
        }
    }

    onMounted(() => {
        if (immediate) {
            isVisible.value = true
        } else {
            observe()
        }
    })

    onUnmounted(() => {
        unobserve()
    })

    return {
        isVisible,
        elementRef,
        observe,
        unobserve
    }
}

/**
 * Lazy load component with Suspense
 */
export function lazyLoadComponent (importFn) {
    return () => ({
        component: importFn(),
        loading: {
            template: '<div class="lazy-loading"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>',
            delay: 200
        },
        error: {
            template: '<div class="lazy-load-error">Failed to load component</div>'
        },
        timeout: 10000
    })
}

