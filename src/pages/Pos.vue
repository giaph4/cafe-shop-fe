<template>
    <div class="pos-page">
        <header class="pos-header">
            <div class="pos-header__content">
                <h2 class="pos-header__title">Điều phối POS</h2>
                <p class="pos-header__subtitle">Chọn món hoặc chọn bàn, hệ thống sẽ tự động đồng bộ theo nhu cầu của bạn.</p>
            </div>
            <div class="pos-header__actions">
                <button type="button" class="btn btn-outline-primary" @click="startTableSelection">
                    <i class="bi bi-grid-3x3-gap-fill me-1"></i>
                    Xem sơ đồ bàn
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="startProductFirst">
                    <i class="bi bi-list-ul me-1"></i>
                    Chọn món trước
                </button>
                <button type="button" class="btn btn-success" @click="handleNewTakeaway">
                    <i class="bi bi-bag-check-fill me-2"></i>
                    Bán Mang Về
                </button>
            </div>
        </header>

        <div class="pos-container">
            <aside class="pos-panel pos-panel--left">
                <transition name="fade" mode="out-in">
                    <div v-if="viewState.mode === 'tables'" class="pos-table-map-wrapper">
                        <div class="pos-table-map-header">
                            <div>
                                <h3 class="pos-table-map-title">Sơ đồ Bàn</h3>
                                <p class="pos-table-map-subtitle">Chọn bàn để tiếp tục phục vụ hoặc gán đơn nháp hiện tại.</p>
                            </div>
                            <div class="pos-table-map-actions">
                                <span v-if="selectedTable" class="pos-table-map-badge">
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
            </aside>

            <aside class="pos-panel pos-panel--right">
                <section class="pos-order-section">
                    <header class="pos-order-section__header">
                        <div>
                            <h5 class="pos-order-section__title">Đơn mang về đang chờ</h5>
                            <p class="pos-order-section__subtitle">Chọn để tiếp tục xử lý hoặc thanh toán.</p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="isLoadingTakeawayOrders"
                            @click="handleRefreshTakeawayOrders"
                        >
                            <span v-if="isLoadingTakeawayOrders" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-arrow-clockwise me-1"></i>
                            Làm mới
                        </button>
                    </header>

                    <EmptyState
                        v-if="pendingTakeawayOrders.length === 0"
                        title="Chưa có đơn mang về"
                        message="Chưa có đơn mang về nào đang chờ."
                    >
                        <template #icon>
                            <i class="bi bi-bag-dash"></i>
                        </template>
                    </EmptyState>
                    <ul v-else class="pos-order-list">
                        <li
                            v-for="order in pendingTakeawayOrders"
                            :key="order.id"
                            :class="['pos-order-list__item', { 'pos-order-list__item--active': order.id === selectedTakeawayOrder?.id }]"
                            @click="handleTakeawaySelected(order)"
                        >
                            <div class="pos-order-list__content">
                                <div>
                                    <div class="pos-order-list__title">Đơn #{{ order.id }}</div>
                                    <small class="pos-order-list__meta">Tạo lúc {{ formatDateTime(order.createdAt) }}</small>
                                </div>
                                <div class="pos-order-list__right">
                                    <div class="pos-order-list__amount">{{ formatCurrency(order.totalAmount) }}</div>
                                    <small class="pos-order-list__meta">{{ order.orderDetails?.length || 0 }} món</small>
                                </div>
                            </div>
                        </li>
                    </ul>
                </section>

                <section class="pos-order-section">
                    <header class="pos-order-section__header">
                        <div>
                            <h5 class="pos-order-section__title">Đơn nháp (chờ gán bàn)</h5>
                            <span v-if="!selectedTable && activeOrder && !activeOrder.id" class="pos-order-section__badge">CHƯA GÁN BÀN</span>
                        </div>
                    </header>

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
            </aside>
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
import logger from '@/utils/logger'

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
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    background: var(--color-body-bg);
}

.pos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
}

.pos-header__content {
    flex: 1;
    min-width: 0;
}

.pos-header__title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0 0 var(--spacing-1) 0;
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

.pos-header__subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
    margin: 0;
    font-family: var(--font-family-sans);
}

.pos-header__actions {
    display: inline-flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
    justify-content: flex-end;
}

.pos-container {
    display: flex;
    flex: 1;
    min-height: 0;
    gap: var(--spacing-4);
    align-items: flex-start;
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
}

.pos-panel--right {
    flex: 3;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    padding: var(--spacing-4);
    min-height: 0;
    overflow-y: auto;
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
    .pos-page {
        padding: var(--spacing-2);
        gap: var(--spacing-4);
    }

    .pos-header {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--spacing-4);
    }

    .pos-header__actions {
        width: 100%;
        justify-content: stretch;
    }

    .pos-header__actions .btn {
        flex: 1;
    }

    .pos-panel--right {
        padding: var(--spacing-4);
    }

    .pos-table-map-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
