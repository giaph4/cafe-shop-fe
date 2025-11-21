<template>
    <div class="pos-container">
        <div class="row g-0">
            <!-- Main Content -->
            <div class="col-lg-7 col-md-6">
                <div class="main-content p-4">
                    <div v-if="currentView === 'tables'">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="page-title mb-0">Sơ đồ Bàn</h2>
                            <button class="btn btn-lg btn-success" @click="handleNewTakeaway">
                                <i class="bi bi-bag-check-fill me-2"></i>
                                Bán Mang Về
                            </button>
                        </div>
                        <PosTableMap @table-selected="handleTableSelected" />
                    </div>
                    <PosProductMenu v-else @product-selected="handleProductSelected" @back-to-tables="currentView = 'tables'" />
                </div>
            </div>

            <!-- Order Cart -->
            <div class="col-lg-5 col-md-6">
                <div class="sidebar-content border-start">
                    <PosOrderCart 
                        ref="orderCartRef"
                        :table="selectedTable" 
                        :order="fetchedOrder" 
                        @order-updated="handleOrderUpdated"
                        @create-new-takeaway="handleNewTakeaway"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import PosTableMap from '@/components/pos/PosTableMap.vue';
import PosProductMenu from '@/components/pos/PosProductMenu.vue';
import PosOrderCart from '@/components/pos/PosOrderCart.vue';
import { getPendingOrderByTable } from '@/api/orderService';
import { toast } from 'vue3-toastify';

const queryClient = useQueryClient();

const currentView = ref('tables'); // 'tables' or 'menu'
const selectedTable = ref(null); // Holds the selected table object
const orderCartRef = ref(null); // Ref to access PosOrderCart methods

// --- Data Fetching ---
const { data: fetchedOrder } = useQuery({
    queryKey: ['pendingOrder', selectedTable.value?.id],
    queryFn: () => {
        if (!selectedTable.value || selectedTable.value.status !== 'SERVING') {
            return null;
        }
        return getPendingOrderByTable(selectedTable.value.id);
    },
    enabled: computed(() => !!(selectedTable.value && selectedTable.value.status === 'SERVING')),
    retry: (failureCount, error) => {
        // Don't retry on 404s, it's an expected outcome (no order for the table)
        return error.response?.status !== 404 && failureCount < 2;
    },
    onError: (error) => {
        if (error.response?.status !== 404) {
            toast.error('Lỗi khi tải thông tin đơn hàng.');
        }
    }
});

// --- Event Handlers ---

const handleTableSelected = (table) => {
    selectedTable.value = table;
    currentView.value = 'menu'; // Switch to menu view when a table is selected
};

const handleProductSelected = (product) => {
    if (orderCartRef.value) {
        orderCartRef.value.addProduct(product);
    }
};

const handleOrderUpdated = () => {
    queryClient.invalidateQueries(['tables']);
    currentView.value = 'tables';
    selectedTable.value = null;
}

const handleNewTakeaway = () => {
    selectedTable.value = null;
    currentView.value = 'menu';
}

</script>

<style scoped>
.pos-container {
    height: calc(100vh - 60px); /* Full viewport height minus topbar */
    overflow: hidden;
}

.main-content, .sidebar-content {
    height: calc(100vh - 60px);
    overflow-y: auto;
}

.sidebar-content {
    background-color: #f8f9fa;
}
</style>
