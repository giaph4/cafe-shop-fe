<template>
  <div
    class="tab-navigation"
    :class="containerClass"
  >
    <ul
      class="nav nav-pills"
      role="tablist"
    >
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
          <i
            v-if="tab.icon"
            :class="[tab.icon, 'me-2']"
          />
          {{ tab.label }}
          <span
            v-if="tab.badge"
            class="badge ms-2"
          >{{ tab.badge }}</span>
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
        validator: (tabs) => tabs.every(tab => tab.key && tab.label)
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
    gap: var(--spacing-2);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0;
}

.tab-navigation .nav-link {
    border-radius: var(--radius-sm);
    padding: var(--spacing-2) var(--spacing-4);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    background: transparent;
    transition: all var(--transition-base);
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.tab-navigation .nav-link:hover:not(:disabled) {
    color: var(--color-primary);
    background: var(--color-card-muted);
    border-bottom-color: var(--color-primary);
}

.tab-navigation .nav-link.active {
    background: var(--color-card-muted);
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.tab-navigation .nav-link.active:hover {
    background: var(--color-card-muted);
}

.tab-navigation .nav-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-navigation .badge {
    background: var(--color-card-muted);
    color: var(--color-heading);
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    font-family: var(--font-family-sans);
}

.tab-navigation .nav-link.active .badge {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    border-color: var(--color-primary);
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

