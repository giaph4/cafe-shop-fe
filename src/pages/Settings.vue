<template>
    <div class="page-container container-fluid settings-page" data-aos="fade-up">
        <div class="settings-header">
            <div class="settings-header__content">
                <div class="settings-header__title-section">
                    <h2 class="page-title">Cài đặt hệ thống</h2>
                    <p class="page-subtitle">Quản lý cài đặt hệ thống, tài khoản và bảo mật.</p>
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
                    <div class="d-flex flex-column align-items-center justify-content-center py-5">
                        <i class="bi bi-gear-fill fs-1 text-muted mb-3"></i>
                        <h5 class="mb-2">Cài đặt hệ thống</h5>
                        <p class="text-muted text-center mb-4">
                            Nhấn nút "Mở cài đặt" ở trên để mở modal cài đặt và quản lý các tùy chọn hệ thống.
                        </p>
                        <button class="btn btn-primary" type="button" @click="openSettingsModal">
                            <i class="bi bi-gear me-2"></i>
                            Mở cài đặt
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <SettingsModal v-model="showModal" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'

const showModal = ref(false)

const openSettingsModal = () => {
    showModal.value = true
}
</script>

<style scoped lang="scss">
.settings-page {
    padding-bottom: 3rem;
}

.settings-header {
    background: #ffffff;
    background: linear-gradient(165deg, #ffffff, rgba(255, 255, 255, 0.95));
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
    margin-bottom: 1.5rem;
    padding: 1.5rem;
}

.settings-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.settings-header__title-section {
    flex: 1;
    min-width: 0;
}

.settings-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: 700;
    color: var(--color-heading, #1e293b);
    margin-bottom: 0.25rem;
    font-size: 1.5rem;
    line-height: 1.3;
}

.page-subtitle {
    margin-bottom: 0;
    color: var(--color-text-muted, #64748b);
    font-size: 0.9rem;
    line-height: 1.5;
}

.settings-content {
    .card {
        border-radius: 18px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    }
}
</style>

