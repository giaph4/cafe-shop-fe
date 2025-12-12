import { ref } from 'vue'

/**
 * Composable để xử lý swipe gestures
 * @param {Object} options - Options
 * @param {Function} options.onSwipeLeft - Callback khi swipe left
 * @param {Function} options.onSwipeRight - Callback khi swipe right
 * @param {Function} options.onSwipeUp - Callback khi swipe up
 * @param {Function} options.onSwipeDown - Callback khi swipe down
 * @param {number} options.threshold - Minimum distance để trigger swipe (default: 50)
 * @param {number} options.velocity - Minimum velocity để trigger swipe (default: 0.3)
 */
export const useSwipeGestures = (options = {}) => {
    const {
        onSwipeLeft = null,
        onSwipeRight = null,
        onSwipeUp = null,
        onSwipeDown = null,
        threshold = 50,
        velocity = 0.3
    } = options

    const touchStartX = ref(0)
    const touchStartY = ref(0)
    const touchStartTime = ref(0)
    const isSwiping = ref(false)
    const swipeDistance = ref({ x: 0, y: 0 })

    /**
     * Handle touch start
     */
    const handleTouchStart = (event) => {
        const touch = event.touches[0]
        touchStartX.value = touch.clientX
        touchStartY.value = touch.clientY
        touchStartTime.value = Date.now()
        isSwiping.value = true
        swipeDistance.value = { x: 0, y: 0 }
    }

    /**
     * Handle touch move
     */
    const handleTouchMove = (event) => {
        if (!isSwiping.value) return

        const touch = event.touches[0]
        const deltaX = touch.clientX - touchStartX.value
        const deltaY = touch.clientY - touchStartY.value

        swipeDistance.value = { x: deltaX, y: deltaY }

        // Prevent default scrolling if swiping horizontally
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            event.preventDefault()
        }
    }

    /**
     * Handle touch end
     */
    const handleTouchEnd = (event) => {
        if (!isSwiping.value) return

        const touch = event.changedTouches[0]
        const deltaX = touch.clientX - touchStartX.value
        const deltaY = touch.clientY - touchStartY.value
        const deltaTime = Date.now() - touchStartTime.value

        const distanceX = Math.abs(deltaX)
        const distanceY = Math.abs(deltaY)
        const velocityX = distanceX / deltaTime
        const velocityY = distanceY / deltaTime

        // Determine swipe direction
        if (distanceX > threshold || velocityX > velocity) {
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight({ distance: distanceX, velocity: velocityX })
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft({ distance: distanceX, velocity: velocityX })
            }
        }

        if (distanceY > threshold || velocityY > velocity) {
            if (deltaY > 0 && onSwipeDown) {
                onSwipeDown({ distance: distanceY, velocity: velocityY })
            } else if (deltaY < 0 && onSwipeUp) {
                onSwipeUp({ distance: distanceY, velocity: velocityY })
            }
        }

        // Reset
        isSwiping.value = false
        swipeDistance.value = { x: 0, y: 0 }
    }

    /**
     * Setup swipe listeners on element
     */
    const setupSwipe = (element) => {
        if (!element) return

        element.addEventListener('touchstart', handleTouchStart, { passive: false })
        element.addEventListener('touchmove', handleTouchMove, { passive: false })
        element.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    /**
     * Remove swipe listeners from element
     */
    const removeSwipe = (element) => {
        if (!element) return

        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
    }

    return {
        isSwiping,
        swipeDistance,
        setupSwipe,
        removeSwipe,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    }
}

