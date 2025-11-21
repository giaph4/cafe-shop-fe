<template>
    <li
        ref="itemRef"
        :class="itemClasses"
        :style="itemStyles"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
    >
        <RouterLink
            v-if="item.to && !hasChildren"
            class="neo-item__link"
            :class="linkClasses"
            :to="item.to"
            role="menuitem"
            @click="emitNavigate"
            @keydown="handleKeydown"
        >
            <span v-if="resolvedIcon" class="neo-item__icon">
                <i :class="resolvedIcon" aria-hidden="true"></i>
            </span>
            <span v-if="!collapsed" class="neo-item__label">{{ item.label }}</span>
            <span v-if="badge && !collapsed" class="neo-item__badge">{{ badge }}</span>
            <span v-if="showTooltip" class="neo-item__tooltip" role="tooltip">{{ item.label }}</span>
        </RouterLink>
        <button
            v-else
            type="button"
            class="neo-item__link neo-item__link--button"
            :class="linkClasses"
            role="menuitem"
            @click="handleGroupClick"
            @keydown="handleKeydown"
        >
            <span v-if="resolvedIcon" class="neo-item__icon">
                <i :class="resolvedIcon" aria-hidden="true"></i>
            </span>
            <span v-if="!collapsed" class="neo-item__label">{{ item.label }}</span>
            <span v-if="badge && !collapsed" class="neo-item__badge">{{ badge }}</span>
            <i v-if="hasChildren && !collapsed" class="neo-item__caret bi" :class="caretClass"></i>
            <span v-if="showTooltip" class="neo-item__tooltip" role="tooltip">{{ item.label }}</span>
        </button>

        <transition name="neo-item-collapse">
            <ul v-if="shouldRenderChildren" class="neo-item__children" role="group">
                <SidebarItem
                    v-for="child in item.children"
                    :key="child.id"
                    :item="child"
                    :icons="icons"
                    :collapsed="collapsed"
                    :active-id="activeId"
                    :active-trail="activeTrail"
                    :expanded-ids="expandedIds"
                    :depth="depth + 1"
                    @toggle="$emit('toggle', $event)"
                    @navigate="$emit('navigate', $event)"
                    @hover-intent="$emit('hover-intent', $event)"
                    @hover-leave="$emit('hover-leave', $event)"
                />
            </ul>
        </transition>
    </li>
</template>

<script setup>
import {computed, ref, watch} from 'vue'
import {RouterLink} from 'vue-router'

defineOptions({ name: 'SidebarItem' })

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    icons: {
        type: Object,
        default: () => ({})
    },
    collapsed: {
        type: Boolean,
        default: false
    },
    activeId: {
        type: [String, Number, null],
        default: null
    },
    activeTrail: {
        type: Array,
        default: () => []
    },
    expandedIds: {
        type: Array,
        default: () => []
    },
    depth: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['toggle', 'navigate', 'hover-intent', 'hover-leave'])

const itemRef = ref(null)

const badge = computed(() => props.item.badge ?? null)
const hasChildren = computed(() => Array.isArray(props.item.children) && props.item.children.length > 0)
const resolvedIcon = computed(() => {
    const key = props.item.icon
    if (!key) return null
    if (props.icons && props.icons[key]) return props.icons[key]
    return key
})

const isActive = computed(() => props.activeId === props.item.id)
const isInTrail = computed(() => props.activeTrail.includes(props.item.id))
const isExpanded = computed(() => props.expandedIds.includes(props.item.id) || isInTrail.value)

const itemClasses = computed(() => ({
    'neo-item': true,
    'has-children': hasChildren.value,
    'is-active': isActive.value,
    'in-trail': isInTrail.value,
    'is-expanded': isExpanded.value,
    'is-collapsed': props.collapsed,
    [`depth-${props.depth}`]: true
}))

const itemStyles = computed(() => {
    if (props.collapsed) return null
    if (!props.depth) return null
    return {
        '--neo-item-depth': props.depth
    }
})

const linkClasses = computed(() => ({
    'is-active': isActive.value,
    'in-trail': isInTrail.value,
    'has-children': hasChildren.value,
    'is-collapsed': props.collapsed
}))

const caretClass = computed(() => (isExpanded.value ? 'bi-chevron-up' : 'bi-chevron-down'))
const shouldRenderChildren = computed(() => hasChildren.value && !props.collapsed && isExpanded.value)
const showTooltip = computed(() => props.collapsed)

const emitNavigate = (event) => {
    emit('navigate', { id: props.item.id, to: props.item.to, originalEvent: event })
}

const emitHoverIntent = () => {
    const el = itemRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    emit('hover-intent', {
        id: props.item.id,
        item: props.item,
        anchor: {
            top: rect.top + window.scrollY + rect.height / 2,
            left: rect.right + window.scrollX,
            width: rect.width,
            height: rect.height
        }
    })
}

const handleMouseEnter = () => {
    if (!props.collapsed) return
    if (!hasChildren.value) {
        emit('hover-leave', { id: props.item.id, delay: 0 })
        return
    }
    emitHoverIntent()
}

const handleMouseLeave = () => {
    if (!props.collapsed) return
    emit('hover-leave', { id: props.item.id, delay: 140 })
}

const handleGroupClick = () => {
    if (props.collapsed && hasChildren.value) {
        emitHoverIntent()
        return
    }
    emit('toggle', props.item.id)
}

const handleKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    if (props.item.to && !hasChildren.value) {
        emitNavigate(event)
        return
    }
    handleGroupClick()
}

watch(
    () => props.collapsed,
    (value) => {
        if (!value) {
            emit('hover-leave', { id: props.item.id, delay: 0 })
        }
    }
)
</script>

<style scoped>
.neo-item {
    position: relative;
    list-style: none;
}

.neo-item + .neo-item {
    margin-top: 0.12rem;
}

.neo-item__link {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.62rem 1rem;
    border-radius: 16px;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.94rem;
    line-height: 1.4;
    text-align: left;
    transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
    cursor: pointer;
}

.neo-item__link:is(a) {
    text-decoration: none;
}

.neo-item__link--button {
    width: 100%;
}

.neo-item__link:hover,
.neo-item__link:focus-visible {
    background: rgba(99, 102, 241, 0.12);
    color: var(--color-primary);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.12);
}

.neo-item__link.is-active {
    background: rgba(99, 102, 241, 0.16);
    color: var(--color-primary);
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.16), 0 12px 22px rgba(99, 102, 241, 0.18);
}

.neo-item.is-collapsed > .neo-item__link {
    justify-content: center;
    gap: 0;
    width: 56px;
    height: 56px;
    margin: 0.2rem auto;
    padding: 0;
}

.neo-item.is-collapsed > .neo-item__link .neo-item__label,
.neo-item.is-collapsed > .neo-item__link .neo-item__badge {
    display: none;
}

.neo-item__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    font-size: 1.1rem;
    color: inherit;
}

.neo-item__label {
    flex: 1;
    min-width: 0;
}

.neo-item__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    background: rgba(99, 102, 241, 0.14);
    color: var(--color-primary);
}

.neo-item__caret {
    margin-left: auto;
    font-size: 0.85rem;
    transition: transform 0.18s ease;
}

.neo-item.is-expanded .neo-item__caret {
    transform: rotate(-180deg);
}

.neo-item__tooltip {
    position: absolute;
    top: 50%;
    left: calc(100% + 6px);
    transform: translate(-4px, -50%) scale(0.94);
    transform-origin: left center;
    padding: 0.32rem 0.6rem;
    border-radius: 9px;
    background: rgba(15, 23, 42, 0.9);
    color: #f8fafc;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.22);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.16s ease, transform 0.16s ease;
    z-index: 44;
}

.neo-item.is-collapsed > .neo-item__link:hover .neo-item__tooltip,
.neo-item.is-collapsed > .neo-item__link:focus-visible .neo-item__tooltip {
    opacity: 1;
    transform: translate(0, -50%) scale(1);
}

.neo-item__children {
    margin: 0.2rem 0 0.35rem 1.05rem;
    padding-left: 0.95rem;
    border-left: 1.5px dashed rgba(148, 163, 184, 0.28);
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
}

.neo-item__children :deep(.neo-item__link) {
    padding: 0.55rem 0.9rem;
    border-radius: 12px;
}

.neo-item__children :deep(.neo-item__link.is-active) {
    background: rgba(99, 102, 241, 0.14);
}

.neo-item__children :deep(.neo-item__icon) {
    font-size: 1rem;
    opacity: 0.84;
}

.neo-item__children :deep(.neo-item__tooltip) {
    display: none;
}

.neo-item-collapse-enter-active,
.neo-item-collapse-leave-active {
    transition: max-height 0.18s ease, opacity 0.18s ease;
    overflow: hidden;
}

.neo-item-collapse-enter-from,
.neo-item-collapse-leave-to {
    max-height: 0;
    opacity: 0;
}

.neo-item-collapse-enter-to,
.neo-item-collapse-leave-from {
    max-height: 520px;
    opacity: 1;
}
</style>
