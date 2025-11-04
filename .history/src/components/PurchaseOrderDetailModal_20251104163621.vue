<template>
    <div class="modal fade" id="purchaseDetailModal" tabindex="-1" ref="modalElement">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Chi tiết Đơn nhập hàng #{{ orderId }}</h5>
                    <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
                </div>

                <div class="modal-body">
                    <div v-if="isLoading" class="text-center my-5">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>
                    <div v-else-if="isError" class="alert alert-danger">
                        Không thể tải chi tiết đơn hàng: {{ error.message }}
                    </div>

                    <div v-if="data">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Nhà cung cấp:</strong>
                                <p>{{ data.supplierName }}</p>
                            </div>
                            <div class="col-md-6">
                                <strong>Người đặt hàng:</strong>
                                <p>{{ data.userName }}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Ngày đặt:</strong>
                                <p>{{ new Date(data.orderDate).toLocaleDateString('vi-VN') }}</p>
                            </div>
                            <div class="col-md-4">
                                <strong>Trạng thái:</strong>
                                <p><span class="badge" :class="getStatusClass(data.status)">{{ data.status }}</span></p>
                            </div>
                            <div class="col-md-4">
                                <strong>Tổng cộng:</strong>
                                <p class="fw-bold fs-5 text-danger">{{ formatMoney(data.totalAmount) }}</p>
                            </div>
                        </div>

                        <h6 class="mt-4">Chi tiết mặt hàng:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr>
                                        <th>Nguyên liệu</th>
                                        <th class="text-end">Số lượng</th>
                                        <th class="text-end">Đơn giá</th>
                                        <th class="text-end">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in data.items" :key="item.id">
                                        <td>{{ item.ingredientName }}</td>
                                        <td class="text-end">{{ item.quantity }} ({{ item.ingredientUnit }})</td>
                                        <td class="text-end">{{ formatMoney(item.unitPrice) }}</td>
                                        <td class="text-end fw-bold">{{ formatMoney(item.quantity * item.unitPrice) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Modal } from 'bootstrap'
import { getPurchaseOrderById } from '@/api/purchaseOrderService'
import { formatMoney } from '@/utils/formatMoney.js'

const props = defineProps({
    orderId: Number
})
const emit = defineEmits(['close'])

const modalElement = ref(null)
const bsModal = ref(null)

const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchaseOrder', props.orderId],
    queryFn: () => getPurchaseOrderById(props.orderId),
    enabled: false // Chỉ chạy khi gọi refetch()
})

watch(() => props.orderId, (newId) => {
    if (newId) {
        refetch() // Gọi API khi có ID mới
        bsModal.value?.show()
    } else {
        bsModal.value?.hide()
    }
})

onMounted(() => {
    if (modalElement.value) {
        bsModal.value = new Modal(modalElement.value)
        modalElement.value.addEventListener('hidden.bs.modal', () => {
            emit('close')
        })
    }
})

onUnmounted(() => {
    bsModal.value?.dispose()
})

const closeModal = () => emit('close')

const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'bg-success'
    if (status === 'CANCELLED') return 'bg-danger'
    return 'bg-warning text-dark'
}
</script>