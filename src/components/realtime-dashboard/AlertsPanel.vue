<template>
    <div class="alerts-panel">
        <div v-if="alerts.length === 0" class="text-muted text-center">
            <i class="bi bi-check-circle-fill text-success mb-2" style="font-size: 2rem;"></i>
            <div>Không có cảnh báo</div>
        </div>
        <div v-else class="alerts-list">
            <div
                v-for="(alert, index) in alerts"
                :key="index"
                class="alert-item"
                :class="getAlertClass(alert.type)"
            >
                <div class="alert-icon">
                    <i :class="getAlertIcon(alert.type)"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">{{ alert.title }}</div>
                    <div class="alert-message">{{ alert.message }}</div>
                    <button
                        v-if="alert.action"
                        class="btn btn-flat btn-flat--outline btn-sm mt-2"
                        @click="$emit('action', alert)"
                    >
                        {{ alert.action }}
                    </button>
                </div>
                <div class="alert-count" v-if="alert.count > 0">
                    {{ alert.count }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    alerts: {
        type: Array,
        required: true,
        default: () => []
    }
})

defineEmits(['action'])

const getAlertClass = (type) => {
    const classes = {
        'critical': 'alert-critical',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }
    return classes[type] || 'alert-info'
}

const getAlertIcon = (type) => {
    const icons = {
        'critical': 'bi bi-exclamation-triangle-fill',
        'warning': 'bi bi-exclamation-circle-fill',
        'info': 'bi bi-info-circle-fill'
    }
    return icons[type] || 'bi bi-info-circle-fill'
}
</script>

<style scoped>
.alerts-panel {
    font-family: var(--font-family-sans);
}

.alerts-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.alert-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
    transition: all var(--transition-base);
    position: relative;
}

.alert-item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-border-strong);
}

.alert-critical {
    border-left: 3px solid var(--color-danger);
}

.alert-warning {
    border-left: 3px solid var(--color-warning);
}

.alert-info {
    border-left: 3px solid var(--color-info);
}

.alert-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.alert-critical .alert-icon {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.alert-warning .alert-icon {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.alert-info .alert-icon {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.alert-content {
    flex: 1;
    min-width: 0;
}

.alert-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.alert-message {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
}

.alert-count {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-danger);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}
</style>

