<template>
    <div class="staff-card card h-100">
        <div class="card-body">
            <div class="d-flex align-items-start gap-3">
                <div class="avatar-wrapper">
                    <img v-if="avatarUrl" :src="avatarUrl" class="avatar" :alt="staff.fullName || staff.username" />
                    <div v-else class="avatar placeholder">{{ initials }}</div>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <h5 class="mb-1">{{ staff.fullName || staff.username }}</h5>
                            <p class="text-muted mb-1">@{{ staff.username }}</p>
                        </div>
                        <span class="badge" :class="statusClass">{{ staff.status }}</span>
                    </div>
                    <div class="text-muted small mb-2">
                        <div v-if="staff.phone">{{ staff.phone }}</div>
                        <div>{{ staff.email || 'Chưa có email' }}</div>
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                        <span v-for="role in staff.roles" :key="role.id" class="badge bg-soft">
                            {{ formatRole(role.name) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer d-flex justify-content-between align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-primary" @click="$emit('detail', staff)">
                <i class="bi bi-eye me-1"></i>Chi tiết
            </button>
            <div class="btn-group btn-group-sm">
                <button type="button" class="btn btn-outline-secondary" @click="$emit('edit', staff)">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-outline-dark" @click="$emit('history', staff)">
                    <i class="bi bi-clock-history"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
    staff: {
        type: Object,
        required: true
    }
})

const avatarUrl = computed(() => props.staff.avatarUrl || '')

const initials = computed(() => {
    const source = props.staff.fullName || props.staff.username || ''
    return source
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join('') || 'NV'
})

const statusClass = computed(() => {
    switch (props.staff.status) {
        case 'ACTIVE':
            return 'bg-success'
        case 'INACTIVE':
            return 'bg-danger'
        default:
            return 'bg-secondary'
    }
})

const formatRole = (roleName) => {
    if (!roleName) return '—'
    return roleName.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase())
}
</script>

<style scoped>
.staff-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    color: var(--color-text);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.staff-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.avatar-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
}

.avatar {
    width: 100%;
    height: 100%;
    border-radius: var(--radius-full);
    object-fit: cover;
    border: 2px solid var(--color-border-soft);
}

.avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(129, 140, 248, 0.12));
    color: var(--color-primary);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
}

.badge.bg-soft {
    background: var(--color-badge-soft-bg);
    color: var(--color-badge-soft-text);
}

.card-footer {
    background: var(--color-card-muted);
}

.card-footer .btn-outline-secondary,
.card-footer .btn-outline-dark {
    border-color: var(--color-border);
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.02);
}

.card-footer .btn-outline-secondary:hover,
.card-footer .btn-outline-dark:hover {
    background: var(--color-soft-primary);
    color: var(--color-primary);
    border-color: var(--color-primary);
}
</style>
