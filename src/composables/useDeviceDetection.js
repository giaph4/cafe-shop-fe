import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

/**
 * Composable để detect device type và screen size
 */
export const useDeviceDetection = () => {
    const width = ref(window.innerWidth)
    const height = ref(window.innerHeight)
    const isMobile = ref(false)
    const isTablet = ref(false)
    const isDesktop = ref(false)
    const orientation = ref(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')

    // Breakpoints
    const BREAKPOINTS = {
        mobile: 768,
        tablet: 1024,
        desktop: 1025
    }

    /**
     * Update device detection
     */
    const updateDetection = () => {
        width.value = window.innerWidth
        height.value = window.innerHeight
        orientation.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'

        isMobile.value = width.value < BREAKPOINTS.mobile
        isTablet.value = width.value >= BREAKPOINTS.mobile && width.value < BREAKPOINTS.tablet
        isDesktop.value = width.value >= BREAKPOINTS.desktop
    }

    /**
     * Device type
     */
    const deviceType = computed(() => {
        if (isMobile.value) return 'mobile'
        if (isTablet.value) return 'tablet'
        return 'desktop'
    })

    /**
     * Screen size category
     */
    const screenSize = computed(() => {
        if (width.value < 576) return 'xs'
        if (width.value < 768) return 'sm'
        if (width.value < 992) return 'md'
        if (width.value < 1200) return 'lg'
        if (width.value < 1400) return 'xl'
        return 'xxl'
    })

    /**
     * Touch device detection
     */
    const isTouchDevice = computed(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0)

    /**
     * Check if device is in portrait mode
     */
    const isPortrait = computed(() => orientation.value === 'portrait')

    /**
     * Check if device is in landscape mode
     */
    const isLandscape = computed(() => orientation.value === 'landscape')

    /**
     * Responsive utilities
     */
    const isXs = computed(() => screenSize.value === 'xs')
    const isSm = computed(() => screenSize.value === 'sm')
    const isMd = computed(() => screenSize.value === 'md')
    const isLg = computed(() => screenSize.value === 'lg')
    const isXl = computed(() => screenSize.value === 'xl')
    const isXxl = computed(() => screenSize.value === 'xxl')

    // Initialize
    updateDetection()

    // Listen for resize
    const handleResize = () => {
        updateDetection()
    }

    // Listen for orientation change
    const handleOrientationChange = () => {
        // Delay to get accurate dimensions after orientation change
        setTimeout(() => {
            updateDetection()
        }, 100)
    }

    onMounted(() => {
        window.addEventListener('resize', handleResize, { passive: true })
        window.addEventListener('orientationchange', handleOrientationChange)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleOrientationChange)
    })

    return {
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        deviceType,
        screenSize,
        isTouchDevice,
        isPortrait,
        isLandscape,
        isXs,
        isSm,
        isMd,
        isLg,
        isXl,
        isXxl,
        BREAKPOINTS,
        updateDetection
    }
}

