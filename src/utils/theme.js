const THEME_KEY = 'app-theme'
export const LIGHT_THEME = 'light-theme'
export const COMFORT_THEME = 'comfort-theme'
export const DARK_THEME = 'dark-theme'

const THEME_CLASSES = [LIGHT_THEME, COMFORT_THEME, DARK_THEME]

const isValidTheme = (theme) => THEME_CLASSES.includes(theme)

export const getStoredTheme = () => {
    if (typeof localStorage === 'undefined') return ''
    return localStorage.getItem(THEME_KEY) || ''
}

export const getPreferredTheme = () => {
    if (typeof window === 'undefined') return LIGHT_THEME
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME
}

export const resolveInitialTheme = () => {
    const stored = getStoredTheme()
    if (isValidTheme(stored)) return stored
    return getPreferredTheme()
}

export const applyThemeClass = (theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls))
    const applied = isValidTheme(theme) ? theme : LIGHT_THEME
    root.classList.add(applied)
    root.setAttribute('data-theme', applied)
    root.setAttribute('data-bs-theme', applied === DARK_THEME ? 'dark' : 'light')
}

export const persistTheme = (theme) => {
    if (typeof localStorage === 'undefined') return
    const stored = isValidTheme(theme) ? theme : LIGHT_THEME
    localStorage.setItem(THEME_KEY, stored)
}

export const toggleThemeValue = (current) => {
    switch (current) {
        case LIGHT_THEME:
            return COMFORT_THEME
        case COMFORT_THEME:
            return DARK_THEME
        case DARK_THEME:
        default:
            return LIGHT_THEME
    }
}

export const normalizeTheme = (theme) => (isValidTheme(theme) ? theme : LIGHT_THEME)

export const THEME_SEQUENCE = [...THEME_CLASSES]
