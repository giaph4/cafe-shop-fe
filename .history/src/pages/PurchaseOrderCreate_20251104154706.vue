<template>
    <div data-aos="fade-up">
        <div class="page-header d-flex align-items-center mb-4">
            <router-link to="/purchase-orders" class="btn btn-icon me-2">
                <i class="bi bi-arrow-left"></i>
            </router-link>
            <h2 class="page-title mb-0">Tạo Đơn nhập hàng mới</h2>
        </div>

        <Form @submit="handleSubmit" :validation-schema="schema" v-slot="{ errors }">
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
                                            <th scope="col" style="width: 40%;">Nguyên liệu</th>
                                            <th scope="col" style="width: 20%;">Số lượng</th>
                                            <th scope="col" style="width: 25%;">Đơn giá (VND)</th>
                                            <th scope="col" class="text-end">Thành tiền</th>
                                            <th scope="col" class="text-end">Xoá</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <FieldArray name="items" v-slot="{ fields, push, remove }">
                                            <tr v-for="(field, idx) in fields" :key="field.key">
                                                <td>
                                                    <Field :name="`items[${idx}].ingredientId`" as="select"
                                                        class="form-select"
                                                        :class="{ 'is-invalid': errors[`items[${idx}].ingredientId`] }">
                                                        <option value="" disabled>Chọn nguyên liệu...</option>
                                                        <option v-for="ing in ingredients" :key="ing.id"
                                                            :value="ing.id">
                                                            {{ ing.name }} ({{ ing.unit }})
                                                        </option>
                                                    </Field>
                                                    <ErrorMessage :name="`items[${idx}].ingredientId`"
                                                        class="invalid-feedback" />
                                                </td>
                                                <td>
                                                    <Field :name="`items[${idx}].quantity`" type="number" step="0.01"
                                                        class="form-control"
                                                        :class="{ 'is-invalid': errors[`items[${idx}].quantity`] }" />
                                                </td>
                                                <td>
                                                    <Field :name="`items[${idx}].unitPrice`" type="number"
                                                        class="form-control"
                                                        :class="{ 'is-invalid': errors[`items[${idx}].unitPrice`] }" />
                                                </td>
                                                <td class="text-end fw-bold">
                                                    {{ formatMoney(calculateRowTotal(field.value)) }}
                                                </td>
                                                <td class="text-end">
                                                    <button type="button" class="btn btn-sm btn-outline-danger"
                                                        @click="remove(idx)">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>

                                            <tr v-if="fields.length === 0">
                                                <td colspan="5" class="text-center text-muted">
                                                    Chưa có mặt hàng nào.
                                                </td>
                                            </tr>
                                        </FieldArray>
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" class="btn btn-outline-primary" @click="addNewItem">
                                <i class="bi bi-plus-lg me-2"></i> Thêm mặt hàng
                            </button>
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
                                    <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                                        {{ sup.name }}
                                    </option>
                                </Field>
                                <ErrorMessage name="supplierId" class="invalid-feedback" />
                            </div>

                            <hr />

                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Tổng cộng:</h5>
                                <h4 class="mb-0 fw-bold text-danger">{{ formatMoney(totalAmount) }}</h4>
                            </div>

                            <div class="d-grid mt-4">
                                <button type="submit" class="btn btn-primary btn-lg"
                                    :disabled="createMutation.isPending.value">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Form, Field, FieldArray, ErrorMessage, useForm } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { createPurchaseOrder } from '@/api/purchaseOrderService'
import { getSuppliers } from '@/api/supplierService'
import { getAllIngredients } from '@/api/ingredientService' // Import hàm mới
import { formatMoney } from '@/utils/formatMoney.js'

const router = useRouter()
const queryClient = useQueryClient()

// Sử dụng useForm để lấy 'values' cho tính toán
const { values } = useForm()

// Data fetching cho các dropdown
const { data: suppliers } = useQuery({ queryKey: ['allSuppliers'], queryFn: getSuppliers })
const { data: ingredients } = useQuery({ queryKey: ['allIngredients'], queryFn: getAllIngredients })

// Validation Schema
const schema = yup.object({
    supplierId: yup.string().required('Vui lòng chọn nhà cung cấp.'),
    items: yup.array()
        .of(
            yup.object({
                ingredientId: yup.string().required('Vui lòng chọn nguyên liệu.'),
                quantity: yup.number().required('Số lượng là bắt buộc').min(0.01, 'Số lượng phải lớn hơn 0'),
                unitPrice: yup.number().required('Đơn giá là bắt buộc').min(0, 'Đơn giá không thể âm'),
            })
        )
        .min(1, 'Đơn hàng phải có ít nhất 1 mặt hàng.')
})

// Tính toán
const calculateRowTotal = (item) => {
    return (item.quantity || 0) * (item.unitPrice || 0)
}

const totalAmount = computed(() => {
    if (!values.items) return 0
    return values.items.reduce((total, item) => total + calculateRowTotal(item), 0)
})

const addNewItem = () => {
    const { push } = useFieldArray('items')
    push({ ingredientId: '', quantity: 1, unitPrice: 0 })
}

// Xử lý Submit
const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (data) => {
        toast.success(`Tạo đơn hàng #${data.id} thành công!`)
        queryClient.invalidateQueries(['purchaseOrders'])
        router.push('/purchase-orders')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi!')
})

const handleSubmit = (values) => {
    const payload = {
        ...values,
        items: values.items.map(item => ({
            ingredientId: Number(item.ingredientId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
        }))
    }
    createMutation.mutate(payload)
}
</script>