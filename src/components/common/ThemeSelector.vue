<template>
    <div class="theme-selector">
        <!-- Header với Search -->
        <div class="theme-selector__header">
            <div class="theme-selector__header-top">
                <h5 class="theme-selector__title">
                    <i class="bi bi-palette-fill"></i>
                    Chọn giao diện
                </h5>
                <div class="theme-selector__count">
                    {{ filteredThemes.length }} theme
                </div>
            </div>
            
            <div class="theme-selector__search-wrapper">
                <i class="bi bi-search theme-selector__search-icon"></i>
                <input
                    v-model="searchQuery"
                    type="text"
                    class="theme-selector__search"
                    placeholder="Tìm kiếm theme..."
                />
                <button
                    v-if="searchQuery"
                    class="theme-selector__search-clear"
                    @click="searchQuery = ''"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <!-- Category Filter Pills -->
            <div class="theme-selector__filters">
                <button
                    v-for="category in allCategories"
                    :key="category"
                    class="theme-selector__filter-pill"
                    :class="{ 'theme-selector__filter-pill--active': selectedCategory === category }"
                    @click="selectedCategory = selectedCategory === category ? null : category"
                >
                    {{ category }}
                    <span class="theme-selector__filter-count">
                        {{ getCategoryCount(category) }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Preview Panel (hiện khi hover) -->
        <Transition name="preview">
            <div
                v-if="previewTheme"
                class="theme-selector__preview-panel"
                :style="previewStyle"
            >
                <div class="theme-selector__preview-header">
                    <div class="theme-selector__preview-title">
                        <i :class="`bi ${previewTheme.icon}`"></i>
                        {{ previewTheme.name }}
                    </div>
                    <div class="theme-selector__preview-category">
                        {{ previewTheme.category }}
                    </div>
                </div>
                <div class="theme-selector__preview-colors">
                    <div
                        v-for="(color, index) in previewTheme.colors"
                        :key="index"
                        class="theme-selector__preview-color-item"
                    >
                        <div
                            class="theme-selector__preview-color-swatch"
                            :style="{ backgroundColor: color }"
                        ></div>
                        <div class="theme-selector__preview-color-code">{{ color }}</div>
                    </div>
                </div>
                <div class="theme-selector__preview-description">
                    {{ previewTheme.description }}
                </div>
            </div>
        </Transition>

        <!-- Themes Grid -->
        <div class="theme-selector__content">
            <div
                v-for="(themes, category) in filteredCategories"
                :key="category"
                class="theme-selector__category"
            >
                <div class="theme-selector__category-header">
                    <h6 class="theme-selector__category-title">
                        <i class="bi bi-folder-fill"></i>
                        {{ category }}
                    </h6>
                    <span class="theme-selector__category-count">{{ themes.length }}</span>
                </div>
                <div class="theme-selector__grid">
                    <button
                        v-for="themeData in themes"
                        :key="themeData.theme"
                        class="theme-selector__item"
                        :class="{ 'theme-selector__item--active': currentTheme === themeData.theme }"
                        @click="selectTheme(themeData.theme)"
                        @mouseenter="showPreview(themeData, $event)"
                        @mouseleave="hidePreview"
                        @mousemove="updatePreviewPosition($event)"
                    >
                        <div class="theme-selector__item-header">
                            <div class="theme-selector__item-icon">
                                <i :class="`bi ${themeData.icon}`"></i>
                            </div>
                            <div
                                v-if="currentTheme === themeData.theme"
                                class="theme-selector__item-badge"
                            >
                                <i class="bi bi-check-circle-fill"></i>
                                Đang dùng
                            </div>
                        </div>
                        
                        <div class="theme-selector__item-preview">
                            <div
                                v-for="(color, index) in themeData.colors"
                                :key="index"
                                class="theme-selector__item-color"
                                :style="{ backgroundColor: color }"
                            ></div>
                        </div>
                        
                        <div class="theme-selector__item-info">
                            <div class="theme-selector__item-name">{{ themeData.name }}</div>
                            <div class="theme-selector__item-category">{{ themeData.category }}</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredThemes.length === 0" class="theme-selector__empty">
                <i class="bi bi-search theme-selector__empty-icon"></i>
                <p class="theme-selector__empty-text">Không tìm thấy theme nào</p>
                <button
                    class="theme-selector__empty-reset"
                    @click="resetFilters"
                >
                    Xóa bộ lọc
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { getThemesByCategory, THEME_METADATA } from '@/utils/theme'

const settingsStore = useSettingsStore()
const currentTheme = computed(() => settingsStore.currentTheme)
const allThemesByCategory = computed(() => getThemesByCategory())

const searchQuery = ref('')
const selectedCategory = ref(null)
const previewTheme = ref(null)
const previewPosition = ref({ x: 0, y: 0 })

// Get all categories
const allCategories = computed(() => {
    return Object.keys(allThemesByCategory.value)
})

// Flatten all themes for search
const allThemes = computed(() => {
    const themes = []
    Object.entries(allThemesByCategory.value).forEach(([category, themeList]) => {
        themeList.forEach(theme => {
            themes.push({ ...theme, category })
        })
    })
    return themes
})

// Filter themes based on search and category
const filteredThemes = computed(() => {
    let themes = allThemes.value

    // Filter by search query
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        themes = themes.filter(theme =>
            theme.name.toLowerCase().includes(query) ||
            theme.description.toLowerCase().includes(query) ||
            theme.category.toLowerCase().includes(query)
        )
    }

    // Filter by category
    if (selectedCategory.value) {
        themes = themes.filter(theme => theme.category === selectedCategory.value)
    }

    return themes
})

// Group filtered themes by category
const filteredCategories = computed(() => {
    const grouped = {}
    filteredThemes.value.forEach(theme => {
        if (!grouped[theme.category]) {
            grouped[theme.category] = []
        }
        grouped[theme.category].push(theme)
    })
    return grouped
})

// Get category count
const getCategoryCount = (category) => {
    return allThemes.value.filter(t => t.category === category).length
}

// Preview functions
const showPreview = (theme, event) => {
    previewTheme.value = theme
    updatePreviewPosition(event)
}

const hidePreview = () => {
    previewTheme.value = null
}

const updatePreviewPosition = (event) => {
    if (!event) return
    previewPosition.value = {
        x: event.clientX,
        y: event.clientY
    }
}

const previewStyle = computed(() => {
    if (!previewPosition.value.x || !previewPosition.value.y) return {}
    
    const offset = 20
    let left = previewPosition.value.x + offset
    let top = previewPosition.value.y + offset
    
    // Adjust if too close to right edge
    if (left + 320 > window.innerWidth) {
        left = previewPosition.value.x - 340
    }
    
    // Adjust if too close to bottom edge
    if (top + 200 > window.innerHeight) {
        top = previewPosition.value.y - 220
    }
    
    return {
        left: `${left}px`,
        top: `${top}px`
    }
})

// Select theme
const selectTheme = (theme) => {
    settingsStore.setTheme(theme)
    hidePreview()
}

// Reset filters
const resetFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = null
}

// Handle mouse move for preview
let mouseMoveHandler = null

onMounted(() => {
    mouseMoveHandler = (e) => {
        if (previewTheme.value) {
            updatePreviewPosition(e)
        }
    }
    document.addEventListener('mousemove', mouseMoveHandler)
})

onBeforeUnmount(() => {
    if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler)
    }
})
</script>

<style scoped>
.theme-selector {
    padding: var(--spacing-5);
    max-width: 100%;
    position: relative;
}

/* Header */
.theme-selector__header {
    margin-bottom: var(--spacing-6);
}

.theme-selector__header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
}

.theme-selector__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.theme-selector__title i {
    color: var(--color-primary);
    font-size: 1.2em;
}

.theme-selector__count {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
}

/* Search */
.theme-selector__search-wrapper {
    position: relative;
    margin-bottom: var(--spacing-4);
}

.theme-selector__search-icon {
    position: absolute;
    left: var(--spacing-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    pointer-events: none;
    z-index: 1;
}

.theme-selector__search {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-10) var(--spacing-3) var(--spacing-10);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-input-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.theme-selector__search:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.1);
    background: var(--color-surface);
}

.theme-selector__search::placeholder {
    color: var(--color-placeholder);
}

.theme-selector__search-clear {
    position: absolute;
    right: var(--spacing-3);
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-1);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
    font-size: var(--font-size-sm);
}

.theme-selector__search-clear:hover {
    color: var(--color-danger);
    background: var(--color-soft-rose);
}

/* Filters */
.theme-selector__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.theme-selector__filter-pill {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-card);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: var(--font-family-sans);
}

.theme-selector__filter-pill:hover {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
}

.theme-selector__filter-pill--active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.2);
}

.theme-selector__filter-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px var(--spacing-1);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
}

.theme-selector__filter-pill--active .theme-selector__filter-count {
    background: rgba(0, 0, 0, 0.2);
}

/* Preview Panel */
.theme-selector__preview-panel {
    position: fixed;
    width: 320px;
    padding: var(--spacing-4);
    background: var(--color-elevated);
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 10000;
    pointer-events: none;
    animation: previewFadeIn 0.2s ease-out;
}

@keyframes previewFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.theme-selector__preview-header {
    margin-bottom: var(--spacing-3);
    padding-bottom: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
}

.theme-selector__preview-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-1);
}

.theme-selector__preview-title i {
    color: var(--color-primary);
}

.theme-selector__preview-category {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: var(--font-weight-medium);
}

.theme-selector__preview-colors {
    display: flex;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-3);
}

.theme-selector__preview-color-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.theme-selector__preview-color-swatch {
    width: 100%;
    height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.theme-selector__preview-color-code {
    font-size: var(--font-size-xs);
    font-family: 'Courier New', monospace;
    color: var(--color-text-muted);
    text-align: center;
    font-weight: var(--font-weight-medium);
}

.theme-selector__preview-description {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    line-height: 1.5;
}

/* Content */
.theme-selector__content {
    position: relative;
}

.theme-selector__category {
    margin-bottom: var(--spacing-8);
}

.theme-selector__category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-2);
    border-bottom: 2px solid var(--color-border);
}

.theme-selector__category-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.theme-selector__category-title i {
    color: var(--color-primary);
    font-size: 0.9em;
}

.theme-selector__category-count {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    background: var(--color-card-muted);
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

/* Grid */
.theme-selector__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--spacing-4);
}

/* Theme Item */
.theme-selector__item {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    padding: var(--spacing-4);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-card);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: left;
    min-height: 180px;
    overflow: hidden;
}

.theme-selector__item:hover {
    border-color: var(--color-primary);
    background: var(--color-surface);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.15);
}

.theme-selector__item--active {
    border-color: var(--color-primary);
    background: var(--color-soft-primary);
    box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.15),
                0 4px 16px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.2);
}

.theme-selector__item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.theme-selector__item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-soft-primary);
    border-radius: var(--radius-md);
    color: var(--color-primary);
    font-size: var(--font-size-lg);
}

.theme-selector__item-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
}

.theme-selector__item-preview {
    display: flex;
    height: 64px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 2px solid var(--color-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.theme-selector__item-color {
    flex: 1;
    height: 100%;
    transition: transform 0.2s ease;
}

.theme-selector__item:hover .theme-selector__item-color {
    transform: scaleY(1.1);
}

.theme-selector__item-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.theme-selector__item-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    line-height: 1.3;
}

.theme-selector__item-category {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: var(--font-weight-medium);
}

/* Empty State */
.theme-selector__empty {
    text-align: center;
    padding: var(--spacing-8) var(--spacing-4);
}

.theme-selector__empty-icon {
    font-size: 3rem;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-3);
    opacity: 0.5;
}

.theme-selector__empty-text {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-4);
}

.theme-selector__empty-reset {
    padding: var(--spacing-2) var(--spacing-4);
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--transition-base);
}

.theme-selector__empty-reset:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--bs-primary-rgb, 44, 62, 80), 0.3);
}

/* Preview Transition */
.preview-enter-active,
.preview-leave-active {
    transition: all 0.2s ease-out;
}

.preview-enter-from,
.preview-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

/* Responsive */
@media (max-width: 1024px) {
    .theme-selector__grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--spacing-3);
    }
}

@media (max-width: 768px) {
    .theme-selector {
        padding: var(--spacing-3);
    }
    
    .theme-selector__grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: var(--spacing-2);
    }
    
    .theme-selector__item {
        min-height: 160px;
        padding: var(--spacing-3);
    }
    
    .theme-selector__item-preview {
        height: 48px;
    }
    
    .theme-selector__preview-panel {
        width: 280px;
        padding: var(--spacing-3);
    }
    
    .theme-selector__header-top {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-2);
    }
}

@media (max-width: 480px) {
    .theme-selector__grid {
        grid-template-columns: 1fr;
    }
    
    .theme-selector__filters {
        gap: var(--spacing-1);
    }
    
    .theme-selector__filter-pill {
        font-size: var(--font-size-xs);
        padding: var(--spacing-1) var(--spacing-2);
    }
}
</style>
