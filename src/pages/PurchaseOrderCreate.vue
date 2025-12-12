<template>
  <div
    class="purchase-order-create-page container-fluid"
    data-aos="fade-up"
    style="background: var(--color-body-bg); padding: var(--spacing-4);"
  >
    <div class="page-header d-flex align-items-center">
      <router-link
        to="/purchase-orders"
        class="btn btn-icon me-2"
      >
        <i class="bi bi-arrow-left" />
      </router-link>
      <h2 class="page-title mb-0">
        Tạo Đơn nhập hàng mới
      </h2>
    </div>

    <Form
      v-slot="{ errors, values }"
      :validation-schema="schema"
      @submit="handleSubmit"
    >
      <div class="row">
        <!-- Bảng chi tiết đơn hàng -->
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                Chi tiết Đơn hàng
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table align-middle">
                  <thead class="table-light">
                    <tr>
                      <th
                        scope="col"
                        style="width: 40%"
                      >
                        Nguyên liệu
                      </th>
                      <th
                        scope="col"
                        style="width: 20%"
                      >
                        Số lượng
                      </th>
                      <th
                        scope="col"
                        style="width: 25%"
                      >
                        Đơn giá (VND)
                      </th>
                      <th
                        scope="col"
                        class="text-end"
                      >
                        Thành tiền
                      </th>
                      <th
                        scope="col"
                        class="text-end"
                      >
                        Xoá
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <FieldArray
                      v-slot="{ fields, push, remove }"
                      name="items"
                    >
                      <tr
                        v-for="(field, idx) in fields"
                        :key="field.key"
                      >
                        <td>
                          <Field
                            :name="`items[${idx}].ingredientId`"
                            as="select"
                            class="form-select"
                            :class="{ 'is-invalid': errors[`items[${idx}].ingredientId`] }"
                          >
                            <option
                              value=""
                              disabled
                            >
                              Chọn nguyên liệu...
                            </option>
                            <option
                              v-for="ing in ingredients"
                              :key="ing.id"
                              :value="ing.id"
                            >
                              {{ ing.name }} ({{ ing.unit }})
                            </option>
                          </Field>
                          <ErrorMessage
                            :name="`items[${idx}].ingredientId`"
                            class="invalid-feedback d-block"
                          />
                        </td>

                        <td>
                          <Field
                            :name="`items[${idx}].quantity`"
                            type="number"
                            step="0.01"
                            class="form-control"
                            :class="{ 'is-invalid': errors[`items[${idx}].quantity`] }"
                          />
                          <ErrorMessage
                            :name="`items[${idx}].quantity`"
                            class="invalid-feedback d-block"
                          />
                        </td>

                        <td>
                          <Field
                            :name="`items[${idx}].unitPrice`"
                            type="number"
                            step="0.01"
                            class="form-control"
                            :class="{ 'is-invalid': errors[`items[${idx}].unitPrice`] }"
                          />
                          <ErrorMessage
                            :name="`items[${idx}].unitPrice`"
                            class="invalid-feedback d-block"
                          />
                        </td>

                        <td class="text-end fw-bold">
                          {{ formatCurrency(calculateRowTotal(field.value)) }}
                        </td>

                        <td class="text-end">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            @click="remove(idx)"
                          >
                            <i class="bi bi-trash" />
                          </button>
                        </td>
                      </tr>

                      <tr v-if="fields.length === 0">
                        <td
                          colspan="5"
                          class="text-center text-muted"
                        >
                          Chưa có mặt hàng nào.
                        </td>
                      </tr>

                      <tr>
                        <td colspan="5">
                          <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="push({ ingredientId: '', quantity: 1, unitPrice: 0 })"
                          >
                            <i class="bi bi-plus-lg me-2" /> Thêm mặt hàng
                          </button>
                          <ErrorMessage
                            name="items"
                            class="text-danger d-block mt-2"
                          />
                        </td>
                      </tr>
                    </FieldArray>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Cột thông tin chung -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                Thông tin chung
              </h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label fw-bold">
                  Nhà cung cấp <span class="text-danger">*</span>
                </label>
                <Field
                  name="supplierId"
                  as="select"
                  class="form-select"
                  :class="{ 'is-invalid': errors.supplierId }"
                >
                  <option
                    value=""
                    disabled
                  >
                    Chọn nhà cung cấp...
                  </option>
                  <option
                    v-for="sup in suppliers"
                    :key="sup.id"
                    :value="sup.id"
                  >
                    {{ sup.name }}
                  </option>
                </Field>
                <ErrorMessage
                  name="supplierId"
                  class="invalid-feedback"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Ngày dự kiến nhận</label>
                <Field
                  name="expectedDate"
                  type="date"
                  class="form-control"
                  :class="{ 'is-invalid': errors.expectedDate }"
                />
                <ErrorMessage
                  name="expectedDate"
                  class="invalid-feedback"
                />
              </div>

              <hr>

              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  Tổng cộng:
                </h5>
                <h4 class="mb-0 fw-bold text-danger">
                  {{ formatCurrency(calculateTotalAmount(values.items)) }}
                </h4>
              </div>

              <div class="d-grid mt-4">
                <button
                  type="submit"
                  class="btn btn-primary btn-lg"
                  :disabled="createMutation.isPending.value"
                >
                  <span
                    v-if="createMutation.isPending.value"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
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
import { useRouter } from 'vue-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { Form, Field, FieldArray, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'
import { toast } from 'vue3-toastify'
import { createPurchaseOrder } from '@/api/purchaseOrderService'
import { getSuppliers } from '@/api/supplierService'
import { getAllIngredients } from '@/api/ingredientService'
import { formatCurrency } from '@/utils/formatters'

const router = useRouter()
const queryClient = useQueryClient()

const { data: suppliers } = useQuery({
    queryKey: ['allSuppliers'],
    queryFn: getSuppliers
})
const { data: ingredients } = useQuery({
    queryKey: ['allIngredients'],
    queryFn: getAllIngredients
})

const schema = yup.object({
    supplierId: yup.number().required('Vui lòng chọn nhà cung cấp.'),
    expectedDate: yup.date().nullable(),
    items: yup
        .array()
        .of(
            yup.object({
                ingredientId: yup.number().required('Vui lòng chọn nguyên liệu.'),
                quantity: yup
                    .number()
                    .required('Số lượng là bắt buộc')
                    .min(0.01, 'Số lượng phải lớn hơn 0'),
                unitPrice: yup
                    .number()
                    .required('Đơn giá là bắt buộc')
                    .min(0.01, 'Đơn giá phải lớn hơn 0')
            })
        )
        .min(1, 'Đơn hàng phải có ít nhất 1 mặt hàng.')
        .required()
})

const calculateRowTotal = (item) => (item?.quantity || 0) * (item?.unitPrice || 0)
const calculateTotalAmount = (items) =>
    !items ? 0 : items.reduce((total, item) => total + calculateRowTotal(item), 0)

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
        supplierId: Number(values.supplierId),
        expectedDate: values.expectedDate
            ? `${values.expectedDate}T00:00:00`
            : null,
        items: values.items.map((item) => ({
            ingredientId: Number(item.ingredientId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
        }))
    }
    createMutation.mutate(payload)
}
</script>

<style scoped>
/* Header - Chuẩn hóa theo base.css */
.page-header {
    padding: var(--spacing-4);
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.page-header .btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    color: var(--color-heading);
    transition: all var(--transition-base);
}

.page-header .btn-icon:hover {
    background: var(--color-card-muted);
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.page-header .btn-icon i {
    font-size: 18px;
    line-height: 1;
}

.page-title {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-family: var(--font-family-sans);
}

/* Cards - Chuẩn hóa theo base.css */
.purchase-order-create-page :global(.card) {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    margin-bottom: var(--spacing-4);
}

.purchase-order-create-page :global(.card-header) {
    padding: var(--spacing-4);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-card);
}

.purchase-order-create-page :global(.card-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    margin: 0;
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.card-body) {
    padding: var(--spacing-4);
    background: var(--color-card);
}

/* Table - Minimal Table Styling */
.purchase-order-create-page :global(.table) {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
}

.purchase-order-create-page :global(.table thead),
.purchase-order-create-page :global(.table thead.table-light) {
    background: var(--color-card-muted);
}

.purchase-order-create-page :global(.table thead th) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-3);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.table tbody td) {
    font-size: var(--font-size-base);
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.table tbody tr:last-child td) {
    border-bottom: none;
}

.purchase-order-create-page :global(.table tbody tr:hover) {
    background: var(--color-card-muted);
}

.purchase-order-create-page :global(.table tbody .text-muted) {
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.fw-bold) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Form Controls - Clean Input Style */
.purchase-order-create-page :global(.form-label) {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-heading);
    margin-bottom: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.form-label.fw-bold) {
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.form-label .text-danger) {
    color: var(--color-danger);
}

.purchase-order-create-page :global(.form-control),
.purchase-order-create-page :global(.form-select) {
    height: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-base);
    transition: all var(--transition-base);
    background: var(--color-card);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.form-control:focus),
.purchase-order-create-page :global(.form-select:focus) {
    border-color: var(--color-primary);
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    box-shadow: none;
}

.purchase-order-create-page :global(.form-control.is-invalid),
.purchase-order-create-page :global(.form-select.is-invalid) {
    border-color: var(--color-danger);
}

.purchase-order-create-page :global(.form-control.is-invalid:focus),
.purchase-order-create-page :global(.form-select.is-invalid:focus) {
    outline-color: var(--color-danger);
}

.purchase-order-create-page :global(.invalid-feedback) {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    margin-top: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.text-danger) {
    color: var(--color-danger);
    font-size: var(--font-size-base);
    font-family: var(--font-family-sans);
}

/* Buttons - Flat Design */
.purchase-order-create-page :global(.btn) {
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-base);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.btn i) {
    font-size: 18px;
    line-height: 1;
}

.purchase-order-create-page :global(.btn-primary) {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
}

.purchase-order-create-page :global(.btn-primary:hover:not(:disabled)) {
    background: var(--color-primary-dark);
}

.purchase-order-create-page :global(.btn-primary:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
}

.purchase-order-create-page :global(.btn-outline-primary) {
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    background: var(--color-card);
}

.purchase-order-create-page :global(.btn-outline-primary:hover:not(:disabled)) {
    background: var(--color-soft-primary);
    border-color: var(--color-primary-dark);
    color: var(--color-primary-dark);
}

.purchase-order-create-page :global(.btn-outline-danger) {
    border-color: var(--color-border);
    color: var(--color-danger);
    background: transparent;
}

.purchase-order-create-page :global(.btn-outline-danger:hover:not(:disabled)) {
    background: var(--color-soft-rose);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

.purchase-order-create-page :global(.btn-sm) {
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-sm);
}

.purchase-order-create-page :global(.btn-lg) {
    padding: var(--spacing-3) var(--spacing-5);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(.btn-lg i) {
    font-size: 18px;
}

/* HR - Chuẩn hóa */
.purchase-order-create-page :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: var(--spacing-4) 0;
}

/* Total Amount Display */
.purchase-order-create-page :global(h4.fw-bold) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-danger);
    font-family: var(--font-family-sans);
}

.purchase-order-create-page :global(h5) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

/* Responsive */
@media (max-width: 992px) {
    .page-header {
        padding: var(--spacing-3);
    }

    .page-title {
        font-size: var(--font-size-lg);
    }

    .purchase-order-create-page :global(.card-body) {
        padding: var(--spacing-3);
    }

    .purchase-order-create-page :global(.table thead th),
    .purchase-order-create-page :global(.table tbody td) {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-base);
    }
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-2);
    }

    .purchase-order-create-page :global(.table-responsive) {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .purchase-order-create-page :global(.table) {
        min-width: 600px;
    }
}
</style>
