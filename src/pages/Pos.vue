<template>
    <div class="pos-page">
        <!-- Header -->
        <header class="pos-header">
            <div>
                <h2 class="pos-header__title">Điều phối POS</h2>
                <p class="pos-header__subtitle mb-0">Chọn món hoặc chọn bàn, hệ thống sẽ tự động đồng bộ theo nhu cầu của bạn.</p>
            </div>
            <div class="pos-header__actions">
                <button
                    type="button"
                    class="btn btn-outline-primary"
                    @click="startTableSelection"
                >
                    <i class="bi bi-grid-3x3-gap-fill me-1"></i>
                    Xem sơ đồ bàn
                </button>
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="startProductFirst"
                >
                    <i class="bi bi-list-ul me-1"></i>
                    Chọn món trước
                </button>
                <button
                    type="button"
                    class="btn btn-success"
                    @click="handleNewTakeaway"
                >
                    <i class="bi bi-bag-check-fill me-2"></i>
                    Bán Mang Về
                </button>
            </div>
        </header>

        <div class="pos-container">
            <!-- Left Panel: Product Selection or Table Map -->
            <div class="pos-panel pos-panel--left">
                <transition name="fade" mode="out-in">
                    <div v-if="viewState.mode === 'tables'" class="pos-table-map-container">
                        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                            <div>
                                <h3 class="page-title mb-1">Sơ đồ Bàn</h3>
                                <p class="text-muted mb-0 small">Chọn bàn để tiếp tục phục vụ hoặc gán đơn nháp hiện tại.</p>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span v-if="selectedTable" class="badge bg-primary-subtle text-primary fw-semibold">
                                    Bàn đang chọn: {{ selectedTable.name }}
                                </span>
                                <button class="btn btn-primary" type="button" @click="viewState.mode = 'menu'">
                                    <i class="bi bi-arrow-right-circle me-1"></i>
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
            </div>

        <!-- Right Panel: Order Management -->
        <div class="pos-panel pos-panel--right">
            <!-- Takeaway Orders Section -->
            <section class="order-section">
                <div class="order-section__header">
                    <div>
                        <h5 class="order-section__title">Đơn mang về đang chờ</h5>
                        <p class="order-section__subtitle">Chọn để tiếp tục xử lý hoặc thanh toán.</p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        :disabled="isLoadingTakeawayOrders"
                        @click="refetchTakeawayOrders()"
                    >
                        <span v-if="isLoadingTakeawayOrders" class="spinner-border spinner-border-sm me-2"></span>
                        Làm mới
                    </button>
                </div>

                <EmptyState
                    v-if="pendingTakeawayOrders.length === 0"
                    title="Chưa có đơn mang về"
                    message="Chưa có đơn mang về nào đang chờ."
                >
                    <template #icon>
                        <i class="bi bi-bag-dash"></i>
                    </template>
                </EmptyState>
                <ul v-else class="order-list">
                    <li
                        v-for="order in pendingTakeawayOrders"
                        :key="order.id"
                        :class="['order-list__item', { 'order-list__item--active': order.id === selectedTakeawayOrder?.id }]"
                        @click="handleTakeawaySelected(order)"
                    >
                        <div class="order-list__item-content">
                            <div>
                                <div class="order-list__item-title">Đơn #{{ order.id }}</div>
                                <small class="order-list__item-meta">Tạo lúc {{ formatDateTime(order.createdAt) }}</small>
                            </div>
                            <div class="order-list__item-right">
                                <div class="order-list__item-amount">{{ formatCurrency(order.totalAmount) }}</div>
                                <small class="order-list__item-meta">{{ order.orderDetails?.length || 0 }} món</small>
                            </div>
                        </div>
                    </li>
                </ul>
            </section>

            <!-- Draft Orders Section -->
            <section class="order-section">
                <div class="order-section__header">
                    <div>
                        <h5 class="order-section__title">Đơn nháp (chờ gán bàn)</h5>
                        <span v-if="!selectedTable && activeOrder && !activeOrder.id" class="order-section__badge">CHƯA GÁN BÀN</span>
                    </div>
                </div>

                <PosOrderCart
                    ref="orderCartRef"
                    :table="selectedTable"
                    :order="activeOrder"
                    :view-intent="viewState.intent"
                    @order-updated="handleOrderUpdated"
                    @create-new-takeaway="handleNewTakeaway"
                    @request-table-selection="startTableSelection"
                />
            </section>
        </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useTableStore } from '@/store/tables'
import PosTableMap from '@/components/pos/PosTableMap.vue'
import PosProductMenu from '@/components/pos/PosProductMenu.vue'
import PosOrderCart from '@/components/pos/PosOrderCart.vue'
import { getPendingOrderByTable, getOrdersByStatus } from '@/api/orderService'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import EmptyState from '@/components/common/EmptyState.vue'

const tableStore = useTableStore()

const viewState = reactive({
    mode: 'menu',
    intent: 'product-first',
})

const TAKEAWAY_PAGE_SIZE = 50

const {
    data: takeawayOrdersPage,
    refetch: refetchTakeawayOrders,
    isLoading: isLoadingTakeawayOrders,
} = useQuery({
    queryKey: ['pendingTakeawayOrders'],
    queryFn: () => getOrdersByStatus('PENDING', 0, TAKEAWAY_PAGE_SIZE),
})

const pendingTakeawayOrders = computed(() => {
    const page = takeawayOrdersPage.value
    const content = Array.isArray(page?.content) ? page.content : Array.isArray(page) ? page : []
    return content.filter(order => order?.type === 'TAKE_AWAY' && order?.status === 'PENDING')
})

const activeOrder = computed(() => {
    if (selectedTakeawayOrder.value) {
        return selectedTakeawayOrder.value
    }
    return fetchedOrder.value ?? null
})

const selectedTable = ref(null)
const selectedTakeawayOrder = ref(null)
const orderCartRef = ref(null)
const queryClient = useQueryClient()

const selectedTableId = computed(() => selectedTable.value?.id ?? null)
const shouldFetchPendingOrder = computed(() => Boolean(selectedTableId.value) && selectedTable.value?.status === 'SERVING')

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
    retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2,
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
            status: 'EMPTY',
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

const handleNewTakeaway = () => {
    selectedTable.value = null
    viewState.mode = 'menu'
    viewState.intent = 'takeaway'
    orderCartRef.value?.detachFromTable()
}

onMounted(async () => {
    await tableStore.loadTables()
    tableStore.connectWebSocket()
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
    height: calc(100vh - 2rem);
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-bg, #f8fafc);
}

.pos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
}

.pos-header__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
}

.pos-header__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
}

.pos-header__actions {
    display: inline-flex;
    gap: var(--spacing-3);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.pos-container {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: var(--spacing-6);
    align-items: flex-start;
}

.pos-table-map-container {
    padding: var(--spacing-6);
    height: 100%;
    overflow-y: auto;
}

.pos-panel {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-xl);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}

.pos-panel--left {
    flex: 4;
    min-width: 0;
    height: 200vh;
    overflow-y: auto;
}

.pos-panel--right {
    flex: 3;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    padding: var(--spacing-6);
    height: 100vh;
    overflow-y: auto;
}

/* Order Section */
.order-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.order-section__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
}

.order-section__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
}

.order-section__subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
}

.order-section__badge {
    display: inline-block;
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: var(--radius-full);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
}

.order-section__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-12) var(--spacing-4);
    text-align: center;
    color: var(--color-text-muted);
}

.order-section__empty i {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-4);
    opacity: 0.5;
}

.order-section__empty p {
    margin: 0;
    font-size: var(--font-size-sm);
}

/* Order List */
.order-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
}

.order-list__item {
    padding: var(--spacing-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.order-list__item:hover {
    background: var(--color-card-accent);
    transform: translateX(4px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
}

.order-list__item--active {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
}

.order-list__item-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-4);
}

.order-list__item-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
}

.order-list__item-meta {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.order-list__item-right {
    text-align: right;
}

.order-list__item-amount {
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-1);
}

@media (max-width: 1200px) {
    .pos-container {
        flex-direction: column;
        height: auto;
    }

    .pos-panel--right {
        width: 100%;
        max-height: 50vh;
    }
}

@media (max-width: 768px) {
    .pos-container {
        padding: 0.5rem;
        gap: 1rem;
    }

    .pos-panel--right {
        padding: 1rem;
    }
}
</style>
