<template>
    <div data-aos="fade-up">
        <div class="page-header d-flex align-items-center mb-4">
            <router-link to="/purchase-orders" class="btn btn-icon me-2">
                <i class="bi bi-arrow-left"></i>
            </router-link>
            <h2 class="page-title mb-0">Tạo Đơn nhập hàng mới</h2>
        </div>

        <Form :initial-values="initialValues" @submit="handleSubmit" :validation-schema="schema"
            v-slot="{ errors, values }">
            <div class="row">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Chi tiết Đơn hàng</h5>
                        </div>

                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width:40%">Nguyên liệu</th>
                                            <th style="width:20%">Số lượng</th>
                                            <th style="width:25%">Đơn giá (VND)</th>
                                            <th class="text-end">Thành tiền</th>
                                            <th class="text-end">Xoá</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <FieldArray name="items" v-slot="{ fields, push, remove }">
                                            <tr v-for="(field, idx) in fields" :key="field.key">
                                                <td>
                                                    <Field :name="`items[${idx}].ingredientId`" as="select"
                                                        class="form-select"
                                                        :class="{ 'is-invalid': errors?.items?.[idx]?.ingredientId }">
                                                        <option value="" disabled>Chọn nguyên liệu...</option>
                                                        <option v-for="ing in ingredients?.value || []" :key="ing.id"
                                                            :value="ing.id">
                                                            {{ ing.name }} ({{ ing.unit }})
                                                        </option>
                                                    </Field>
                                                    <ErrorMessage :name="`items[${idx}].ingredientId`"
                                                        class="invalid-feedback d-block" />
                                                </td>

                                                <td>
                                                    <Field :name="`items[${idx}].quantity`" type="number" step="0.01"
                                                        class="form-control"
                                                        :class="{ 'is-invalid': errors?.items?.[idx]?.quantity }" />
                                                    <ErrorMessage :name="`items[${idx}].quantity`"
                                                        class="invalid-feedback d-block" />
                                                </td>

                                                <td>
                                                    <Field :name="`items[${idx}].unitPrice`" type="number"
                                                        class="form-control"
                                                        :class="{ 'is-invalid': errors?.items?.[idx]?.unitPrice }" />
                                                    <ErrorMessage :name="`items[${idx}].unitPrice`"
                                                        class="invalid-feedback d-block" />
                                                </td>

                                                <td class="text-end fw-bold">
                                                    {{ formatMoney(calculateRowTotal(values.items?.[idx])) }}
                                                </td>

                                                <td class="text-end">
                                                    <button type="button" class="btn btn-sm btn-outline-danger"
                                                        @click="remove(idx)">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>

                                            <tr v-if="fields.length === 0">
                                                <td colspan="5" class="text-center text-muted">Chưa có mặt hàng nào.
                                                </td>
                                            </tr>

                                            <!-- Nút Thêm nằm trong scope FieldArray -->
                                            <tr>
                                                <td colspan="5">
                                                    <button type="button" class="btn btn-outline-primary"
                                                        @click="() => push({ ingredientId: '', quantity: 1, unitPrice: 0 })">
                                                        <i class="bi bi-plus-lg me-2"></i> Thêm mặt hàng
                                                    </button>
                                                </td>
                                            </tr>
                                        </FieldArray>
                                    </tbody>
                                </table>
                            </div>

                            <ErrorMessage name="items" class="text-danger d-block mt-2" />
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Thông tin chung</h5>
                        </div>

                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nhà cung cấp <span
                                        class="text-danger">*</span></label>
                                <Field name="supplierId" as="select" class="form-select"
                                    :class="{ 'is-invalid': errors.supplierId }">
                                    <option value="" disabled>Chọn nhà cung cấp...</option>
                                    <option v-for="sup in suppliers?.value || []" :key="sup.id" :value="sup.id">
                                        {{ sup.name }}
                                    </option>
                                </Field>
                                <ErrorMessage name="supplierId" class="invalid-feedback" />
                            </div>

                            <hr />

                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Tổng cộng:</h5>
                                <h4 class="mb-0 fw-bold text-danger">{{ formatMoney(calculateTotalAmount(values.items))
                                }}</h4>
                            </div>

                            <div class="d-grid mt-4">
                                <button type="submit" class="btn btn-primary btn-lg"
                                    :disabled="createMutation.isPending.value">
                                    <span v-if="createMutation.isPending.value"
                                        class="spinner-border spinner-border-sm me-2" role="status"
                                        aria-hidden="true"></span>
                                    Tạo Đơn hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Form, Field, FieldArray, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { createPurchaseOrder } from '@/api/purchaseOrderService'
import { getSuppliers } from '@/api/supplierService'
import { getAllIngredients } from '@/api/ingredientService'
import { formatMoney } from '@/utils/formatMoney.js'

// initial values
const initialValues = {
    supplierId: '',
    items: []
}

// validation
const schema = yup.object({
    supplierId: yup.number().required('Vui lòng chọn nhà cung cấp.'),
    items: yup.array()
        .of(
            yup.object({
                ingredientId: yup.number().required('Vui lòng chọn nguyên liệu.'),
                quantity: yup.number().required('Số lượng là bắt buộc').min(0.01, 'Số lượng phải lớn hơn 0'),
                unitPrice: yup.number().required('Đơn giá là bắt buộc').min(0, 'Đơn giá không thể âm')
            })
        )
        .min(1, 'Đơn hàng phải có ít nhất 1 mặt hàng.')
        .required()
})

const router = useRouter()
const queryClient = useQueryClient()

// data fetching
const { data: suppliers } = useQuery({ queryKey: ['allSuppliers'], queryFn: getSuppliers })
const { data: ingredients } = useQuery({ queryKey: ['allIngredients'], queryFn: getAllIngredients })

// mutation
const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (data) => {
        toast.success(`Tạo đơn hàng #${data.id} thành công!`)
        queryClient.invalidateQueries(['purchaseOrders'])
        router.push('/purchase-orders')
    },
    onError: (err) => {
        const msg = err?.response?.data?.message || 'Lỗi khi tạo đơn hàng.'
        toast.error(msg)
    }
})

// helpers
const calculateRowTotal = (item) => {
    if (!item) return 0
    const q = Number(item.quantity) || 0
    const p = Number(item.unitPrice) || 0
    return q * p
}

const calculateTotalAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((sum, it) => sum + calculateRowTotal(it), 0)
}

// submit
const handleSubmit = (values) => {
    const payload = {
        supplierId: Number(values.supplierId),


        expectedDate: values.expectedDate ? new Date(values.expectedDate).toISOString() : null,

        items: (values.items || []).map(i => ({
            ingredientId: Number(i.ingredientId),
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice)
        }))
    }

    console.log('Payload gửi API:', payload)
    createMutation.mutate(payload)
}
</script>

<style scoped>
.table-title {}

/* Tinh gọn giao diện */
.table .form-select,
.table .form-control {
    min-width: 120px;
}
</style>