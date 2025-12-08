<template>
    <div class="settings-section">
        <header class="settings-section__header">
            <div class="settings-section__title-group">
                <div class="settings-section__icon-wrapper">
                    <i class="bi bi-palette settings-section__icon"></i>
                </div>
                <div>
                    <h2 class="settings-section__title">Giao diện</h2>
                    <p class="settings-section__description">Tùy chỉnh theme, màu sắc và giao diện hệ thống</p>
                </div>
            </div>
        </header>

        <div class="settings-section__content">
            <!-- Theme Selector -->
            <div class="settings-item settings-item--full">
                <div class="settings-item__header">
                    <div class="settings-item__info">
                        <label class="settings-item__label">
                            <i class="bi bi-palette-fill me-2"></i>
                            Chọn giao diện
                        </label>
                        <p class="settings-item__description">
                            Chọn theme yêu thích của bạn. Thay đổi sẽ được áp dụng ngay lập tức.
                        </p>
                    </div>
                </div>
                <div class="settings-item__control settings-item__control--full">
                    <ThemeSelector />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import ThemeSelector from '@/components/common/ThemeSelector.vue'
</script>

<style scoped>
.settings-item--full {
    flex-direction: column;
    padding: var(--spacing-6);
}

.settings-item__control--full {
    width: 100%;
    min-width: auto;
    margin-top: var(--spacing-5);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--color-border);
}
</style>
