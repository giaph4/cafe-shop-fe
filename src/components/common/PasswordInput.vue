<template>
    <div class="password-input-wrapper">
        <input
            :type="showPassword ? 'text' : 'password'"
            :class="inputClass"
            :id="id"
            :name="name"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :autocomplete="autocomplete"
            @input="$emit('update:modelValue', $event.target.value)"
            @blur="$emit('blur', $event)"
            @focus="$emit('focus', $event)"
        />
        <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
            tabindex="0"
            :disabled="disabled"
        >
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    inputClass: {
        type: [String, Object],
        default: 'form-control'
    },
    id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    },
    disabled: {
        type: Boolean,
        default: false
    },
    autocomplete: {
        type: String,
        default: 'current-password'
    }
})

defineEmits(['update:modelValue', 'blur', 'focus'])

const showPassword = ref(false)
</script>

<style scoped>
.password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.password-input-wrapper input {
    padding-right: calc(var(--spacing-10, 2.5rem) + var(--spacing-2, 0.5rem));
}

.password-toggle {
    position: absolute;
    right: var(--spacing-3, 0.75rem);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-2, 0.5rem);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-base, 0.2s ease), background-color var(--transition-base, 0.2s ease);
    z-index: 1;
    border-radius: var(--radius-sm, 0.25rem);
}

.password-toggle:hover:not(:disabled) {
    color: var(--color-primary);
    background: var(--color-card-muted);
}

.password-toggle:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.password-toggle i {
    font-size: var(--font-size-lg, 1.125rem);
    line-height: 1;
}
</style>
