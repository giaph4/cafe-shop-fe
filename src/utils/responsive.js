/**
 * Responsive utilities và breakpoints
 */

export const BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
}

/**
 * Check if current width matches breakpoint
 */
export const isBreakpoint = (breakpoint) => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= BREAKPOINTS[breakpoint] && width < (BREAKPOINTS[getNextBreakpoint(breakpoint)] || Infinity)
}

/**
 * Get next breakpoint
 */
const getNextBreakpoint = (breakpoint) => {
    const breakpoints = Object.keys(BREAKPOINTS)
    const index = breakpoints.indexOf(breakpoint)
    return breakpoints[index + 1] || null
}

/**
 * Check if width is less than breakpoint
 */
export const isLessThan = (breakpoint) => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < BREAKPOINTS[breakpoint]
}

/**
 * Check if width is greater than or equal to breakpoint
 */
export const isGreaterThanOrEqual = (breakpoint) => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= BREAKPOINTS[breakpoint]
}

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = () => {
    if (typeof window === 'undefined') return 'xs'

    const width = window.innerWidth
    const breakpoints = Object.keys(BREAKPOINTS).reverse()

    for (const bp of breakpoints) {
        if (width >= BREAKPOINTS[bp]) {
            return bp
        }
    }

    return 'xs'
}

/**
 * Responsive value helper
 * Returns different values based on breakpoint
 */
export const responsiveValue = (values) => {
    const breakpoint = getCurrentBreakpoint()
    return values[breakpoint] || values.default || values.md
}

/**
 * Media query helper
 */
export const matchMedia = (query) => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
}

/**
 * Touch device detection
 */
export const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

/**
 * Mobile device detection
 */
export const isMobileDevice = () => isLessThan('md') || matchMedia('(max-width: 767px)')

/**
 * Tablet device detection
 */
export const isTabletDevice = () => matchMedia('(min-width: 768px) and (max-width: 1023px)')

/**
 * Desktop device detection
 */
export const isDesktopDevice = () => isGreaterThanOrEqual('lg')

