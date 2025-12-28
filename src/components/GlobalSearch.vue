<template>
  <div
    ref="searchRef"
    class="global-search"
  >
    <div class="global-search__input-wrapper">
      <i class="bi bi-search global-search__icon" />
      <input
        v-model="searchKeyword"
        type="text"
        class="global-search__input"
        placeholder="Tìm kiếm sản phẩm, khách hàng, đơn hàng..."
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleSearch"
        @keydown.escape="closeDropdown"
        @input="handleInput"
      >
      <button
        v-if="searchKeyword"
        class="global-search__clear"
        type="button"
        @click="clearSearch"
      >
        <i class="bi bi-x" />
      </button>
    </div>

    <Transition name="dropdown">
      <div
        v-if="showDropdown && (hasResults || hasSuggestions || hasHistory)"
        class="global-search__dropdown"
        @click.stop
      >
        <!-- Suggestions/History -->
        <div
          v-if="!hasResults && (hasSuggestions || hasHistory)"
          class="global-search__suggestions"
        >
          <div
            v-if="hasHistory"
            class="global-search__section"
          >
            <div class="global-search__section-title">
              <i class="bi bi-clock-history" />
              Tìm kiếm gần đây
            </div>
            <button
              v-for="(item, index) in recentHistory"
              :key="index"
              class="global-search__suggestion-item"
              type="button"
              @click="selectSuggestion(item)"
            >
              <i class="bi bi-arrow-return-left" />
              <span>{{ item }}</span>
            </button>
          </div>

          <div
            v-if="hasSuggestions"
            class="global-search__section"
          >
            <div class="global-search__section-title">
              <i class="bi bi-lightbulb" />
              Gợi ý
            </div>
            <button
              v-for="(item, index) in suggestions"
              :key="index"
              class="global-search__suggestion-item"
              type="button"
              @click="selectSuggestion(item)"
            >
              <i class="bi bi-search" />
              <span>{{ item }}</span>
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div
          v-else-if="hasResults"
          class="global-search__results"
        >
          <LoadingState
            v-if="loading"
            text="Đang tìm kiếm..."
            :compact="true"
          />
          <div
            v-else
            class="global-search__results-content"
          >
            <!-- Products -->
            <div
              v-if="results.products.length > 0"
              class="global-search__section"
            >
              <div class="global-search__section-title">
                <i class="bi bi-box-seam" />
                Sản phẩm ({{ results.products.length }})
              </div>
              <button
                v-for="item in results.products"
                :key="item.id"
                class="global-search__result-item"
                type="button"
                @click="handleResultClick(item)"
              >
                <div
                  v-if="item.image"
                  class="global-search__result-image"
                >
                  <img
                    :src="item.image"
                    :alt="item.title"
                  >
                </div>
                <div
                  v-else
                  class="global-search__result-icon"
                >
                  <i class="bi bi-box-seam" />
                </div>
                <div class="global-search__result-content">
                  <div class="global-search__result-title">
                    {{ item.title }}
                  </div>
                  <div class="global-search__result-subtitle">
                    {{ item.subtitle }}
                  </div>
                  <div
                    v-if="item.description"
                    class="global-search__result-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <i class="bi bi-chevron-right global-search__result-arrow" />
              </button>
            </div>

            <!-- Customers -->
            <div
              v-if="results.customers.length > 0"
              class="global-search__section"
            >
              <div class="global-search__section-title">
                <i class="bi bi-people" />
                Khách hàng ({{ results.customers.length }})
              </div>
              <button
                v-for="item in results.customers"
                :key="item.id"
                class="global-search__result-item"
                type="button"
                @click="handleResultClick(item)"
              >
                <div class="global-search__result-icon">
                  <i class="bi bi-person-circle" />
                </div>
                <div class="global-search__result-content">
                  <div class="global-search__result-title">
                    {{ item.title }}
                  </div>
                  <div class="global-search__result-subtitle">
                    {{ item.subtitle }}
                  </div>
                  <div
                    v-if="item.description"
                    class="global-search__result-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <i class="bi bi-chevron-right global-search__result-arrow" />
              </button>
            </div>

            <!-- Orders -->
            <div
              v-if="results.orders.length > 0"
              class="global-search__section"
            >
              <div class="global-search__section-title">
                <i class="bi bi-receipt" />
                Đơn hàng ({{ results.orders.length }})
              </div>
              <button
                v-for="item in results.orders"
                :key="item.id"
                class="global-search__result-item"
                type="button"
                @click="handleResultClick(item)"
              >
                <div class="global-search__result-icon">
                  <i class="bi bi-receipt-cutoff" />
                </div>
                <div class="global-search__result-content">
                  <div class="global-search__result-title">
                    {{ item.title }}
                  </div>
                  <div class="global-search__result-subtitle">
                    {{ item.subtitle }}
                  </div>
                  <div
                    v-if="item.description"
                    class="global-search__result-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <i class="bi bi-chevron-right global-search__result-arrow" />
              </button>
            </div>

            <!-- Vouchers -->
            <div
              v-if="results.vouchers.length > 0"
              class="global-search__section"
            >
              <div class="global-search__section-title">
                <i class="bi bi-ticket-perforated" />
                Voucher ({{ results.vouchers.length }})
              </div>
              <button
                v-for="item in results.vouchers"
                :key="item.id"
                class="global-search__result-item"
                type="button"
                @click="handleResultClick(item)"
              >
                <div class="global-search__result-icon">
                  <i class="bi bi-ticket-detailed" />
                </div>
                <div class="global-search__result-content">
                  <div class="global-search__result-title">
                    {{ item.title }}
                  </div>
                  <div class="global-search__result-subtitle">
                    {{ item.subtitle }}
                  </div>
                  <div
                    v-if="item.description"
                    class="global-search__result-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <i class="bi bi-chevron-right global-search__result-arrow" />
              </button>
            </div>

            <!-- Users -->
            <div
              v-if="results.users.length > 0"
              class="global-search__section"
            >
              <div class="global-search__section-title">
                <i class="bi bi-person-badge" />
                Người dùng ({{ results.users.length }})
              </div>
              <button
                v-for="item in results.users"
                :key="item.id"
                class="global-search__result-item"
                type="button"
                @click="handleResultClick(item)"
              >
                <div class="global-search__result-icon">
                  <i class="bi bi-person" />
                </div>
                <div class="global-search__result-content">
                  <div class="global-search__result-title">
                    {{ item.title }}
                  </div>
                  <div class="global-search__result-subtitle">
                    {{ item.subtitle }}
                  </div>
                  <div
                    v-if="item.description"
                    class="global-search__result-description"
                  >
                    {{ item.description }}
                  </div>
                </div>
                <i class="bi bi-chevron-right global-search__result-arrow" />
              </button>
            </div>

            <!-- No Results -->
            <div
              v-if="!loading && results.total === 0"
              class="global-search__empty"
            >
              <i class="bi bi-search" />
              <p>Không tìm thấy kết quả</p>
              <span>Thử với từ khóa khác</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/store/search'
import { universalSearch } from '@/api/universalSearchService'
import logger from '@/utils/logger'
import LoadingState from '@/components/common/LoadingState.vue'

const router = useRouter()
const searchStore = useSearchStore()

const searchRef = ref(null)
const searchKeyword = ref('')
const showDropdown = ref(false)
const loading = ref(false)
const results = ref({
    products: [],
    customers: [],
    orders: [],
    vouchers: [],
    users: [],
    suppliers: [],
    ingredients: [],
    files: [],
    total: 0
})

let searchTimeout = null
let blurTimeout = null

const hasResults = computed(() => results.value.total > 0)
const hasSuggestions = computed(() => suggestions.value.length > 0)
const hasHistory = computed(() => recentHistory.value.length > 0)

const suggestions = computed(() => {
    if (!searchKeyword.value.trim()) return []
    return searchStore.getSuggestions('products', searchKeyword.value)
})

const recentHistory = computed(() => searchStore.recentSearches
    .slice(0, 5)
    .map(s => s.keyword))

const handleInput = () => {
    clearTimeout(searchTimeout)

    if (!searchKeyword.value.trim()) {
        results.value = {
            products: [],
            customers: [],
            orders: [],
            vouchers: [],
            users: [],
            suppliers: [],
            ingredients: [],
            files: [],
            total: 0
        }
        return
    }

    searchTimeout = setTimeout(() => {
        performSearch()
    }, 300) // Debounce 300ms
}

const performSearch = async () => {
    if (!searchKeyword.value.trim()) return

    loading.value = true
    try {
        const searchResults = await universalSearch(searchKeyword.value, {
            limit: 5,
            entities: ['products', 'customers', 'orders', 'vouchers', 'users']
        })
        results.value = searchResults

        // Thêm vào lịch sử
        searchStore.addToHistory('products', searchKeyword.value)
        searchStore.addToRecent(searchKeyword.value, 'universal', searchResults.total)
    } catch (err) {
        logger.error('[GlobalSearch] Tìm kiếm thất bại:', err)
    } finally {
        loading.value = false
    }
}

const handleFocus = () => {
    clearTimeout(blurTimeout)
    showDropdown.value = true
}

const handleBlur = () => {
    blurTimeout = setTimeout(() => {
        showDropdown.value = false
    }, 200)
}

const handleSearch = () => {
    if (searchKeyword.value.trim()) {
        performSearch()
    }
}

const selectSuggestion = (keyword) => {
    searchKeyword.value = keyword
    performSearch()
}

const handleResultClick = (item) => {
    searchStore.addToHistory(item.type, searchKeyword.value)
    searchStore.addToRecent(searchKeyword.value, item.type, 1)

    // Navigate với query params nếu có
    if (item.query) {
        router.push({
            path: item.route,
            query: item.query
        })
    } else {
        router.push(item.route)
    }

    closeDropdown()
    searchKeyword.value = ''
}

const clearSearch = () => {
    searchKeyword.value = ''
    results.value = {
        products: [],
        customers: [],
        orders: [],
        vouchers: [],
        users: [],
        suppliers: [],
        ingredients: [],
        files: [],
        total: 0
    }
    showDropdown.value = false
}

const closeDropdown = () => {
    showDropdown.value = false
}

const handleClickOutside = (event) => {
    if (searchRef.value && !searchRef.value.contains(event.target)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
    if (searchTimeout) clearTimeout(searchTimeout)
    if (blurTimeout) clearTimeout(blurTimeout)
})
</script>

<style scoped>
.global-search {
    position: relative;
    width: 100%;
    max-width: 500px;
}

.global-search__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.global-search__icon {
    position: absolute;
    left: 12px;
    color: var(--color-text-muted);
    font-size: 1rem;
    pointer-events: none;
    z-index: 1;
}

.global-search__input {
    width: 100%;
    height: 44px;
    padding: 0 40px 0 40px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-card);
    color: var(--color-heading);
    font-size: 0.95rem;
    font-family: var(--font-family-sans);
    transition: all 0.2s ease;
}

.global-search__input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(44, 120, 115, 0.1);
}

.global-search__clear {
    position: absolute;
    right: 8px;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.global-search__clear:hover {
    background: var(--color-card-muted);
    color: var(--color-heading);
}

.global-search__dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    max-height: 600px;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    overflow-y: auto;
    z-index: 1000;
}

.global-search__suggestions,
.global-search__results {
    padding: 8px;
}

.global-search__section {
    margin-bottom: 16px;
}

.global-search__section:last-child {
    margin-bottom: 0;
}

.global-search__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.global-search__suggestion-item {
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    text-align: left;
    color: var(--color-heading);
    font-size: 0.9rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.2s ease;
}

.global-search__suggestion-item:hover {
    background: var(--color-card-muted);
}

.global-search__suggestion-item i {
    color: var(--color-text-muted);
    font-size: 0.85rem;
}

.global-search__result-item {
    width: 100%;
    padding: 12px;
    border: none;
    background: transparent;
    text-align: left;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background 0.2s ease;
}

.global-search__result-item:hover {
    background: var(--color-card-muted);
}

.global-search__result-image {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--color-card-muted);
}

.global-search__result-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.global-search__result-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--color-card-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    font-size: 1.5rem;
    flex-shrink: 0;
}

.global-search__result-content {
    flex: 1;
    min-width: 0;
}

.global-search__result-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-heading);
    margin-bottom: 4px;
}

.global-search__result-subtitle {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 4px;
}

.global-search__result-description {
    font-size: 0.8rem;
    color: var(--color-text-subtle);
    line-height: 1.4;
    margin-top: 2px;
}

.global-search__result-arrow {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    flex-shrink: 0;
}

.global-search__empty {
    padding: 48px 24px;
    text-align: center;
    color: var(--color-text-muted);
}

.global-search__empty i {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.3;
}

.global-search__empty p {
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-heading);
}

.global-search__empty span {
    font-size: 0.85rem;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

@media (max-width: 768px) {
    .global-search {
        max-width: 100%;
    }

    .global-search__dropdown {
        max-height: 400px;
    }
}
</style>

