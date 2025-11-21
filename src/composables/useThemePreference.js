import { onMounted, onUnmounted, ref } from 'vue'

const resolveIsDarkTheme = () => {
    if (typeof document !== 'undefined') {
        const root = document.documentElement
        if (root?.dataset?.bsTheme) {
            return root.dataset.bsTheme === 'dark'
        }
        if (root?.dataset?.theme) {
            return root.dataset.theme === 'dark'
        }
        if (root?.classList.contains('dark-theme')) {
            return true
        }
        if (root?.classList.contains('light-theme') || root?.classList.contains('comfort-theme')) {
            return false
        }
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    return false
}

export const useThemePreference = () => {
    const isDark = ref(false)
    let mutationObserver = null
    let mediaQuery = null

    const update = () => {
        isDark.value = resolveIsDarkTheme()
    }

    onMounted(() => {
        update()

        if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
            mutationObserver = new MutationObserver(update)
            mutationObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme', 'data-bs-theme']
            })
        }

        if (typeof window !== 'undefined' && window.matchMedia) {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            if (typeof mediaQuery.addEventListener === 'function') {
                mediaQuery.addEventListener('change', update)
            } else if (typeof mediaQuery.addListener === 'function') {
                mediaQuery.addListener(update)
            }
        }
    })

    onUnmounted(() => {
        mutationObserver?.disconnect()
        if (mediaQuery) {
            if (typeof mediaQuery.removeEventListener === 'function') {
                mediaQuery.removeEventListener('change', update)
            } else if (typeof mediaQuery.removeListener === 'function') {
                mediaQuery.removeListener(update)
            }
        }
    })

    return { isDark }
}
