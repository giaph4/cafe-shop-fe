<template>
    <div class="settings-page page-container" data-aos="fade-up">
        <!-- Header -->
        <header class="settings-header">
            <div class="settings-header__content">
                <div class="settings-header__title-section">
                    <h1 class="settings-header__title">
                        <i class="bi bi-gear-fill me-2"></i>
                        Cài đặt hệ thống
                    </h1>
                    <p class="settings-header__subtitle">
                        Quản lý cài đặt hệ thống, tài khoản, bảo mật và tùy chỉnh giao diện
                    </p>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="settings-layout">
            <!-- Sidebar Navigation -->
            <aside class="settings-sidebar" :class="{ 'is-mobile-open': mobileMenuOpen }">
                <nav class="settings-nav">
                    <button
                        v-for="section in sections"
                        :key="section.id"
                        class="settings-nav__item"
                        :class="{ 'settings-nav__item--active': activeSection === section.id }"
                        @click="setActiveSection(section.id)"
                    >
                        <i :class="`bi ${section.icon} settings-nav__icon`"></i>
                        <span class="settings-nav__label">{{ section.label }}</span>
                        <span v-if="section.badge" class="settings-nav__badge">{{ section.badge }}</span>
                    </button>
                </nav>
            </aside>

            <!-- Content Area -->
            <main class="settings-content">
                <div class="settings-content__inner">
                    <!-- General Settings -->
                    <SettingsGeneral v-if="activeSection === 'general'" />

                    <!-- Appearance Settings -->
                    <SettingsAppearance v-if="activeSection === 'appearance'" />

                    <!-- Account Settings -->
                    <SettingsAccount v-if="activeSection === 'account'" />

                    <!-- Security Settings -->
                    <SettingsSecurity v-if="activeSection === 'security'" />

                    <!-- Notifications Settings -->
                    <SettingsNotifications v-if="activeSection === 'notifications'" />

                    <!-- Advanced Settings -->
                    <SettingsAdvanced v-if="activeSection === 'advanced'" />
                </div>
            </main>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
            class="settings-mobile-toggle"
            @click="mobileMenuOpen = !mobileMenuOpen"
            aria-label="Toggle settings menu"
        >
            <i class="bi" :class="mobileMenuOpen ? 'bi-x-lg' : 'bi-list'"></i>
        </button>

        <!-- Mobile Backdrop -->
        <div
            v-if="mobileMenuOpen"
            class="settings-mobile-backdrop"
            @click="mobileMenuOpen = false"
        ></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsGeneral from '@/components/settings/SettingsGeneral.vue'
import SettingsAppearance from '@/components/settings/SettingsAppearance.vue'
import SettingsAccount from '@/components/settings/SettingsAccount.vue'
import SettingsSecurity from '@/components/settings/SettingsSecurity.vue'
import SettingsNotifications from '@/components/settings/SettingsNotifications.vue'
import SettingsAdvanced from '@/components/settings/SettingsAdvanced.vue'

const route = useRoute()
const router = useRouter()

const activeSection = ref('general')
const mobileMenuOpen = ref(false)

const sections = [
    {
        id: 'general',
        label: 'Chung',
        icon: 'bi-sliders',
        description: 'Cài đặt cơ bản hệ thống'
    },
    {
        id: 'appearance',
        label: 'Giao diện',
        icon: 'bi-palette',
        description: 'Tùy chỉnh theme và màu sắc'
    },
    {
        id: 'account',
        label: 'Tài khoản',
        icon: 'bi-person-circle',
        description: 'Thông tin tài khoản cá nhân'
    },
    {
        id: 'security',
        label: 'Bảo mật',
        icon: 'bi-shield-lock',
        description: 'Mật khẩu và bảo mật'
    },
    {
        id: 'notifications',
        label: 'Thông báo',
        icon: 'bi-bell',
        description: 'Cài đặt thông báo'
    },
    {
        id: 'advanced',
        label: 'Nâng cao',
        icon: 'bi-gear-wide-connected',
        description: 'Cài đặt nâng cao hệ thống'
    }
]

const setActiveSection = (sectionId) => {
    activeSection.value = sectionId
    mobileMenuOpen.value = false
    // Update URL without navigation
    router.replace({ query: { section: sectionId } }).catch(() => {})
}

// Sync with URL query
onMounted(() => {
    const sectionFromQuery = route.query.section
    if (sectionFromQuery && sections.some(s => s.id === sectionFromQuery)) {
        activeSection.value = sectionFromQuery
    }
})

// Close mobile menu on escape
const handleEscape = (e) => {
    if (e.key === 'Escape' && mobileMenuOpen.value) {
        mobileMenuOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.settings-page {
    background: linear-gradient(135deg, var(--color-body-bg) 0%, var(--color-surface-muted) 100%);
    min-height: calc(100vh - var(--spacing-16, 4rem));
    padding: var(--spacing-6) var(--spacing-4);
    position: relative;
}

.settings-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(135deg, var(--color-soft-primary) 0%, transparent 100%);
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
}

.settings-page > * {
    position: relative;
    z-index: 1;
}

/* Header */
.settings-header {
    margin-bottom: var(--spacing-8);
    padding: var(--spacing-6);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(10px);
    background: linear-gradient(135deg, var(--color-card) 0%, var(--color-card-muted) 100%);
}

.settings-header__content {
    max-width: 100%;
}

.settings-header__title-section {
    margin-bottom: 0;
}

.settings-header__title {
    font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-3xl));
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 var(--spacing-2) 0;
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    font-family: var(--font-family-sans);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.settings-header__title i {
    background: var(--color-soft-primary);
    padding: var(--spacing-2);
    border-radius: var(--radius-base);
    color: var(--color-primary);
    -webkit-text-fill-color: var(--color-primary);
    font-size: 1.2em;
}

.settings-header__subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin: 0;
    line-height: var(--line-height-relaxed);
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-medium);
}

/* Layout */
.settings-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--spacing-6);
    max-width: 1400px;
    margin: 0 auto;
}

/* Sidebar */
.settings-sidebar {
    position: sticky;
    top: var(--spacing-4);
    height: fit-content;
    max-height: calc(100vh - var(--spacing-20));
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar) transparent;
}

.settings-sidebar::-webkit-scrollbar {
    width: 6px;
}

.settings-sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.settings-sidebar::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar);
    border-radius: var(--radius-full);
}

.settings-nav {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-3);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(10px);
}

.settings-nav__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    border: none;
    background: transparent;
    border-radius: var(--radius-base);
    color: var(--color-text);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    width: 100%;
    position: relative;
    overflow: hidden;
}

.settings-nav__item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(90deg, var(--color-primary) 0%, transparent 100%);
    transition: width 0.3s ease;
    opacity: 0.1;
}

.settings-nav__item:hover {
    background: var(--color-card-muted);
    color: var(--color-primary);
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
}

.settings-nav__item:hover::before {
    width: 100%;
}

.settings-nav__item--active {
    background: linear-gradient(135deg, var(--color-soft-primary) 0%, var(--color-card-muted) 100%);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border-contrast);
}

.settings-nav__item--active::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 70%;
    background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    box-shadow: 0 0 8px rgba(var(--color-primary-rgb, 13, 110, 253), 0.4);
}

.settings-nav__icon {
    font-size: var(--font-size-lg);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: all 0.2s ease;
}

.settings-nav__item:hover .settings-nav__icon,
.settings-nav__item--active .settings-nav__icon {
    background: var(--color-soft-primary);
    color: var(--color-primary);
    transform: scale(1.1);
}

.settings-nav__label {
    flex: 1;
    min-width: 0;
    transition: all 0.2s ease;
}

.settings-nav__badge {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: var(--color-text-inverse);
    font-size: var(--font-size-xs);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    min-width: 22px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb, 13, 110, 253), 0.2);
}

/* Content */
.settings-content {
    min-width: 0;
}

.settings-content__inner {
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-8);
    min-height: 500px;
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(10px);
    animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Mobile Toggle */
.settings-mobile-toggle {
    display: none;
    position: fixed;
    bottom: var(--spacing-6);
    right: var(--spacing-6);
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: var(--color-text-inverse);
    border: none;
    box-shadow: 0 4px 20px rgba(var(--color-primary-rgb, 13, 110, 253), 0.4), var(--shadow-lg);
    cursor: pointer;
    z-index: 1000;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-mobile-toggle:hover {
    background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 6px 25px rgba(var(--color-primary-rgb, 13, 110, 253), 0.6);
}

.settings-mobile-toggle:active {
    transform: scale(0.95);
}

.settings-mobile-backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
}

/* Responsive */
@media (max-width: 992px) {
    .settings-layout {
        grid-template-columns: 1fr;
        gap: var(--spacing-4);
    }

    .settings-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: 280px;
        height: 100vh;
        z-index: 999;
        transform: translateX(-100%);
        transition: transform var(--transition-base);
        background: var(--color-card);
        border-right: 1px solid var(--color-border);
        border-radius: 0;
        padding: var(--spacing-4);
        overflow-y: auto;
    }

    .settings-sidebar.is-mobile-open {
        transform: translateX(0);
    }

    .settings-mobile-toggle {
        display: flex;
    }

    .settings-mobile-backdrop {
        display: block;
    }

    .settings-content__inner {
        padding: var(--spacing-4);
    }
}

@media (max-width: 576px) {
    .settings-page {
        padding: var(--spacing-3);
    }

    .settings-header__title {
        font-size: var(--font-size-xl);
    }

    .settings-content__inner {
        padding: var(--spacing-3);
    }

    .settings-sidebar {
        width: 100%;
        max-width: 320px;
    }
}
</style>