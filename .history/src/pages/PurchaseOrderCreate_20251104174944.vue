<template>
    <div data-aos="fade-up">
        <Form :initial-values="initialValues" @submit="handleSubmit" :validation-schema="schema"
            v-slot="{ errors, values }">
            <div class="row">
                <div class="col-lg-8">
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

                            <div class="mb-3">
                                <label class="form-label fw-bold">Ngày dự kiến nhận</label>
                                <Field name="expectedDate" type="date" class="form-control"
                                    :class="{ 'is-invalid': errors.expectedDate }" />
                                <ErrorMessage name="expectedDate" class="invalid-feedback" />
                            </div>
                            <hr />

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
    items: [],
    expectedDate: '' // <-- THÊM MỚI
}

// validation
const schema = yup.object({
    supplierId: yup.number().required('Vui lòng chọn nhà cung cấp.'),
    expectedDate: yup.date().nullable(), // <-- THÊM MỚI (optional)
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

// ... (data fetching và mutation không đổi) ...

// helpers
// ... (calculateRowTotal và calculateTotalAmount không đổi) ...

// submit
const handleSubmit = (values) => {
    const payload = {
        supplierId: Number(values.supplierId),
        
        // CẬP NHẬT: Gửi expectedDate (nếu có)
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