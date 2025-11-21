import {defineStore} from 'pinia'
import {computed, ref} from 'vue'

const COLLAPSE_KEY = 'ui.sidebar.isCollapsed'
const EXPANDED_KEY = 'ui.sidebar.expanded'

const readBoolean = (key, fallback) => {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === 'true'
}

const persistBoolean = (key, value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value ? 'true' : 'false')
}

const readArray = (key) => {
    if (typeof window === 'undefined') return []
    try {
        const raw = window.localStorage.getItem(key)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch (err) {
        console.warn('[sidebar-store] Failed to read array state', err)
        return []
    }
}

const persistArray = (key, value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
}

export const useSidebarStore = defineStore('sidebar', () => {
    const isCollapsed = ref(readBoolean(COLLAPSE_KEY, false))
    const activeItem = ref(null)
    const hoverItem = ref(null)
    const expandedItems = ref(readArray(EXPANDED_KEY))
    const isMobileOpen = ref(false)

    const expandedSet = computed(() => new Set(expandedItems.value))

    const setCollapsed = (value, {persist = true} = {}) => {
        isCollapsed.value = Boolean(value)
        if (persist) {
            persistBoolean(COLLAPSE_KEY, isCollapsed.value)
        }
    }

    const toggleCollapsed = (options) => {
        setCollapsed(!isCollapsed.value, options)
    }

    const setMobileOpen = (value) => {
        isMobileOpen.value = Boolean(value)
    }

    const openMobile = () => setMobileOpen(true)
    const closeMobile = () => setMobileOpen(false)
    const toggleMobile = () => setMobileOpen(!isMobileOpen.value)

    const setActiveItem = (id) => {
        activeItem.value = id || null
    }

    const setHoverItem = (id) => {
        hoverItem.value = id || null
    }

    const clearHoverItem = () => {
        hoverItem.value = null
    }

    const setExpandedItems = (ids, {persist = true} = {}) => {
        const unique = Array.from(new Set(ids.filter(Boolean)))
        expandedItems.value = unique
        if (persist) {
            persistArray(EXPANDED_KEY, unique)
        }
    }

    const toggleExpandedItem = (id, {persist = true} = {}) => {
        if (!id) return
        const set = new Set(expandedItems.value)
        if (set.has(id)) {
            set.delete(id)
        } else {
            set.add(id)
        }
        setExpandedItems([...set], {persist})
    }

    const ensureExpanded = (ids, {persist = false} = {}) => {
        if (!Array.isArray(ids) || ids.length === 0) return
        const set = new Set(expandedItems.value)
        let changed = false
        ids.forEach((id) => {
            if (!id) return
            if (!set.has(id)) {
                set.add(id)
                changed = true
            }
        })
        if (changed) {
            setExpandedItems([...set], {persist})
        }
    }

    const isItemExpanded = (id) => expandedSet.value.has(id)

    return {
        // state
        isCollapsed,
        activeItem,
        hoverItem,
        expandedItems,
        isMobileOpen,
        // getters
        expandedSet,
        isItemExpanded,
        // actions
        setCollapsed,
        toggleCollapsed,
        setMobileOpen,
        openMobile,
        closeMobile,
        toggleMobile,
        setActiveItem,
        setHoverItem,
        clearHoverItem,
        setExpandedItems,
        toggleExpandedItem,
        ensureExpanded
    }
})
