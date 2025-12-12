<template>
  <div class="staff-card card h-100">
    <div class="card-body">
      <div class="d-flex align-items-start gap-3">
        <div class="avatar-wrapper">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            class="avatar"
            :alt="staff.fullName || staff.username"
          >
          <div
            v-else
            class="avatar placeholder"
          >
            {{ initials }}
          </div>
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h5 class="mb-1">
                {{ staff.fullName || staff.username }}
              </h5>
              <p class="text-muted mb-1">
                @{{ staff.username }}
              </p>
            </div>
            <span :class="['status-badge', statusClass]">{{ staff.status }}</span>
          </div>
          <div class="text-muted small mb-2">
            <div v-if="staff.phone">
              {{ staff.phone }}
            </div>
            <div>{{ staff.email || 'Chưa có email' }}</div>
          </div>
          <div class="d-flex flex-wrap gap-1">
            <span
              v-for="role in staff.roles"
              :key="role.id"
              class="badge bg-soft"
            >
              {{ formatRole(role.name) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="card-footer d-flex justify-content-between align-items-center gap-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary"
        @click="$emit('detail', staff)"
      >
        <i class="bi bi-eye me-1" />Chi tiết
      </button>
      <div class="btn-group btn-group-sm">
        <button
          type="button"
          class="btn btn-outline-secondary"
          @click="$emit('edit', staff)"
        >
          <i class="bi bi-pencil" />
        </button>
        <button
          type="button"
          class="btn btn-outline-dark"
          @click="$emit('history', staff)"
        >
          <i class="bi bi-clock-history" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
            return 'status-badge--active'
        case 'INACTIVE':
            return 'status-badge--inactive'
        default:
            return 'status-badge--neutral'
    }
})

const formatRole = (roleName) => {
    if (!roleName) return '—'
    return roleName.replace('ROLE_', '').toLowerCase().replace(/(^|\s)\w/g, (s) => s.toUpperCase())
}
</script>

<style scoped>
.staff-card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
    height: 100%;
}

.staff-card:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.staff-card :global(h5) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.staff-card :global(.text-muted) {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-family: var(--font-family-sans);
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
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border);
}

.avatar.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    border: 2px solid var(--color-border);
}

.badge.bg-soft {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

/* Trạng thái nhân viên trên card - Flat Design */
.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.status-badge--active {
    background: var(--color-soft-emerald);
    color: var(--color-success);
    border: 1px solid var(--color-success);
}

.status-badge--inactive {
    background: var(--color-soft-rose);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

.status-badge--neutral {
    background: var(--color-card-muted);
    color: var(--color-heading);
    border: 1px solid var(--color-border);
}

.card-footer {
    background: var(--color-card);
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-3) var(--spacing-4);
}

.card-footer .btn {
    font-size: var(--font-size-sm);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-weight: var(--font-weight-medium);
    line-height: var(--line-height-normal);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.card-footer .btn i {
    font-size: 18px;
    line-height: 1;
}

.card-footer .btn-outline-primary {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.card-footer .btn-outline-primary:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.card-footer .btn-outline-secondary,
.card-footer .btn-outline-dark {
    border-color: var(--color-border);
    color: var(--color-heading);
    background: transparent;
}

.card-footer .btn-outline-secondary:hover:not(:disabled),
.card-footer .btn-outline-dark:hover:not(:disabled) {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}
</style>
