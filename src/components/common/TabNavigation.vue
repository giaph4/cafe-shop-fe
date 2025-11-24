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
    margin-bottom: 1.5rem;
}

.tab-navigation .nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    border-bottom: 2px solid var(--color-border-soft);
    padding-bottom: 0.5rem;
}

.tab-navigation .nav-link {
    border-radius: 999px;
    padding: 0.65rem 1.25rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: rgba(148, 163, 184, 0.12);
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
}

.tab-navigation .nav-link:hover:not(:disabled) {
    color: var(--color-primary);
    background: rgba(99, 102, 241, 0.08);
}

.tab-navigation .nav-link.active {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #fff;
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.25);
}

.tab-navigation .nav-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-navigation .badge {
    background: rgba(255, 255, 255, 0.2);
    color: inherit;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
}

.tab-navigation .nav-link.active .badge {
    background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
    .tab-navigation .nav {
        gap: 0.5rem;
    }
    
    .tab-navigation .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }
}
</style>

