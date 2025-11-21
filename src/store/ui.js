import {defineStore} from 'pinia'
import {ref} from 'vue'

const COLLAPSE_KEY = 'ui.sidebar.collapsed'
const EXPANDED_KEY = 'ui.sidebar.expanded'

const readBoolean = (key, fallback) => {
    if (typeof window === 'undefined') return fallback
    const value = localStorage.getItem(key)
    if (value === null) return fallback
    return value === 'true'
}

const readArray = (key) => {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch (err) {
        console.warn('Failed to parse sidebar groups from storage', err)
        return []
    }
}

const persistBoolean = (key, value) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value ? 'true' : 'false')
}

const persistArray = (key, value) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(value))
}

export const useUiStore = defineStore('ui', () => {
    const sidebarCollapsed = ref(readBoolean(COLLAPSE_KEY, false))
    const sidebarExpandedGroups = ref(readArray(EXPANDED_KEY))
    const sidebarOpen = ref(false)

    const setSidebarCollapsed = (value, {persist = true} = {}) => {
        sidebarCollapsed.value = value
        if (persist) {
            persistBoolean(COLLAPSE_KEY, value)
        }
    }

    const toggleSidebarCollapsed = (options) => {
        setSidebarCollapsed(!sidebarCollapsed.value, options)
    }

    const setSidebarOpen = (value) => {
        sidebarOpen.value = Boolean(value)
    }

    const openSidebar = () => setSidebarOpen(true)
    const closeSidebar = () => setSidebarOpen(false)
    const toggleSidebarOpen = () => setSidebarOpen(!sidebarOpen.value)

    const setExpandedGroups = (ids, {persist = true} = {}) => {
        sidebarExpandedGroups.value = Array.from(new Set(ids))
        if (persist) {
            persistArray(EXPANDED_KEY, sidebarExpandedGroups.value)
        }
    }

    const toggleSidebarGroup = (id, {persist = true} = {}) => {
        const set = new Set(sidebarExpandedGroups.value)
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }
        setExpandedGroups([...set], {persist})
    }

    const ensureSidebarGroups = (ids, {persist = false} = {}) => {
        if (!ids?.length) return
        const set = new Set(sidebarExpandedGroups.value)
        let changed = false
        ids.forEach((id) => {
            if (!set.has(id)) {
                set.add(id)
                changed = true
            }
        })
        if (changed) {
            setExpandedGroups([...set], {persist})
        }
    }

    return {
        sidebarCollapsed,
        sidebarExpandedGroups,
        sidebarOpen,
        setSidebarCollapsed,
        toggleSidebarCollapsed,
        setExpandedGroups,
        toggleSidebarGroup,
        ensureSidebarGroups,
        setSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebarOpen
    }
})
