<template>
    <Teleport to="body">
        <div
            v-if="shouldRender"
            class="neo-flyout"
            :style="flyoutStyle"
            role="dialog"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
        >
            <header class="neo-flyout__header">
                <span v-if="resolvedIcon" class="neo-flyout__icon">
                    <i :class="resolvedIcon" aria-hidden="true"></i>
                </span>
                <div class="neo-flyout__meta">
                    <strong>{{ item.label }}</strong>
                    <small v-if="item.description">{{ item.description }}</small>
                </div>
            </header>
            <div class="neo-flyout__content">
                <ul class="neo-flyout__list" role="menu">
                    <SidebarItem
                        v-for="child in item.children"
                        :key="child.id"
                        :item="child"
                        :icons="icons"
                        :collapsed="false"
                        :active-id="activeId"
                        :active-trail="derivedActiveTrail"
                        :expanded-ids="derivedExpandedIds"
                        :depth="1"
                        @toggle="$emit('toggle', $event)"
                        @navigate="handleNavigate"
                        @hover-intent="$emit('hover-intent', $event)"
                        @hover-leave="$emit('hover-leave', $event)"
                    />
                </ul>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {computed, toRefs} from 'vue'
import SidebarItem from './SidebarItem.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    icons: {
        type: Object,
        default: () => ({})
    },
    anchor: {
        type: Object,
        required: true
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
    }
})

const emit = defineEmits(['navigate', 'hover-enter', 'hover-leave', 'toggle', 'hover-intent'])

const { item, anchor } = toRefs(props)

const resolvedIcon = computed(() => {
    const key = item.value.icon
    if (!key) return null
    if (props.icons && props.icons[key]) return props.icons[key]
    return key
})

const flyoutStyle = computed(() => {
    const offset = 12
    const top = Math.max(16, anchor.value.top - (item.value.children?.length ? 24 : 0))
    const left = anchor.value.left + offset
    return {
        top: `${top}px`,
        left: `${left}px`
    }
})

const shouldRender = computed(() => Array.isArray(item.value.children) && item.value.children.length > 0)

const derivedActiveTrail = computed(() => props.activeTrail?.length ? props.activeTrail : (item.value.children?.map((child) => child.id) ?? []))
const derivedExpandedIds = computed(() => props.expandedIds?.length ? props.expandedIds : derivedActiveTrail.value)

const handleMouseEnter = () => {
    emit('hover-enter', { id: item.value.id })
}

const handleMouseLeave = () => {
    emit('hover-leave', { id: item.value.id, delay: 160 })
}

const handleNavigate = (payload) => {
    emit('navigate', payload)
}
</script>

<style scoped>
.neo-flyout {
    position: absolute;
    min-width: clamp(220px, 24vw, 280px);
    max-width: clamp(260px, 32vw, 320px);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: var(--spacing-4);
    z-index: 999;
    animation: flyout-fade-in 0.16s ease;
}

.neo-flyout__header {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 0.85rem;
}

.neo-flyout__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    font-size: 1.2rem;
}

.neo-flyout__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.neo-flyout__meta strong {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    color: var(--color-heading);
}

.neo-flyout__meta small {
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
    color: var(--color-text-muted);
}

.neo-flyout__content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.neo-flyout__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.neo-flyout__list :deep(.neo-item__link) {
    border-radius: var(--radius-sm);
}

@keyframes flyout-fade-in {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
