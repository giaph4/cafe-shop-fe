<template>
    <div class="page-container container-fluid settings-page" style="background: var(--color-body-bg); padding: var(--spacing-4);">
        <div class="settings-header">
            <div class="settings-header__content">
                <div class="settings-header__title-section">
                    <h2 class="settings-header__title">Cài đặt hệ thống</h2>
                    <p class="settings-header__subtitle">Quản lý cài đặt hệ thống, tài khoản và bảo mật.</p>
                </div>
                <div class="settings-header__actions">
                    <button class="btn btn-primary" type="button" @click="openSettingsModal">
                        <i class="bi bi-gear me-2"></i>
                        Mở cài đặt
                    </button>
                </div>
            </div>
        </div>

        <div class="settings-content">
            <div class="card">
                <div class="card-body">
                    <EmptyState
                        title="Cài đặt hệ thống"
                        message="Nhấn nút 'Mở cài đặt' ở trên để mở modal cài đặt và quản lý các tùy chọn hệ thống."
                    >
                        <template #icon>
                            <i class="bi bi-gear-fill"></i>
                        </template>
                        <template #action>
                            <button class="btn btn-primary" type="button" @click="openSettingsModal">
                                <i class="bi bi-gear me-2"></i>
                                Mở cài đặt
                            </button>
                        </template>
                    </EmptyState>
                </div>
            </div>
        </div>

        <Teleport to="body">
            <SettingsModal v-model="showModal" />
        </Teleport>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Teleport } from 'vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const showModal = ref(false)

const openSettingsModal = () => {
    showModal.value = true
}
</script>

<style scoped lang="scss">
.settings-page {
    padding-bottom: var(--spacing-12);
}

.settings-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.settings-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.settings-header__title-section {
    flex: 1;
    min-width: 0;
}

.settings-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.settings-header__subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    font-family: var(--font-family-sans);
}

.settings-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    align-items: center;
    justify-content: flex-end;
}

.settings-header__actions .btn {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
}

.settings-header__actions .btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.settings-header__actions .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark);
}

.settings-content .card {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.settings-content .card-body {
    padding: var(--spacing-4);
    background: var(--color-card);
}

@media (max-width: 768px) {
    .settings-header {
        padding: var(--spacing-4);
    }

    .settings-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .settings-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>

