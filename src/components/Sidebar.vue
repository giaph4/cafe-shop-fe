<template>
    <aside
        ref="rootRef"
        class="neo-sidebar"
        :class="{
            'is-collapsed': displayCollapsed,
            'is-mobile': isMobile,
            'is-open': isMobile && sidebarStore.isMobileOpen
        }"
        role="navigation"
        aria-label="Điều hướng chính"
    >
        <div class="neo-sidebar__inner">
            <header class="neo-sidebar__header">
                <router-link class="neo-sidebar__brand" to="/">
                    <span class="neo-sidebar__brand-icon">
                        <i class="bi bi-cup-hot"></i>
                    </span>
                    <span v-if="!displayCollapsed" class="neo-sidebar__brand-text">
                        <strong>Café Dash</strong>
                        <small>Hệ thống quản lý</small>
                    </span>
                </router-link>

                <button
                    v-if="!isMobile"
                    class="neo-sidebar__collapse"
                    type="button"
                    :aria-label="displayCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'"
                    @click="toggleCollapsed"
                >
                    <i class="bi" :class="displayCollapsed ? sidebarIcons.expand : sidebarIcons.collapse"></i>
                </button>
            </header>

            <nav class="neo-sidebar__sections" aria-label="Nhóm menu">
                <section
                    v-for="section in sections"
                    :key="section.heading"
                    class="neo-sidebar__section"
                >
                    <p v-if="!displayCollapsed" class="neo-sidebar__section-label">{{ section.heading }}</p>

                    <ul class="neo-sidebar__items" role="menubar">
                        <SidebarItem
                            v-for="item in section.items"
                            :key="item.id"
                            :item="item"
                            :icons="sidebarIcons"
                            :collapsed="displayCollapsed"
                            :active-id="activeItemId"
                            :active-trail="activeTrail"
                            :expanded-ids="expandedItems"
                            @toggle="handleToggle"
                            @navigate="handleNavigate"
                            @hover-intent="handleHoverIntent"
                            @hover-leave="handleHoverLeave"
                        />
                    </ul>
                </section>
            </nav>

            <footer v-if="!displayCollapsed" class="neo-sidebar__footer">
                <button class="neo-sidebar__quick" type="button" @click="handleQuickSettings">
                    <i class="bi bi-sliders"></i>
                    <span>Cài đặt nhanh</span>
                </button>
            </footer>
        </div>

        <SidebarFlyout
            v-if="flyoutPayload"
            :item="flyoutPayload.item"
            :icons="sidebarIcons"
            :anchor="flyoutPayload.anchor"
            :active-id="activeItemId"
            :active-trail="activeTrail"
            :expanded-ids="expandedItems"
            @navigate="handleNavigate"
            @hover-enter="cancelHoverCleanup"
            @hover-leave="scheduleHoverCleanup"
        />
    </aside>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from 'pinia'
import {useSidebarStore} from '@/store/sidebar'
import {useAuthStore} from '@/store/auth'
import {sidebarMenu} from '@/config/sidebar/menu'
import {sidebarIcons} from '@/config/sidebar/icons'
import SidebarItem from './sidebar/SidebarItem.vue'
import SidebarFlyout from './sidebar/SidebarFlyout.vue'

defineOptions({ name: 'Sidebar' })

const props = defineProps({
    isMobile: {
        type: Boolean,
        default: false
    }
})

const route = useRoute()
const sidebarStore = useSidebarStore()
const authStore = useAuthStore()
const rootRef = ref(null)

const { isCollapsed, activeItem, hoverItem, expandedItems } = storeToRefs(sidebarStore)

const userRoles = computed(() => authStore.userRoles ?? [])

const sections = computed(() => filterMenu(sidebarMenu, userRoles.value))
const flattenedItems = computed(() => flattenMenu(sections.value))

const activeItemId = computed(() => activeItem.value)
const activeTrail = ref([])

const displayCollapsed = computed(() => !props.isMobile && isCollapsed.value)

const flyoutPayload = computed(() => {
    if (!displayCollapsed.value) return null
    const current = hoverItem.value
    if (!current || !current.item?.children?.length) return null
    return current
})

const handleToggle = (id) => {
    sidebarStore.toggleExpandedItem(id)
}

const handleNavigate = ({ id }) => {
    if (id) {
        sidebarStore.setActiveItem(id)
    }
    sidebarStore.clearHoverItem()
    if (props.isMobile) {
        sidebarStore.closeMobile()
    }
}

const hoverCleanupTimer = ref(null)

const cancelHoverCleanup = () => {
    if (hoverCleanupTimer.value) {
        window.clearTimeout(hoverCleanupTimer.value)
        hoverCleanupTimer.value = null
    }
}

const scheduleHoverCleanup = (payload) => {
    if (!displayCollapsed.value) return
    if (hoverItem.value && payload?.id && hoverItem.value.id !== payload.id) return
    cancelHoverCleanup()
    hoverCleanupTimer.value = window.setTimeout(() => {
        sidebarStore.clearHoverItem()
        hoverCleanupTimer.value = null
    }, payload?.delay ?? 140)
}

const handleHoverIntent = (payload) => {
    if (!displayCollapsed.value) return
    if (!payload?.item?.children?.length) return
    cancelHoverCleanup()
    sidebarStore.setHoverItem(payload)
}

const handleHoverLeave = (payload) => {
    if (!displayCollapsed.value) return
    scheduleHoverCleanup(payload)
}

const handleQuickSettings = () => {
    // Placeholder for quick settings action hook
}

const toggleCollapsed = () => {
    sidebarStore.toggleCollapsed()
    sidebarStore.clearHoverItem()
}

const handlePointerDown = (event) => {
    if (!displayCollapsed.value) return
    if (!rootRef.value) return
    if (rootRef.value.contains(event.target)) return
    sidebarStore.clearHoverItem()
}

const handleGlobalScroll = () => {
    if (!displayCollapsed.value) return
    sidebarStore.clearHoverItem()
}

const syncActiveFromRoute = () => {
    const match = findActiveMatch(sections.value, route.path)
    if (match) {
        sidebarStore.setActiveItem(match.id)
        sidebarStore.ensureExpanded(match.parents, {persist: false})
        activeTrail.value = match.parents
    } else {
        sidebarStore.setActiveItem(null)
        activeTrail.value = []
    }
    sidebarStore.clearHoverItem()
}

watch(() => route.fullPath, () => {
    syncActiveFromRoute()
    if (props.isMobile) {
        sidebarStore.closeMobile()
    }
}, {immediate: true})

watch([sections, flattenedItems], () => {
    const validIds = new Set(flattenedItems.value.map((item) => item.id))
    const pruned = expandedItems.value.filter((id) => validIds.has(id))
    if (pruned.length !== expandedItems.value.length) {
        sidebarStore.setExpandedItems(pruned)
    }
}, {deep: true})

watch(displayCollapsed, (isNowCollapsed) => {
    if (!isNowCollapsed) {
        cancelHoverCleanup()
        sidebarStore.clearHoverItem()
    }
})

watch(userRoles, () => {
    sidebarStore.setExpandedItems([], {persist: false})
    syncActiveFromRoute()
})

onMounted(() => {
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('scroll', handleGlobalScroll, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handlePointerDown)
    window.removeEventListener('scroll', handleGlobalScroll, true)
    cancelHoverCleanup()
})

function filterMenu(menu, roles) {
    return menu
        .map((section) => ({
            heading: section.heading,
            items: filterItems(section.items, roles)
        }))
        .filter((section) => section.items.length)
}

function filterItems(items, roles) {
    return items
        .map((item) => {
            if (!supportsRole(item, roles)) return null
            if (!item.children) return {...item}
            const children = filterItems(item.children, roles)
            if (!children.length && !item.to) return null
            return {
                ...item,
                children
            }
        })
        .filter(Boolean)
}

function supportsRole(item, roles) {
    if (!item.roles || !item.roles.length) return true
    return item.roles.some((role) => roles.includes(role))
}

function flattenMenu(sectionsInput) {
    const result = []
    sectionsInput.forEach((section) => {
        walk(section.items, [])
    })
    function walk(items, parents) {
        items.forEach((item) => {
            result.push({...item, parents})
            if (item.children?.length) {
                walk(item.children, [...parents, item.id])
            }
        })
    }
    return result
}

function normalizePath(path) {
    if (!path) return null
    if (path === '/') return '/'
    return path.replace(/\/+$/, '')
}

function findActiveMatch(sectionsInput, currentPath) {
    const normalized = normalizePath(currentPath)
    if (!normalized) return null
    for (const section of sectionsInput) {
        const match = searchItems(section.items, [], normalized)
        if (match) return match
    }
    return null
}

function searchItems(items, parents, targetPath) {
    for (const item of items) {
        const nextParents = [...parents]
        if (item.children?.length) {
            nextParents.push(item.id)
        }
        const itemPath = normalizePath(item.to)
        if (itemPath && itemPath === targetPath) {
            return {
                id: item.id,
                parents
            }
        }
        if (item.children?.length) {
            const childMatch = searchItems(item.children, nextParents, targetPath)
            if (childMatch) {
                return childMatch
            }
        }
    }
    return null
}
</script>

<style scoped>
.neo-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    width: 278px;
    height: 100vh;
    border-radius: 0;
    border: none;
    border-right: 1px solid var(--color-border-strong, rgba(148, 163, 184, 0.28));
    background: var(--color-elevated);
    box-shadow: 0 0 0 rgba(15, 23, 42, 0);
    overflow: visible;
    transition: width 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.26s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s ease;
    z-index: 110;
}

.neo-sidebar.is-collapsed {
    width: 76px;
    box-shadow: 0 0 0 rgba(15, 23, 42, 0);
}

.neo-sidebar.is-mobile {
    position: fixed;
    inset: 0 auto 0 0;
    width: clamp(280px, 78vw, 340px);
    max-height: none;
    border-radius: 0;
    border-right: 1px solid var(--color-border-strong, rgba(148, 163, 184, 0.28));
    transform: translateX(-110%);
    box-shadow: 0 32px 90px rgba(15, 23, 42, 0.24);
}

.neo-sidebar.is-mobile.is-open {
    transform: translateX(0);
}

.neo-sidebar__inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.neo-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 1.1rem;
    gap: 0.75rem;
}

.neo-sidebar__brand {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    color: inherit;
}

.neo-sidebar__brand-icon {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    font-size: 1.32rem;
    color: var(--color-primary-contrast, #ffffff);
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
    box-shadow: 0 18px 36px rgba(79, 70, 229, 0.32);
}

.neo-sidebar__brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.4;
}

.neo-sidebar__brand-text strong {
    font-size: 1.09rem;
    font-weight: 700;
    color: var(--color-heading);
}

.neo-sidebar__brand-text small {
    font-size: 0.76rem;
    color: var(--color-text-subtle);
}

.neo-sidebar__collapse {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-size: 1.2rem;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.neo-sidebar__collapse:hover,
.neo-sidebar__collapse:focus-visible {
    background: var(--color-soft-primary);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.neo-sidebar__sections {
    flex: 1;
    overflow-y: auto;
    padding: 0.2rem 0.75rem 1.25rem;
}

.neo-sidebar.is-collapsed .neo-sidebar__sections {
    padding-inline: 0.35rem;
}

.neo-sidebar__section + .neo-sidebar__section {
    margin-top: 1.45rem;
}

.neo-sidebar__section-label {
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-subtle);
    margin: 0 0 0.65rem 0.45rem;
}

.neo-sidebar__items {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.neo-sidebar__footer {
    padding: 1.1rem 1.25rem 1.35rem;
    border-top: 1px solid var(--color-border);
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.08), transparent);
}

.neo-sidebar__quick {
    width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
    padding: 0.7rem 0.85rem;
    border-radius: 14px;
    border: 1px solid transparent;
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary);
    font-weight: 600;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.neo-sidebar__quick:hover,
.neo-sidebar__quick:focus-visible {
    background: rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.28);
}

.neo-sidebar::-webkit-scrollbar {
    width: 6px;
}

.neo-sidebar::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.35);
    border-radius: 3px;
}

.neo-sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.45);
}

@media (max-width: 992px) {
    .neo-sidebar {
        top: 0;
        left: 0;
        bottom: 0;
        height: 100vh;
        border-radius: 0;
        border-right: 1px solid var(--color-border-strong, rgba(148, 163, 184, 0.28));
    }

    .neo-sidebar__header {
        padding: 1.4rem 1.4rem 1.1rem;
    }

    .neo-sidebar__sections {
        padding: 0.35rem 1.1rem 1.75rem;
    }
}
</style>