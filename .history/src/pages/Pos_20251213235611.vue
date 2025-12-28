<template>
  <div
    class="pos-page"
      
  >
    <div class="pos-container">
      <aside class="pos-panel pos-panel--left">
        <transition
          name="fade"
          mode="out-in"
        >
          <div
            v-if="viewState.mode === 'tables'"
            class="pos-table-map-wrapper"
          >
            <div class="pos-table-map-header">
              <div>
                <h3 class="pos-table-map-title">
                  Sơ đồ Bàn
                </h3>
                <p class="pos-table-map-subtitle">
                  Chọn bàn để tiếp tục phục vụ hoặc gán đơn nháp hiện tại.
                </p>
              </div>
              <div class="pos-table-map-actions">
                <span
                  v-if="selectedTable"
                  class="pos-table-map-badge"
                >
                  Bàn đang chọn: {{ selectedTable.name }}
                </span>
                <!-- Ẩn nút khi chưa chọn bàn -->
                <button
                  v-if="selectedTable"
                  class="btn btn-primary"
                  type="button"
                  @click="viewState.mode = 'menu'"
                >
                  <i class="bi bi-arrow-right-circle" />
                  Tiếp tục chọn món
                </button>
              </div>
            </div>
            <PosTableMap @table-selected="handleTableSelected" />
          </div>
          <PosProductMenu
            v-else
            :selected-table="selectedTable"
            @product-selected="handleProductSelected"
            @back-to-tables="startTableSelection"
          />
        </transition>
      </aside>

      <aside
        class="pos-panel pos-panel--right"
        :class="{ 'pos-panel--collapsed': isRightPanelCollapsed }"
      >
        <button
          class="pos-panel__toggle"
          type="button"
          @click="isRightPanelCollapsed = !isRightPanelCollapsed"
        >
          <i :class="isRightPanelCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'" />
        </button>
        <div
          v-show="!isRightPanelCollapsed"
          class="pos-panel__content"
        >
          <section class="pos-order-section pos-order-section--collapsible">
            <header
              class="pos-order-section__header pos-order-section__header--clickable"
              @click="isTakeawaySectionCollapsed = !isTakeawaySectionCollapsed"
            >
              <div>
                <h5 class="pos-order-section__title">
                  Đơn mang về đang chờ
                  <span
                    v-if="pendingTakeawayOrders.length > 0"
                    class="pos-order-section__count-badge"
                  >
                    {{ pendingTakeawayOrders.length }}
                  </span>
                </h5>
                <p
                  v-if="!isTakeawaySectionCollapsed"
                  class="pos-order-section__subtitle"
                >
                  Chọn để tiếp tục xử lý hoặc thanh toán.
                </p>
              </div>
              <div class="pos-order-section__header-actions">
                <button
                  v-if="!isTakeawaySectionCollapsed"
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  :disabled="isLoadingTakeawayOrders"
                  @click.stop="handleRefreshTakeawayOrders"
                >
                  <span
                    v-if="isLoadingTakeawayOrders"
                    class="spinner-border spinner-border-sm me-2"
                  />
                  <i
                    v-else
                    class="bi bi-arrow-clockwise me-1"
                  />
                  Làm mới
                </button>
                <i
                  class="bi pos-order-section__collapse-icon"
                  :class="isTakeawaySectionCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"
                />
              </div>
            </header>
            <div
              v-show="!isTakeawaySectionCollapsed"
              class="pos-order-section__content"
            >
              <EmptyState
                v-if="pendingTakeawayOrders.length === 0"
                title="Chưa có đơn mang về"
                message="Chưa có đơn mang về nào đang chờ."
              >
                <template #icon>
                  <i class="bi bi-bag-dash" />
                </template>
              </EmptyState>
              <ul
                v-else
                class="pos-order-list"
              >
                <li
                  v-for="order in pendingTakeawayOrders"
                  :key="order.id"
                  :class="['pos-order-list__item', { 'pos-order-list__item--active': order.id === selectedTakeawayOrder?.id }]"
                  @click="handleTakeawaySelected(order)"
                >
                  <div class="pos-order-list__content">
                    <div>
                      <div class="pos-order-list__title">
                        Đơn #{{ order.id }}
                      </div>
                      <small class="pos-order-list__meta">Tạo lúc {{ formatDateTime(order.createdAt) }}</small>
                    </div>
                    <div class="pos-order-list__right">
                      <div class="pos-order-list__amount">
                        {{ formatCurrency(order.totalAmount) }}
                      </div>
                      <small class="pos-order-list__meta">{{ order.orderDetails?.length || 0 }} món</small>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section class="pos-order-section pos-order-section--collapsible">
            <header
              class="pos-order-section__header pos-order-section__header--clickable"
              @click="isDraftSectionCollapsed = !isDraftSectionCollapsed"
            >
              <div>
                <h5 class="pos-order-section__title">
                  Đơn nháp (chờ gán bàn)
                  <span
                    v-if="!selectedTable && activeOrder && !activeOrder.id"
                    class="pos-order-section__badge"
                  >CHƯA GÁN BÀN</span>
                </h5>
              </div>
              <i
                class="bi pos-order-section__collapse-icon"
                :class="isDraftSectionCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'"
              />
            </header>
            <div
              v-show="!isDraftSectionCollapsed"
              class="pos-order-section__content"
            >
              <PosOrderCart
                ref="orderCartRef"
                :table="selectedTable"
                :order="activeOrder"
                :view-intent="viewState.intent"
                @order-updated="handleOrderUpdated"
                @create-new-takeaway="handleNewTakeaway"
                @request-table-selection="startTableSelection"
              />
            </div>
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useTableStore } from '@/store/tables'
import PosTableMap from '@/components/pos/PosTableMap.vue'
import PosProductMenu from '@/components/pos/PosProductMenu.vue'
import PosOrderCart from '@/components/pos/PosOrderCart.vue'
import { getPendingOrderByTable, getOrdersByStatus, getOrderById } from '@/api/orderService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'
import logger from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const tableStore = useTableStore()

const viewState = reactive({
    mode: 'menu',
    intent: 'product-first'
})

const TAKEAWAY_PAGE_SIZE = 50

// Cấu hình Vue Query với cache cho đơn mang về
const {
    data: takeawayOrdersPage,
    refetch: refetchTakeawayOrders,
    isLoading: isLoadingTakeawayOrders
} = useQuery({
    queryKey: ['pendingTakeawayOrders'],
    queryFn: () => getOrdersByStatus('PENDING', 0, TAKEAWAY_PAGE_SIZE),
    staleTime: 30 * 1000, // Dữ liệu fresh trong 30 giây (đơn hàng cần cập nhật thường xuyên)
    gcTime: 2 * 60 * 1000 // Giữ cache 2 phút
})

const pendingTakeawayOrders = computed(() => {
    const page = takeawayOrdersPage.value
    const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
    return content.filter(order => order?.type === 'TAKE_AWAY' && order?.status === 'PENDING')
})

const activeOrder = computed(() => {
    // Ưu tiên order từ route query (khi navigate từ Tables page)
    if (routeOrder.value) {
        return routeOrder.value
    }
    if (selectedTakeawayOrder.value) {
        return selectedTakeawayOrder.value
    }
    return fetchedOrder.value ?? null
})

const selectedTable = ref(null)
const selectedTakeawayOrder = ref(null)
const orderCartRef = ref(null)
const queryClient = useQueryClient()
const isRightPanelCollapsed = ref(false) // Collapsible cho cột bên phải
const isTakeawaySectionCollapsed = ref(false) // Mặc định mở section đơn mang về
const isDraftSectionCollapsed = ref(false) // Mặc định mở section đơn nháp
const routeOrderId = ref(null) // Order ID từ route query

const selectedTableId = computed(() => selectedTable.value?.id ?? null)
const shouldFetchPendingOrder = computed(() => Boolean(selectedTableId.value) && selectedTable.value?.status === 'SERVING')

// Query để fetch pending order của bàn
const { data: fetchedOrder, refetch: refetchPendingOrder } = useQuery({
    queryKey: computed(() => ['pendingOrder', selectedTableId.value]),
    queryFn: async () => {
        if (!selectedTableId.value) return null
        try {
            return await getPendingOrderByTable(selectedTableId.value)
        } catch (error) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    },
    enabled: shouldFetchPendingOrder,
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2
})

// Query để fetch order từ route query
const { data: routeOrder } = useQuery({
    queryKey: computed(() => ['order', routeOrderId.value]),
    queryFn: async () => {
        if (!routeOrderId.value) return null
        try {
            return await getOrderById(Number(routeOrderId.value))
        } catch (error) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    },
    enabled: computed(() => Boolean(routeOrderId.value)),
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2
})

const startTableSelection = () => {
    viewState.mode = 'tables'
}

const startProductFirst = () => {
    selectedTable.value = null
    viewState.mode = 'menu'
    viewState.intent = 'product-first'
    orderCartRef.value?.startDraft()
}

const handleTableSelected = (table) => {
    selectedTable.value = table
    // Tự động chuyển sang menu khi chọn bàn (giảm 1 click)
    viewState.mode = 'menu'
    viewState.intent = 'table-first'
    orderCartRef.value?.attachToTable(table)

    if (table.status === 'SERVING') {
        refetchPendingOrder()
    } else {
        queryClient.setQueryData(['pendingOrder', table.id], null)
    }
}

const handleProductSelected = (product) => {
    orderCartRef.value?.addProduct(product)
    // Tự động mở panel bên phải khi chọn món
    if (isRightPanelCollapsed.value) {
        isRightPanelCollapsed.value = false
    }
}

const handleTakeawaySelected = (order) => {
    selectedTable.value = null
    selectedTakeawayOrder.value = order
    viewState.mode = 'menu'
    viewState.intent = 'takeaway'
    orderCartRef.value?.attachToTable(null)
    orderCartRef.value?.showPaymentModal(order)
}

const handleOrderUpdated = async ({ reason, order } = {}) => {
    const targetTableId = order?.tableId ?? order?.table?.id ?? selectedTableId.value ?? null
    const isTakeaway = order?.type === 'TAKE_AWAY'

    const invalidations = []

    if (targetTableId) {
        invalidations.push(
            queryClient.invalidateQueries({ queryKey: ['pendingOrder', targetTableId], exact: true })
        )
    } else {
        invalidations.push(queryClient.invalidateQueries({ queryKey: ['pendingOrder'] }))
    }

    invalidations.push(queryClient.invalidateQueries({ queryKey: ['tables'] }))

    if (isTakeaway || !order) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: ['pendingTakeawayOrders'] }))
    }

    await Promise.allSettled(invalidations)

    if (reason === 'payment') {
        orderCartRef.value?.showPaymentModal(order)
    }

    if ((reason === 'payment' || reason === 'cancelled') && selectedTable.value && (!targetTableId || selectedTable.value.id === targetTableId) && !isTakeaway) {
        selectedTable.value = {
            ...selectedTable.value,
            status: 'EMPTY'
        }
    }

    if ((reason === 'payment' || reason === 'cancelled') && isTakeaway) {
        selectedTakeawayOrder.value = null
        if (viewState.intent === 'takeaway') {
            viewState.intent = 'product-first'
        }
        orderCartRef.value?.startDraft()
    }

    if (targetTableId && shouldFetchPendingOrder.value) {
        refetchPendingOrder()
    }
}

const handleRefreshTakeawayOrders = async () => {
    try {
        // Invalidate và refetch để đảm bảo dữ liệu mới nhất
        await queryClient.invalidateQueries({ queryKey: ['pendingTakeawayOrders'] })
        await refetchTakeawayOrders()
    } catch (error) {
        logger.error('Failed to refresh takeaway orders:', error)
    }
}

const handleNewTakeaway = () => {
    selectedTable.value = null
    viewState.mode = 'menu'
    viewState.intent = 'takeaway'
    orderCartRef.value?.detachFromTable()
}

// Xử lý query params từ router để tự động chọn bàn/tạo đơn
const initializeFromRoute = async () => {
    const { tableId, orderId, tableName, action } = route.query

    // Đảm bảo tables đã được load
    if (tableStore.tables.length === 0) {
        await tableStore.loadTables()
    }

    // Nếu có orderId, set routeOrderId để query tự động load
    if (orderId) {
        routeOrderId.value = Number(orderId)

        // Đợi order được load
        await new Promise((resolve) => {
            const unwatch = watch(routeOrder, (order) => {
                if (order) {
                    unwatch()
                    resolve()
                }
            }, { immediate: true })

            // Timeout sau 3 giây
            setTimeout(() => {
                unwatch()
                resolve()
            }, 3000)
        })

        const order = routeOrder.value
        if (order && order.tableId) {
            const table = tableStore.tables.find(t => t.id === order.tableId)
            if (table) {
                selectedTable.value = table
                viewState.mode = 'menu'
                viewState.intent = 'table-first'
                orderCartRef.value?.attachToTable(table)

                // Nếu action là 'add', mở panel để thêm món
                if (action === 'add') {
                    isRightPanelCollapsed.value = false
                } else {
                    // Mở panel để hiển thị đơn hàng
                    isRightPanelCollapsed.value = false
                }
            }
        }

        // Xóa query params sau khi xử lý
        router.replace({ name: 'POS', query: {} })
        return
    }

    // Nếu có tableId, chọn bàn đó
    if (tableId) {
        const tableIdNum = Number(tableId)
        const table = tableStore.tables.find(t => t.id === tableIdNum)

        if (table) {
            selectedTable.value = table
            viewState.mode = 'menu'
            viewState.intent = 'table-first'
            orderCartRef.value?.attachToTable(table)

            // Nếu bàn đang SERVING, thử load đơn hàng pending
            if (table.status === 'SERVING') {
                refetchPendingOrder()
            } else {
                // Nếu bàn trống, bắt đầu tạo đơn mới
                orderCartRef.value?.startDraft()
            }

            // Mở panel bên phải để hiển thị cart
            isRightPanelCollapsed.value = false
        } else {
            logger.warn(`Table with ID ${tableId} not found`)
        }

        // Xóa query params sau khi xử lý để tránh reload lại
        router.replace({ name: 'POS', query: {} })
    }
}

onMounted(async () => {
    await tableStore.loadTables()
    tableStore.connectWebSocket()

    // Xử lý query params sau khi tables đã load
    await initializeFromRoute()
})

onBeforeUnmount(() => {
    tableStore.disconnectWebSocket()
})

watch(() => tableStore.tables, (tables) => {
    if (selectedTable.value) {
        const updated = tables.find(t => t.id === selectedTable.value.id)
        if (updated) {
            selectedTable.value = { ...updated }
        }
    }
}, { deep: true })
</script>

<style scoped>
.pos-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    background: var(--color-body-bg);
}

.pos-container {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: var(--spacing-4);
    align-items: flex-start;
    padding: var(--spacing-4);
    height: calc(100vh - var(--nav-height));
    overflow: hidden;
}

.pos-panel {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-sm);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    overflow: hidden;
}

.pos-panel--left {
    flex: 4;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    height: 100%;
}

.pos-panel--right {
    flex: 3;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    min-height: 0;
    overflow-y: auto;
    position: relative;
    transition: all 0.3s ease;
}

.pos-panel--right.pos-panel--collapsed {
    flex: 0;
    padding: 0;
    min-width: 0;
    overflow: visible; /* Cho phép nút toggle hiển thị */
    border: none;
}

.pos-panel__toggle {
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50% 0 0 50%;
    border: 1px solid var(--color-border);
    border-right: none;
    background: var(--color-card);
    color: var(--color-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100; /* Tăng z-index để luôn hiển thị trên cùng */
    transition: all var(--transition-base);
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
}

/* Khi panel collapsed, nút toggle vẫn hiển thị nhưng điều chỉnh vị trí */
.pos-panel--right.pos-panel--collapsed .pos-panel__toggle {
    left: -20px;
    border-radius: 0 50% 50% 0; /* Đổi hình dạng khi collapsed */
    border-left: none;
    border-right: 1px solid var(--color-border);
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

.pos-panel__toggle:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.pos-panel__content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.pos-table-map-wrapper {
    padding: var(--spacing-5);
    height: 100%;
    overflow-y: auto;
}

.pos-table-map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-5);
    flex-wrap: wrap;
    gap: var(--spacing-4);
}

.pos-table-map-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.pos-table-map-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
}

.pos-table-map-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.pos-table-map-badge {
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-full);
    background: var(--color-soft-primary);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.pos-order-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.pos-order-section__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.pos-order-section__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-family: var(--font-family-sans);
}

.pos-order-section__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    font-family: var(--font-family-sans);
}

.pos-order-section__badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-full);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
}

.pos-order-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.pos-order-list__item {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    cursor: pointer;
    transition: all var(--transition-base);
}

.pos-order-list__item:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
}

.pos-order-list__item--active {
    background: var(--color-soft-primary);
    border-color: var(--color-primary);
}

.pos-order-list__content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-4);
}

.pos-order-list__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.pos-order-list__meta {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.pos-order-list__right {
    text-align: right;
}

.pos-order-list__amount {
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 1200px) {
    .pos-container {
        flex-direction: column;
        height: auto;
    }

    .pos-panel--right {
        width: 100%;
        max-height: none;
    }
}

@media (max-width: 768px) {
    .pos-panel--right {
        padding: var(--spacing-4);
    }

    .pos-table-map-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
