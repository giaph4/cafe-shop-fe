<template>
    <div>
        <div data-aos="fade-up" class="mb-3">
            <div class="d-flex flex-wrap align-items-center gap-2">
                <h2 class="page-title me-auto">Bán hàng</h2>
                <div class="input-group" style="max-width: 340px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input class="form-control" placeholder="Tìm sản phẩm..." v-model="searchKeyword" />
                </div>
                <select class="form-select" v-model="selectedCategoryId" style="max-width: 220px;">
                    <option :value="null">Tất cả danh mục</option>
                    <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <select class="form-select" v-model="orderType" style="max-width: 160px;">
                    <option value="TAKE_AWAY">Mang về</option>
                    <option value="AT_TABLE">Tại bàn</option>
                </select>
            </div>
        </div>

        <div class="row g-3">
            <!-- Menu -->
            <div class="col-12 col-lg-8">
                <div class="card">
                    <div class="card-body">
                        <div v-if="productsLoading" class="text-center my-4">
                            <span class="spinner-border text-primary"></span>
                        </div>
                        <div v-else class="row g-3">
                            <div class="col-6 col-md-4 col-lg-3" v-for="p in productsPage?.content || []" :key="p.id">
                                <div class="card h-100 product-tile" @click="addToCart(p)">
                                    <div class="ratio ratio-4x3"><img :src="getImageUrl(p)" class="card-img-top" /></div>
                                    <div class="card-body">
                                        <div class="fw-bold small text-muted">#{{ p.code }}</div>
                                        <div class="fw-bold">{{ p.name }}</div>
                                        <div class="text-primary">{{ formatPrice(p.price) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-end">
                        <Pagination v-if="productsPage" :current-page="productPage" :total-pages="productsPage.totalPages" @page-change="onChangeProductPage" />
                    </div>
                </div>
            </div>

            <!-- Bàn + Giỏ/Order -->
            <div class="col-12 col-lg-4">
                <div class="card mb-3">
                    <div class="card-header d-flex align-items-center">
                        <div class="fw-bold">Bàn</div>
                        <button class="btn btn-sm btn-outline-secondary ms-auto" @click="loadTables"><i class="bi bi-arrow-clockwise"></i></button>
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-wrap gap-2">
                            <button v-for="t in tables" :key="t.id" class="btn btn-sm" :class="getTableBtnClass(t)" @click="selectTable(t)">
                                {{ t.name }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header d-flex align-items-center">
                        <div class="fw-bold">Đơn hiện tại</div>
                        <div class="ms-auto small text-muted">{{ orderType === 'AT_TABLE' ? selectedTable?.name || 'Chưa chọn bàn' : 'Mang về' }}</div>
                    </div>
                    <div class="card-body">
                        <div v-if="activeOrder">
                            <div class="list-group mb-3">
                                <div class="list-group-item d-flex align-items-center" v-for="it in activeOrder.items" :key="it.id">
                                    <div class="flex-grow-1">
                                        <div class="fw-bold">{{ it.productName }}</div>
                                        <div class="small text-muted">{{ formatPrice(it.unitPrice) }}</div>
                                    </div>
                                    <div class="d-flex align-items-center gap-1">
                                        <button class="btn btn-sm btn-outline-secondary" @click="decreaseItem(it)">-</button>
                                        <span class="px-2">{{ it.quantity }}</span>
                                        <button class="btn btn-sm btn-outline-secondary" @click="increaseItem(it)">+</button>
                                        <button class="btn btn-sm btn-outline-danger ms-2" @click="removeItem(it)"><i class="bi bi-x"></i></button>
                                    </div>
                                </div>
                                <div v-if="!activeOrder.items || activeOrder.items.length===0" class="text-center text-muted py-3">Chưa có món.</div>
                            </div>

                            <div class="d-flex align-items-center mb-2">
                                <input class="form-control" placeholder="Mã voucher" v-model="voucherCode" />
                                <button class="btn btn-outline-primary ms-2" @click="applyVoucherToOrder">Áp dụng</button>
                                <button class="btn btn-outline-secondary ms-2" @click="removeVoucherFromOrder">Gỡ</button>
                            </div>
                            <div class="d-flex justify-content-between">
                                <div class="fw-bold">Tổng:</div>
                                <div class="fw-bold text-primary">{{ formatPrice(activeOrder.totalAmount) }}</div>
                            </div>
                        </div>
                        <div v-else class="text-center text-muted">Chưa có đơn.</div>
                    </div>
                    <div class="card-footer d-flex gap-2">
                        <button class="btn btn-outline-secondary" @click="resetCart">Làm mới</button>
                        <button class="btn btn-primary ms-auto" @click="createOrSubmitOrder">{{ activeOrder ? 'Gửi bếp' : 'Tạo đơn' }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import Pagination from '@/components/Pagination.vue'
import { getProducts } from '@/api/productService'
import { getTables } from '@/api/tableService'
import { createOrder, getPendingOrderByTable, addOrderItem, updateOrderItem, deleteOrderItem, applyVoucher, removeVoucher, payOrder, cancelOrder } from '@/api/orderService'
import { getCategories } from '@/api/categoryService'
import { toast } from 'vue3-toastify'

const queryClient = useQueryClient()

// Menu state
const productPage = ref(1)
const searchKeyword = ref('')
const selectedCategoryId = ref(null)
const productsPage = ref(null)
const productsLoading = ref(false)
const categories = ref([])

const loadProducts = async () => {
    productsLoading.value = true
    try {
        const data = await getProducts({ page: productPage.value - 1, size: 12, sort: 'createdAt,desc', keyword: searchKeyword.value, categoryId: selectedCategoryId.value })
        productsPage.value = data
    } catch (e) {
        toast.error('Không thể tải sản phẩm')
    } finally {
        productsLoading.value = false
    }
}
const onChangeProductPage = (p) => { productPage.value = p; loadProducts() }
watch([searchKeyword, selectedCategoryId], () => { productPage.value = 1; loadProducts() })

// Bàn
const tables = ref([])
const selectedTable = ref(null)
const orderType = ref('TAKE_AWAY')
const loadTables = async () => {
    try { tables.value = await getTables() } catch (e) { /* ignore */ }
}
const normalizeOrder = (raw) => {
    if (!raw) return null
    // Một số backend trả orderDetails thay vì items
    const details = raw.items || raw.orderDetails || []
    const normItems = details.map(d => ({
        id: d.id,
        productId: d.productId || d.product?.id,
        productName: d.productName || d.product?.name,
        unitPrice: d.unitPrice || d.price || d.product?.price || 0,
        quantity: d.quantity || 0,
        notes: d.notes || ''
    }))
    return { ...raw, items: normItems, totalAmount: raw.totalAmount ?? raw.total ?? raw.finalAmount ?? 0 }
}

const selectTable = async (t) => {
    selectedTable.value = t
    orderType.value = 'AT_TABLE'
    // nếu bàn đang SERVING, lấy order pending
    if (t.status === 'SERVING') {
        try {
            const data = await getPendingOrderByTable(t.id)
            activeOrder.value = normalizeOrder(data)
        } catch (e) {
            activeOrder.value = null
        }
    } else {
        activeOrder.value = null
    }
}
const getTableBtnClass = (t) => t.status === 'SERVING' ? 'btn-warning' : 'btn-outline-secondary'

// Order/Cart
const activeOrder = ref(null)
const tempCart = ref([])
const voucherCode = ref('')

const formatPrice = (v) => v == null ? '-' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
const getImageUrl = (p) => p?.imageUrl || `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1','')}/uploads/products/${p?.imageFileName || p?.image || ''}`

const addToCart = (p) => {
    if (activeOrder.value) {
        // Nếu đã có order: thêm trực tiếp vào order
        addOrderItem(activeOrder.value.id, { productId: p.id, quantity: 1 }).then((data) => {
            activeOrder.value = normalizeOrder(data)
        }).catch(() => toast.error('Không thể thêm món'))
    } else {
        // Cart tạm
        const found = tempCart.value.find(x => x.productId === p.id)
        if (found) found.quantity += 1; else tempCart.value.push({ productId: p.id, productName: p.name, unitPrice: p.price, quantity: 1 })
    }
}

const increaseItem = (it) => {
    if (!activeOrder.value) return
    updateOrderItem(activeOrder.value.id, it.id, { quantity: it.quantity + 1 }).then((data) => activeOrder.value = normalizeOrder(data)).catch(() => toast.error('Không thể cập nhật'))
}
const decreaseItem = (it) => {
    if (!activeOrder.value || it.quantity <= 1) return
    updateOrderItem(activeOrder.value.id, it.id, { quantity: it.quantity - 1 }).then((data) => activeOrder.value = normalizeOrder(data)).catch(() => toast.error('Không thể cập nhật'))
}
const removeItem = (it) => {
    if (!activeOrder.value) return
    deleteOrderItem(activeOrder.value.id, it.id).then((data) => activeOrder.value = normalizeOrder(data)).catch(() => toast.error('Không thể xoá'))
}

const resetCart = () => { tempCart.value = []; activeOrder.value = null; voucherCode.value = '' }

const createOrSubmitOrder = async () => {
    try {
        if (activeOrder.value) {
            toast.success('Đã gửi bếp!')
            return
        }
        if (tempCart.value.length === 0) {
            toast.warn('Chưa có món')
            return
        }
        if (orderType.value === 'AT_TABLE' && !selectedTable.value) {
            toast.warn('Chọn bàn trước khi tạo đơn tại bàn')
            return
        }
        const payload = {
            type: orderType.value,
            items: tempCart.value.map(x => ({ productId: x.productId, quantity: x.quantity }))
        }
        if (orderType.value === 'AT_TABLE' && selectedTable.value?.id) payload.tableId = selectedTable.value.id
        // loại bỏ field null/undefined
        Object.keys(payload).forEach(k => (payload[k] == null || payload[k] === '') && delete payload[k])
        const data = await createOrder(payload)
        activeOrder.value = normalizeOrder(data)
        tempCart.value = []
        toast.success('Tạo đơn thành công')
        // Reload bàn để cập nhật trạng thái SERVING
        loadTables()
    } catch (e) {
        toast.error('Không thể tạo đơn')
    }
}

const applyVoucherToOrder = async () => {
    if (!activeOrder.value || !voucherCode.value) return
    try { activeOrder.value = normalizeOrder(await applyVoucher(activeOrder.value.id, voucherCode.value)) } catch (e) { toast.error('Voucher không hợp lệ') }
}
const removeVoucherFromOrder = async () => {
    if (!activeOrder.value) return
    try { activeOrder.value = normalizeOrder(await removeVoucher(activeOrder.value.id)) } catch (e) { toast.error('Không thể gỡ voucher') }
}

onMounted(async () => {
    try { categories.value = await getCategories() } catch {}
    await loadProducts()
    await loadTables()
})
</script>

<style scoped>
.page-title { color: #A36B4A; }
.product-tile { cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
.product-tile:hover { transform: translateY(-2px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.08); }
</style>

