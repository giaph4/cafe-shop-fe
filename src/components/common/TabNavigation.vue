<template>
    <div class="tab-navigation" :class="containerClass">
        <ul class="nav nav-pills" role="tablist">
            <li
                v-for="tab in tabs"
                :key="tab.key"
                class="nav-item"
                role="presentation"
            >
                <button
                    type="button"
                    class="nav-link"
                    :class="{ active: modelValue === tab.key }"
                    :disabled="tab.disabled"
                    @click="handleTabClick(tab.key)"
                >
                    <i v-if="tab.icon" :class="[tab.icon, 'me-2']"></i>
                    {{ tab.label }}
                    <span v-if="tab.badge" class="badge ms-2">{{ tab.badge }}</span>
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup>
const props = defineProps({
    /**
     * Active tab key
     */
    modelValue: {
        type: String,
        required: true
    },
    /**
     * Array of tab objects
     * @type {Array<{key: string, label: string, icon?: string, disabled?: boolean, badge?: string|number}>}
     */
    tabs: {
        type: Array,
        required: true,
        validator: (tabs) => {
            return tabs.every(tab => tab.key && tab.label)
        }
    },
    /**
     * Container class
     */
    containerClass: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleTabClick = (tabKey) => {
    if (tabKey !== props.modelValue) {
        emit('update:modelValue', tabKey)
        emit('change', tabKey)
    }
}
</script>

<style scoped>
.tab-navigation {
    margin-bottom: var(--spacing-6);
}

.tab-navigation .nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    border-bottom: 2px solid var(--color-border-soft);
    padding-bottom: var(--spacing-2);
}

.tab-navigation .nav-link {
    border-radius: var(--radius-full);
    padding: var(--spacing-2) var(--spacing-5);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    transition: all var(--transition-fast);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
}

.tab-navigation .nav-link:hover:not(:disabled) {
    color: var(--color-primary);
    background: var(--color-primary-soft);
    transform: translateY(-1px);
}

.tab-navigation .nav-link.active {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    color: var(--color-primary-contrast);
    box-shadow: var(--shadow-md);
}

.tab-navigation .nav-link.active:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
}

.tab-navigation .nav-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-navigation .badge {
    background: rgba(255, 255, 255, 0.2);
    color: inherit;
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-medium);
}

.tab-navigation .nav-link.active .badge {
    background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
    .tab-navigation .nav {
        gap: var(--spacing-2);
    }
    
    .tab-navigation .nav-link {
        padding: var(--spacing-2) var(--spacing-4);
        font-size: var(--font-size-sm);
    }
}
</style>

