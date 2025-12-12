<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="command-palette"
      @click.self="close"
    >
      <div
        class="command-palette__container"
        @click.stop
      >
        <div class="command-palette__header">
          <div class="command-palette__search-wrapper">
            <i class="bi bi-search command-palette__search-icon" />
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="command-palette__search"
              placeholder="Tìm kiếm trang, hành động..."
              @keydown.down.prevent="navigateDown"
              @keydown.up.prevent="navigateUp"
              @keydown.enter.prevent="executeSelected"
              @keydown.esc="close"
            >
            <kbd class="command-palette__hint">
              ↑↓ để chọn, Enter để thực hiện
            </kbd>
          </div>
        </div>

        <div class="command-palette__content">
          <div
            v-if="filteredItems.length === 0"
            class="command-palette__empty"
          >
            <i class="bi bi-search" />
            <p>Không tìm thấy kết quả</p>
          </div>

          <div
            v-else
            class="command-palette__list"
          >
            <!-- Recent Actions -->
            <div
              v-if="recentItems.length > 0 && !searchQuery"
              class="command-palette__group"
            >
              <div class="command-palette__group-title">
                Gần đây
              </div>
              <div
                v-for="(item, index) in recentItems"
                :key="`recent-${item.id}`"
                class="command-palette__item"
                :class="{ 'command-palette__item--selected': selectedIndex === index }"
                @click="executeItem(item)"
                @mouseenter="selectedIndex = index"
              >
                <i :class="item.icon" />
                <div class="command-palette__item-content">
                  <div class="command-palette__item-title">
                    {{ item.title }}
                  </div>
                  <div
                    v-if="item.description"
                    class="command-palette__item-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <kbd
                  v-if="item.shortcut"
                  class="command-palette__item-shortcut"
                >
                  {{ formatShortcut(item.shortcut) }}
                </kbd>
              </div>
            </div>

            <!-- Pages -->
            <div
              v-if="filteredPages.length > 0"
              class="command-palette__group"
            >
              <div class="command-palette__group-title">
                Trang
              </div>
              <div
                v-for="(item, index) in filteredPages"
                :key="`page-${item.id}`"
                class="command-palette__item"
                :class="{ 'command-palette__item--selected': selectedIndex === getPageIndex(index) }"
                @click="executeItem(item)"
                @mouseenter="selectedIndex = getPageIndex(index)"
              >
                <i :class="item.icon" />
                <div class="command-palette__item-content">
                  <div class="command-palette__item-title">
                    {{ item.title }}
                  </div>
                  <div
                    v-if="item.description"
                    class="command-palette__item-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <kbd
                  v-if="item.shortcut"
                  class="command-palette__item-shortcut"
                >
                  {{ formatShortcut(item.shortcut) }}
                </kbd>
              </div>
            </div>

            <!-- Actions -->
            <div
              v-if="filteredActions.length > 0"
              class="command-palette__group"
            >
              <div class="command-palette__group-title">
                Hành động
              </div>
              <div
                v-for="(item, index) in filteredActions"
                :key="`action-${item.id}`"
                class="command-palette__item"
                :class="{ 'command-palette__item--selected': selectedIndex === getActionIndex(index) }"
                @click="executeItem(item)"
                @mouseenter="selectedIndex = getActionIndex(index)"
              >
                <i :class="item.icon" />
                <div class="command-palette__item-content">
                  <div class="command-palette__item-title">
                    {{ item.title }}
                  </div>
                  <div
                    v-if="item.description"
                    class="command-palette__item-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <kbd
                  v-if="item.shortcut"
                  class="command-palette__item-shortcut"
                >
                  {{ formatShortcut(item.shortcut) }}
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useShortcutsStore } from '@/store/shortcuts'
import { useAuthStore } from '@/store/auth'
import { navigationSections } from '@/config/navigation'

const router = useRouter()
const shortcutsStore = useShortcutsStore()
const authStore = useAuthStore()

const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const searchInput = ref(null)

// Build items from navigation
const allPages = computed(() => {
    const pages = []

    navigationSections.forEach(section => {
        section.items.forEach(item => {
            if (item.to) {
                // Check role permission
                const hasPermission = !item.roles ||
                    item.roles.some(role => authStore.userRoles.includes(role))

                if (hasPermission) {
                    pages.push({
                        id: item.id,
                        type: 'page',
                        title: item.label,
                        description: `Điều hướng đến ${item.label}`,
                        icon: item.icon || 'bi bi-file',
                        to: item.to,
                        action: () => router.push(item.to)
                    })
                }
            }

            // Handle children
            if (item.children) {
                item.children.forEach(child => {
                    const hasPermission = !child.roles ||
                        child.roles.some(role => authStore.userRoles.includes(role))

                    if (hasPermission && child.to) {
                        pages.push({
                            id: child.id,
                            type: 'page',
                            title: child.label,
                            description: `Điều hướng đến ${child.label}`,
                            icon: child.icon || 'bi bi-file',
                            to: child.to,
                            action: () => router.push(child.to)
                        })
                    }
                })
            }
        })
    })

    return pages
})

// Quick actions
const quickActions = computed(() => {
    const actions = []

    if (authStore.isAdmin || authStore.isManager) {
        actions.push(
            {
                id: 'new-order',
                type: 'action',
                title: 'Tạo đơn hàng mới',
                description: 'Tạo đơn hàng mới',
                icon: 'bi bi-plus-circle',
                action: () => router.push('/pos')
            },
            {
                id: 'new-product',
                type: 'action',
                title: 'Tạo sản phẩm mới',
                description: 'Thêm sản phẩm mới vào hệ thống',
                icon: 'bi bi-box-seam',
                action: () => {
                    router.push('/products')
                    // Trigger new product modal after navigation
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('action:new-product'))
                    }, 300)
                }
            },
            {
                id: 'new-customer',
                type: 'action',
                title: 'Tạo khách hàng mới',
                description: 'Thêm khách hàng mới',
                icon: 'bi bi-person-plus',
                action: () => {
                    router.push('/customers')
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('action:new-customer'))
                    }, 300)
                }
            }
        )
    }

    return actions
})

// Recent items
const recentItems = computed(() => shortcutsStore.recentActions.slice(0, 5))

// Filtered items
const filteredPages = computed(() => {
    if (!searchQuery.value) return []

    const query = searchQuery.value.toLowerCase()
    return allPages.value.filter(page =>
        page.title.toLowerCase().includes(query) ||
        page.description.toLowerCase().includes(query)
    )
})

const filteredActions = computed(() => {
    if (!searchQuery.value) return quickActions.value

    const query = searchQuery.value.toLowerCase()
    return quickActions.value.filter(action =>
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
    )
})

const filteredItems = computed(() => {
    const items = []
    if (!searchQuery.value && recentItems.value.length > 0) {
        items.push(...recentItems.value)
    }
    items.push(...filteredPages.value)
    items.push(...filteredActions.value)
    return items
})

// Navigation helpers
const getPageIndex = (index) => {
    let offset = 0
    if (!searchQuery.value && recentItems.value.length > 0) {
        offset = recentItems.value.length
    }
    return offset + index
}

const getActionIndex = (index) => {
    let offset = 0
    if (!searchQuery.value && recentItems.value.length > 0) {
        offset = recentItems.value.length
    }
    offset += filteredPages.value.length
    return offset + index
}

// Navigation
const navigateDown = () => {
    if (selectedIndex.value < filteredItems.value.length - 1) {
        selectedIndex.value++
    } else {
        selectedIndex.value = 0
    }
}

const navigateUp = () => {
    if (selectedIndex.value > 0) {
        selectedIndex.value--
    } else {
        selectedIndex.value = filteredItems.value.length - 1
    }
}

// Execute
const executeItem = (item) => {
    if (item.action) {
        item.action()
    }

    // Add to recent
    shortcutsStore.addRecentAction({
        id: item.id,
        title: item.title,
        description: item.description,
        icon: item.icon,
        action: item.action
    })

    close()
}

const executeSelected = () => {
    if (filteredItems.value[selectedIndex.value]) {
        executeItem(filteredItems.value[selectedIndex.value])
    }
}

// Format shortcut
const formatShortcut = (shortcut) => {
    if (!shortcut) return ''
    const parts = shortcut.split('+')
    return parts.map(p => {
        if (p === 'ctrl' || p === 'meta') return '⌘'
        if (p === 'shift') return '⇧'
        if (p === 'alt') return '⌥'
        return p.toUpperCase()
    }).join(' + ')
}

// Open/Close
const open = () => {
    isOpen.value = true
    searchQuery.value = ''
    selectedIndex.value = 0
    nextTick(() => {
        searchInput.value?.focus()
    })
}

const close = () => {
    isOpen.value = false
    searchQuery.value = ''
    selectedIndex.value = 0
}

// Listen for shortcut event
const handleCommandPaletteShortcut = () => {
    open()
}

onMounted(() => {
    window.addEventListener('shortcut:command-palette', handleCommandPaletteShortcut)
})

onBeforeUnmount(() => {
    window.removeEventListener('shortcut:command-palette', handleCommandPaletteShortcut)
})

// Watch search query to reset selection
watch(searchQuery, () => {
    selectedIndex.value = 0
})

defineExpose({
    open,
    close
})
</script>

<style scoped>
.command-palette {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.command-palette__container {
    width: 100%;
    max-width: 640px;
    background: var(--color-card);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    animation: slideDown 0.2s ease;
}

@keyframes slideDown {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.command-palette__header {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.command-palette__search-wrapper {
    position: relative;
}

.command-palette__search-icon {
    position: absolute;
    left: var(--spacing-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    font-size: 18px;
    pointer-events: none;
}

.command-palette__search {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-3) var(--spacing-3) 48px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: var(--font-size-base);
    outline: none;
    transition: all var(--transition-base);
}

.command-palette__search:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.command-palette__hint {
    position: absolute;
    right: var(--spacing-3);
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: var(--color-bg-muted);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
}

.command-palette__content {
    max-height: 400px;
    overflow-y: auto;
}

.command-palette__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-8);
    color: var(--color-text-muted);
    gap: var(--spacing-2);
}

.command-palette__empty i {
    font-size: 3rem;
    opacity: 0.5;
}

.command-palette__list {
    padding: var(--spacing-2);
}

.command-palette__group {
    margin-bottom: var(--spacing-4);
}

.command-palette__group:last-child {
    margin-bottom: 0;
}

.command-palette__group-title {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.command-palette__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border-radius: var(--radius-base);
    cursor: pointer;
    transition: all var(--transition-base);
    position: relative;
}

.command-palette__item:hover,
.command-palette__item--selected {
    background: var(--color-bg-muted);
}

.command-palette__item i {
    font-size: 20px;
    color: var(--color-primary);
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}

.command-palette__item-content {
    flex: 1;
    min-width: 0;
}

.command-palette__item-title {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
    color: var(--color-text);
    margin-bottom: var(--spacing-1);
}

.command-palette__item-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.4;
}

.command-palette__item-shortcut {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-family: monospace;
}
</style>

