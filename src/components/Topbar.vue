<template>
    <header class="neo-nav" :class="{ 'neo-nav--scrolled': isScrolled }" :style="{ left: topbarLeft }">
        <div class="neo-nav__section neo-nav__section--left">
            <button
                class="neo-nav__icon neo-nav__icon--primary"
                type="button"
                :aria-label="sidebarAriaLabel"
                @click="toggleSidebar"
            >
                <i class="bi" :class="sidebarIcon"></i>
            </button>

            <div class="neo-nav__brand">
                <span class="neo-nav__brand-prefix">Trang hiện tại</span>
                <strong class="neo-nav__brand-title" :title="pageTitle">{{ pageTitle }}</strong>
            </div>
        </div>

        <div class="neo-nav__section neo-nav__section--center">
            <div class="neo-nav__search" role="search">
                <i class="bi bi-search"></i>
                <input
                    v-model="searchKeyword"
                    class="neo-nav__search-input"
                    type="search"
                    placeholder="Tìm kiếm nhanh..."
                    @keydown.enter.prevent="emitSearch"
                />
                <button v-if="searchKeyword" class="neo-nav__search-clear" type="button" @click="clearSearch">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        </div>

        <div class="neo-nav__section neo-nav__section--right">
            <div class="neo-nav__theme-dropdown" ref="themeDropdownRef">
                <button
                    class="neo-nav__icon"
                    type="button"
                    :title="`Theme hiện tại: ${currentThemeInfo.label}`"
                    @click="toggleThemeDropdown"
                >
                    <i class="bi" :class="currentThemeInfo.icon"></i>
                </button>
                <div
                    v-if="themeDropdownOpen"
                    class="neo-nav__theme-menu"
                    @click.stop
                >
                    <ThemeSelector />
                </div>
            </div>

            <button class="neo-nav__icon" type="button" aria-label="Thông báo">
                <span class="neo-nav__icon-indicator"></span>
                <i class="bi bi-bell"></i>
            </button>

            <button
                class="neo-nav__icon"
                type="button"
                :title="calculatorOpen ? 'Đóng máy tính' : 'Mở máy tính (Ctrl+M)'"
                aria-label="Máy tính"
                @click="toggleCalculator"
            >
                <i class="bi bi-calculator"></i>
            </button>

            <div class="neo-nav__profile" :class="{ 'is-open': profileMenuOpen }">
                <button class="neo-nav__profile-trigger" type="button" @click="toggleProfileMenu" aria-haspopup="menu" :aria-expanded="profileMenuOpen">
                    <img :src="avatarUrl" alt="Avatar"/>
                    <div class="neo-nav__profile-info">
                        <span>Xin chào</span>
                        <strong>{{ displayName }}</strong>
                    </div>
                    <i class="bi bi-chevron-down"></i>
                </button>

                <div v-if="profileMenuOpen" class="neo-nav__profile-menu" role="menu">
                    <button class="neo-nav__profile-item" type="button" role="menuitem" @click="goToProfile">
                        <i class="bi bi-person-circle"></i>
                        <span>Hồ sơ</span>
                    </button>
                    <button class="neo-nav__profile-item" type="button" role="menuitem">
                        <i class="bi bi-gear"></i>
                        <span>Cài đặt</span>
                    </button>
                    <hr class="neo-nav__profile-divider"/>
                    <button class="neo-nav__profile-item neo-nav__profile-item--danger" type="button" role="menuitem" @click="handleLogout">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <CalculatorPanel
        v-model="calculatorOpen"
        @calculate:completed="handleCalculatorCompleted"
    />
</template>
<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/store/auth'
import {useSettingsStore} from '@/store/settings'
import {storeToRefs} from 'pinia'
import {
    getStoredTheme,
    applyThemeClass,
    persistTheme,
    normalizeTheme,
    resolveInitialTheme,
    THEME_METADATA
} from '@/utils/theme'
import CalculatorPanel from '@/components/CalculatorPanel.vue'
import ThemeSelector from '@/components/common/ThemeSelector.vue'

const emit = defineEmits(['toggleSidebar', 'search'])

const props = defineProps({
    isSidebarCollapsed: Boolean
})

const sidebarWidth = computed(() => props.isSidebarCollapsed ? 76 : 278)
const topbarLeft = computed(() => `${sidebarWidth.value}px`)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { currentTheme } = storeToRefs(settingsStore)

const searchKeyword = ref('')
const profileMenuOpen = ref(false)
const profileRef = ref(null)
const isScrolled = ref(false)
const calculatorOpen = ref(false)
const themeDropdownOpen = ref(false)
const themeDropdownRef = ref(null)

const currentThemeInfo = computed(() => {
    const meta = THEME_METADATA[currentTheme.value]
    return meta || { icon: 'bi-palette', label: 'Theme' }
})

const pageTitle = computed(() => route.meta?.breadcrumb || route.meta?.title || route.name || 'Trang chính')
const displayName = computed(() => authStore.user?.fullName || authStore.user?.username || 'Người dùng')
const avatarUrl = computed(() => authStore.user?.avatar || 'https://i.pravatar.cc/80')

const sidebarIcon = computed(() => (props.isSidebarCollapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'))
const sidebarAriaLabel = computed(() => (props.isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'))

const toggleSidebar = () => {
    emit('toggleSidebar')
}

const emitSearch = () => {
    emit('search', searchKeyword.value.trim())
}

const clearSearch = () => {
    searchKeyword.value = ''
    emitSearch()
}

const handleLogout = () => {
    authStore.logout()
    profileMenuOpen.value = false
}

const applyTheme = (theme) => {
    settingsStore.setTheme(theme)
}

const toggleThemeDropdown = () => {
    themeDropdownOpen.value = !themeDropdownOpen.value
}

const closeThemeDropdown = (event) => {
    if (themeDropdownRef.value && !themeDropdownRef.value.contains(event.target)) {
        themeDropdownOpen.value = false
    }
}

const toggleProfileMenu = () => {
    profileMenuOpen.value = !profileMenuOpen.value
}

const goToProfile = () => {
    profileMenuOpen.value = false
    router.push({name: 'Hồ sơ cá nhân'})
}

const toggleCalculator = () => {
    calculatorOpen.value = !calculatorOpen.value
}

import logger from '@/utils/logger'

const handleCalculatorCompleted = (data) => {
    logger.log('Calculator completed:', data)
    // Có thể emit event hoặc gọi API ở đây
    // emit('calculator:completed', data)
}

const closeProfileMenu = (event) => {
    if (!profileMenuOpen.value) return
    if (profileRef.value && !profileRef.value.contains(event.target)) {
        profileMenuOpen.value = false
    }
}

const handleScroll = () => {
    isScrolled.value = window.scrollY > 8
}

const handleEscape = (event) => {
    if (event.key === 'Escape') {
        profileMenuOpen.value = false
        themeDropdownOpen.value = false
    }
}

const handleStorage = (event) => {
    if (event.key === 'app-theme' && event.newValue) {
        applyTheme(event.newValue)
    }
}

const handleSystemPreference = (event) => {
    const stored = getStoredTheme()
    if (stored) return
    applyTheme(event.matches ? 'dark-theme' : 'light-theme')
}

onMounted(() => {
    window.addEventListener('storage', handleStorage)
    window.addEventListener('pointerdown', closeProfileMenu)
    window.addEventListener('pointerdown', closeThemeDropdown)
    window.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, {passive: true})
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (media) {
        media.addEventListener('change', handleSystemPreference)
        if (!getStoredTheme()) {
            applyTheme(media.matches ? 'dark-theme' : 'light-theme')
        }
    }
    handleScroll()
})

onBeforeUnmount(() => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('pointerdown', closeProfileMenu)
    window.removeEventListener('pointerdown', closeThemeDropdown)
    window.removeEventListener('keydown', handleEscape)
    window.removeEventListener('scroll', handleScroll)
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    media?.removeEventListener('change', handleSystemPreference)
})

watch(
    () => route.fullPath,
    () => {
        profileMenuOpen.value = false
        themeDropdownOpen.value = false
    }
)

watch(
    () => currentTheme.value,
    () => {
        themeDropdownOpen.value = false
    }
)
</script>

<style scoped>
:global(:root) {
    --nav-height: 72px;
    --nav-padding-x: clamp(1.2rem, 2vw, 2rem);
    --nav-gap: 1.25rem;
}

.neo-nav {
    position: fixed;
    top: 0;
    right: 0;
    left: 278px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--nav-gap);
    min-height: var(--nav-height);
    padding: 0.75rem var(--nav-padding-x);
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--color-border-strong, rgba(148, 163, 184, 0.28));
    background: var(--color-elevated);
    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.1);
    backdrop-filter: blur(20px);
    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    left 0.26s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 120;
}

.neo-nav--scrolled {
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.14);
    border-color: rgba(44, 120, 115, 0.2);
}

.neo-nav__section {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
}

.neo-nav__section--center {
    justify-content: center;
}

.neo-nav__section--right {
    justify-content: flex-end;
    gap: 0.8rem;
}

.neo-nav__icon {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    display: grid;
    place-items: center;
    color: var(--color-text-muted);
    font-size: 1.18rem;
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.neo-nav__icon:hover,
.neo-nav__icon:focus-visible {
    background: rgba(44, 120, 115, 0.12);
    border-color: rgba(44, 120, 115, 0.3);
    color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(44, 120, 115, 0.15);
}

.neo-nav__icon--primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
}

.neo-nav__icon--primary:hover,
.neo-nav__icon--primary:focus-visible {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
    color: var(--color-text-inverse);
    transform: translateY(-1px);
}

.neo-nav__icon-indicator {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.18);
}

.neo-nav__brand {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
}

.neo-nav__brand-prefix {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-text-subtle);
}

.neo-nav__brand-title {
    font-size: clamp(1.05rem, 1.4vw, 1.25rem);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.neo-nav__search {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    width: clamp(220px, 40vw, 420px);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    transition: border-color 0.18s ease, outline 0.18s ease;
}

.neo-nav__search:focus-within {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
}

.neo-nav__search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    outline: none;
}

.neo-nav__search-clear {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 1.05rem;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: color 0.18s ease;
}

.neo-nav__search-clear:hover {
    color: var(--color-primary);
}

.neo-nav__profile {
    position: relative;
}

.neo-nav__profile-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.35rem 0.55rem;
    border-radius: 16px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    cursor: pointer;
    transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.neo-nav__profile-trigger:hover,
.neo-nav__profile-trigger:focus-visible {
    border-color: rgba(44, 120, 115, 0.3);
    background: rgba(44, 120, 115, 0.1);
    box-shadow: 0 4px 12px rgba(44, 120, 115, 0.15);
}

.neo-nav__profile-trigger img {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
}

.neo-nav__profile-info span {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.neo-nav__profile-info strong {
    font-size: 0.95rem;
    color: var(--color-heading);
}

.neo-nav__profile-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    min-width: 220px;
    padding: var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    animation: dropdown-fade 0.18s ease;
    z-index: 140;
}

.neo-nav__profile-item {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    color: var(--color-heading);
    transition: background-color 0.18s ease, color 0.18s ease;
    cursor: pointer;
}

.neo-nav__profile-item i {
    font-size: 1.05rem;
}

.neo-nav__profile-item:hover,
.neo-nav__profile-item:focus-visible {
    background: var(--color-card-muted);
    color: var(--color-primary);
}

.neo-nav__profile-item--danger {
    color: var(--color-danger);
}

.neo-nav__profile-item--danger:hover,
.neo-nav__profile-item--danger:focus-visible {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.neo-nav__profile-divider {
    height: 1px;
    margin: 0.25rem 0.35rem;
    border: none;
    background: rgba(148, 163, 184, 0.28);
}

@keyframes dropdown-fade {
    from {
        opacity: 0;
        transform: translateY(-6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 1199px) {
    :root {
        --nav-padding-x: clamp(1rem, 3vw, 1.6rem);
        --nav-gap: 1rem;
    }

    .neo-nav {
        grid-template-columns: auto auto auto;
    }

    .neo-nav__search {
        width: clamp(200px, 35vw, 320px);
    }
}

@media (max-width: 992px) {
    .neo-nav {
        left: 0 !important;
        right: 0;
        grid-template-columns: 1fr auto;
        grid-template-areas: 'left right' 'center center';
        row-gap: 0.75rem;
        align-items: start;
    }

    .neo-nav__section--left {
        grid-area: left;
    }

    .neo-nav__section--right {
        grid-area: right;
    }

    .neo-nav__section--center {
        grid-area: center;
        justify-content: stretch;
    }

    .neo-nav__search {
        width: 100%;
    }
}

@media (max-width: 768px) {
    :root {
        --nav-padding-x: clamp(0.85rem, 4vw, 1.2rem);
        --nav-gap: 0.9rem;
    }

    .neo-nav__brand-prefix {
        font-size: 0.68rem;
    }

    .neo-nav__brand-title {
        font-size: 1.05rem;
    }

    .neo-nav__icon,
    .neo-nav__icon--primary {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        font-size: 1.05rem;
    }

    .neo-nav__profile-trigger {
        gap: 0.6rem;
        padding: 0.3rem 0.5rem;
    }

    .neo-nav__profile-trigger img {
        width: 38px;
        height: 38px;
    }

    .neo-nav__profile-info span {
        font-size: 0.7rem;
    }

    .neo-nav__profile-info strong {
        font-size: 0.88rem;
    }
}

@media (max-width: 576px) {
    .neo-nav {
        grid-template-columns: 1fr auto;
    }

    .neo-nav__brand-prefix {
        display: none;
    }

    .neo-nav__brand-title {
        font-size: 1rem;
    }

    .neo-nav__search {
        padding: 0.5rem 0.75rem;
    }

    .neo-nav__search i:first-child {
        font-size: 0.95rem;
    }

    .neo-nav__profile-info {
        display: none;
    }

    .neo-nav__profile-trigger i {
        display: none;
    }
}

.neo-nav__theme-dropdown {
    position: relative;
}

.neo-nav__theme-menu {
    position: absolute;
    top: calc(100% + var(--spacing-2));
    right: 0;
    width: 900px;
    max-width: 95vw;
    max-height: 85vh;
    overflow-y: auto;
    background: var(--color-card);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 1000;
    padding: 0;
}

@media (max-width: 768px) {
    .neo-nav__theme-menu {
        width: calc(100vw - var(--spacing-8));
        right: var(--spacing-4);
    }
}
</style>