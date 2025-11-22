<template>
    <div class="pos-container container-fluid" data-aos="fade-up">
        <header class="pos-header">
            <div>
                <h2 class="pos-header__title">Điều phối POS</h2>
                <p class="pos-header__subtitle mb-0">Chọn món trước hoặc chọn bàn trước, đồng bộ theo nhu cầu phục vụ.</p>
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

        <div class="row g-0">
            <!-- Main Content -->
            <div class="col-lg-7 col-md-6">
                <div class="main-content p-4">
                    <transition name="fade" mode="out-in">
                        <div v-if="viewState.mode === 'tables'">
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
            </div>

            <!-- Order Cart -->
            <div class="col-lg-5 col-md-6">
                <div class="sidebar-content border-start sticky-sidebar">
                    <section class="sidebar-card mb-4">
                        <header class="sidebar-card__header">
                            <div>
                                <h5 class="mb-1">Đơn mang về đang chờ</h5>
                                <p class="mb-0 text-muted small">Chọn để tiếp tục xử lý hoặc thanh toán.</p>
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
                        </header>

                        <div v-if="pendingTakeawayOrders.length === 0" class="text-center text-muted py-3">
                            <i class="bi bi-bag-dash fs-3 d-block mb-2"></i>
                            Chưa có đơn mang về nào đang chờ.
                        </div>
                        <ul v-else class="list-group takeaway-list">
                            <li
                                v-for="order in pendingTakeawayOrders"
                                :key="order.id"
                                :class="['list-group-item', { active: order.id === selectedTakeawayOrder?.id }]"
                                @click="handleTakeawaySelected(order)"
                            >
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div class="fw-semibold">Đơn #{{ order.id }}</div>
                                        <small class="text-muted">Tạo lúc {{ formatDateTime(order.createdAt) }}</small>
                                    </div>
                                    <div class="text-end">
                                        <div class="fw-semibold text-primary">{{ formatCurrency(order.totalAmount) }}</div>
                                        <small class="text-muted">{{ order.orderDetails?.length || 0 }} món</small>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section v-if="selectedTable" class="sidebar-card mb-4">
                        <header class="sidebar-card__header">
                            <div>
                                <h5 class="mb-1">Bàn đang phục vụ</h5>
                                <p class="mb-0 text-muted small">Theo dõi trạng thái và gán đơn nháp.</p>
                            </div>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary"
                                @click="startTableSelection"
                            >
                                <i class="bi bi-arrow-repeat me-1"></i>
                                Đổi bàn
                            </button>
                        </header>

                        <article class="table-meta">
                            <div class="table-meta__identity">
                                <div class="table-meta__badge" :class="`tone-${selectedTableStatusMeta.tone}`">
                                    <i class="bi" :class="selectedTableStatusMeta.icon"></i>
                                    <span>{{ selectedTableStatusMeta.label }}</span>
                                </div>
                                <div>
                                    <h4 class="mb-1">{{ selectedTable.name }}</h4>
                                    <p class="mb-0 text-muted small">Sức chứa: {{ selectedTable.capacity }} chỗ</p>
                                </div>
                            </div>

                            <div class="table-meta__controls">
                                <label class="form-label small text-muted mb-2">Cập nhật trạng thái</label>
                                <select
                                    class="form-select form-select-sm"
                                    :value="selectedTable.status"
                                    @change="handleTableStatusChange($event.target.value)"
                                    :disabled="isUpdatingTableStatus"
                                >
                                    <option v-for="option in TABLE_STATUS_OPTIONS" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                                <div v-if="isUpdatingTableStatus" class="mt-2 d-flex align-items-center gap-2 text-muted small">
                                    <span class="spinner-border spinner-border-sm"></span>
                                    Đang cập nhật trạng thái bàn...
                                </div>
                            </div>
                        </article>
                    </section>

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
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query'
import PosTableMap from '@/components/pos/PosTableMap.vue'
import PosProductMenu from '@/components/pos/PosProductMenu.vue'
import PosOrderCart from '@/components/pos/PosOrderCart.vue'
import { getPendingOrderByTable, getOrdersByStatus } from '@/api/orderService'
import { updateTableStatus, TABLE_STATUS_OPTIONS } from '@/api/tableService'
import { toast } from 'vue3-toastify'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

const viewState = reactive({
    mode: 'menu', // 'tables' | 'menu'
    intent: 'product-first', // 'table-first' | 'product-first' | 'takeaway'
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

const DEFAULT_TABLE_STATUS_META = Object.freeze({
    label: 'Không xác định',
    tone: 'neutral',
    icon: 'bi-question-circle'
})

const TABLE_STATUS_METADATA = Object.freeze({
    EMPTY: { label: 'Còn trống', tone: 'success', icon: 'bi-check-circle' },
    AVAILABLE: { label: 'Sẵn sàng', tone: 'info', icon: 'bi-arrow-repeat' },
    SERVING: { label: 'Đang phục vụ', tone: 'warning', icon: 'bi-cup-hot' },
    RESERVED: { label: 'Đã đặt trước', tone: 'danger', icon: 'bi-bookmark-check' },
    PENDING: { label: 'Đang chờ', tone: 'neutral', icon: 'bi-hourglass-split' }
})

const resolveTableStatusMeta = (status) => TABLE_STATUS_METADATA[status] || DEFAULT_TABLE_STATUS_META
const selectedTableStatusMeta = computed(() => resolveTableStatusMeta(selectedTable.value?.status))

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
    onError: (error) => {
        if (error.response?.status !== 404) {
            toast.error('Lỗi khi tải thông tin đơn hàng.')
        }
    }
})

const tableStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTableStatus({ id, status }),
    onSuccess: (updatedTable) => {
        selectedTable.value = updatedTable
        queryClient.invalidateQueries(['tables'])
        toast.success(`Đã cập nhật trạng thái bàn "${updatedTable.name}".`)
    },
    onError: (error) => {
        const message = error?.response?.data?.message || error?.message || 'Cập nhật trạng thái bàn thất bại.'
        toast.error(message)
    }
})

const isUpdatingTableStatus = computed(() => tableStatusMutation.isPending.value)

watch(selectedTable, (table) => {
    if (!table) {
        viewState.intent = viewState.intent === 'table-first' ? 'product-first' : viewState.intent
        queryClient.removeQueries({ queryKey: ['pendingOrder'] })
        selectedTakeawayOrder.value = null
    }
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

const handleTableStatusChange = (nextStatus) => {
    if (!selectedTable.value) return
    if (nextStatus === selectedTable.value.status) return
    tableStatusMutation.mutate({ id: selectedTable.value.id, status: nextStatus })
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

</script>

<style scoped>
.pos-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.pos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-soft);
}

.pos-header__title {
    font-weight: 700;
    color: var(--color-heading);
    margin-bottom: 0.25rem;
}

.pos-header__subtitle {
    color: var(--color-text-muted);
}

.pos-header__actions {
    display: inline-flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.sidebar-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
}

.sticky-sidebar {
    position: sticky;
    top: 1rem;
    align-self: flex-start;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    overflow-x: hidden;
}

.sticky-sidebar::-webkit-scrollbar {
    width: 6px;
}

.sticky-sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.sticky-sidebar::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;
}

.sticky-sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
}

.sidebar-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-soft);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.sidebar-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
    padding-bottom: 0.75rem;
}

.table-meta {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.table-meta__identity {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.table-meta__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
}

.table-meta__badge.tone-success {
    background: rgba(34, 197, 94, 0.18);
    color: #166534;
}

.table-meta__badge.tone-warning {
    background: rgba(234, 179, 8, 0.18);
    color: #92400e;
}

.table-meta__badge.tone-danger {
    background: rgba(239, 68, 68, 0.18);
    color: #b91c1c;
}

.table-meta__badge.tone-info {
    background: rgba(59, 130, 246, 0.18);
    color: #1d4ed8;
}

.table-meta__badge.tone-neutral {
    background: rgba(148, 163, 184, 0.22);
    color: #475569;
}

.table-meta__controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.dark-theme .sidebar-content {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
    border-left: 1px solid rgba(129, 140, 248, 0.28);
}

.dark-theme .sidebar-card {
    border-color: rgba(129, 140, 248, 0.28);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(17, 24, 39, 0.92));
}

.dark-theme .table-meta__badge.tone-neutral {
    background: rgba(148, 163, 184, 0.22);
    color: #e2e8f0;
}

.comfort-theme .sidebar-content {
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

.comfort-theme .sidebar-card {
    border-color: rgba(95, 111, 148, 0.25);
    background: linear-gradient(170deg, rgba(245, 241, 235, 0.98), rgba(236, 232, 226, 0.92));
}

@media (max-width: 992px) {
    .pos-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .pos-header__actions {
        width: 100%;
        justify-content: flex-start;
    }

    .sticky-sidebar {
        position: relative;
        top: 0;
        max-height: none;
    }
}
</style>
