<template>
    <div class="expenses-page">
        <div class="header d-flex align-items-center justify-content-between mb-3">
            <h2 class="mb-0">Quản lý chi phí</h2>
            <button class="btn btn-primary" @click="openAddModal">+ Thêm chi phí</button>
        </div>

        <!-- Bộ lọc -->
        <div class="filters card p-3 mb-3">
            <div class="row g-3">
                <div class="col-md-3">
                    <input type="text" class="form-control" placeholder="Tìm kiếm chi phí..." v-model="filters.search"
                        @input="handleSearch" />
                </div>
                <div class="col-md-3">
                    <input type="date" class="form-control" v-model="filters.startDate" @change="handleFilterChange" />
                </div>
                <div class="col-md-3">
                    <input type="date" class="form-control" v-model="filters.endDate" @change="handleFilterChange" />
                </div>
                <div class="col-md-3">
                    <select class="form-select" v-model="filters.category" @change="handleFilterChange">
                        <option value="">Tất cả loại chi phí</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Bảng chi phí -->
        <div class="card">
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Ngày</th>
                            <th>Loại chi phí</th>
                            <th>Mô tả</th>
                            <th>Số tiền (VNĐ)</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(expense, index) in filteredExpenses" :key="expense.id">
                            <td>{{ (filters.page - 1) * filters.limit + index + 1 }}</td>
                            <td>{{ formatDate(expense.expenseDate) }}</td>
                            <td>{{ expense.category }}</td>
                            <td>{{ expense.description || 'Không có mô tả' }}</td>
                            <td>{{ formatCurrency(expense.amount) }}</td>
                            <td>
                                <button class="btn btn-sm btn-warning me-1" @click="openEditModal(expense)">
                                    Sửa
                                </button>
                                <button class="btn btn-sm btn-danger" @click="confirmDelete(expense.id)">
                                    Xóa
                                </button>
                            </td>
                        </tr>
                        <tr v-if="filteredExpenses.length === 0">
                            <td colspan="6" class="text-center py-4">Không có dữ liệu</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Phân trang -->
        <Pagination v-if="pageData" :current-page="filters.page" :total-pages="pageData.totalPages"
            @page-change="onPageChange" />

        <!-- Modal thêm/sửa -->
        <div class="modal fade" id="expenseModal" tabindex="-1" aria-labelledby="expenseModalLabel" aria-hidden="true"
            ref="modalRef">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="expenseModalLabel">
                            {{ isEditing ? 'Sửa chi phí' : 'Thêm chi phí' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" />
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="handleSubmit">
                            <div class="mb-3">
                                <label class="form-label">Ngày chi</label>
                                <input type="date" class="form-control" v-model="form.expenseDate" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Loại chi phí</label>
                                <select class="form-select" v-model="form.category" required>
                                    <option value="">Chọn loại chi phí</option>
                                    <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                                        {{ cat.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Số tiền</label>
                                <input type="number" class="form-control" v-model="form.amount" min="1000" required />
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Mô tả</label>
                                <textarea class="form-control" v-model="form.description" rows="2"></textarea>
                            </div>

                            <div class="text-end">
                                <button type="submit" class="btn btn-success">
                                    {{ isEditing ? 'Cập nhật' : 'Thêm mới' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from '@/api/axios'
import Pagination from '@/components/Pagination.vue'

export default {
    components: { Pagination },
    data() {
        return {
            expenses: [],
            categories: [],
            pageData: null,
            filters: {
                page: 1,
                limit: 10,
                search: '',
                startDate: '',
                endDate: '',
                category: ''
            },
            form: {
                id: null,
                expenseDate: '',
                category: '',
                amount: '',
                description: ''
            },
            isEditing: false,
            modalRef: null
        }
    },
    computed: {
        filteredExpenses() {
            const lowerCaseQuery = this.filters.search.toLowerCase()
            return this.expenses.filter((expense) => {
                const matchSearch =
                    expense.category.toLowerCase().includes(lowerCaseQuery) ||
                    (expense.description &&
                        expense.description.toLowerCase().includes(lowerCaseQuery))

                const matchCategory =
                    !this.filters.category || expense.category === this.filters.category

                const matchDate =
                    (!this.filters.startDate ||
                        new Date(expense.expenseDate) >= new Date(this.filters.startDate)) &&
                    (!this.filters.endDate ||
                        new Date(expense.expenseDate) <= new Date(this.filters.endDate))

                return matchSearch && matchCategory && matchDate
            })
        }
    },
    mounted() {
        this.filters.startDate = this.getFirstDayOfMonth()
        this.filters.endDate = this.getTodayDate()
        this.fetchExpenses()
        this.fetchCategories()
        this.modalRef = new bootstrap.Modal(this.$refs.modalRef)
    },
    methods: {
        async fetchExpenses() {
            try {
                const res = await axios.get('/expenses', { params: this.filters })
                this.expenses = res.data.items
                this.pageData = {
                    totalPages: res.data.totalPages,
                    totalItems: res.data.totalItems
                }
            } catch (err) {
                console.error('Lỗi tải chi phí:', err)
            }
        },
        async fetchCategories() {
            try {
                const res = await axios.get('/expense-categories')
                this.categories = res.data
            } catch (err) {
                console.error('Lỗi tải loại chi phí:', err)
            }
        },
        handleSearch() {
            this.filters.page = 1
            this.fetchExpenses()
        },
        handleFilterChange() {
            this.filters.page = 1
            this.fetchExpenses()
        },
        onPageChange(page) {
            this.filters.page = page
            this.fetchExpenses()
        },
        openAddModal() {
            this.resetForm()
            this.isEditing = false
            this.modalRef.show()
        },
        openEditModal(expense) {
            this.isEditing = true
            this.form = { ...expense }
            this.modalRef.show()
        },
        async handleSubmit() {
            try {
                if (this.isEditing) {
                    await axios.put(`/expenses/${this.form.id}`, this.form)
                } else {
                    await axios.post('/expenses', this.form)
                }
                this.modalRef.hide()
                this.fetchExpenses()
            } catch (err) {
                console.error('Lỗi lưu chi phí:', err)
            }
        },
        confirmDelete(id) {
            if (confirm('Bạn có chắc muốn xóa chi phí này?')) {
                this.deleteExpense(id)
            }
        },
        async deleteExpense(id) {
            try {
                await axios.delete(`/expenses/${id}`)
                this.fetchExpenses()
            } catch (err) {
                console.error('Lỗi xóa chi phí:', err)
            }
        },
        resetForm() {
            this.form = {
                id: null,
                expenseDate: this.getTodayDate(),
                category: '',
                amount: '',
                description: ''
            }
        },
        formatDate(dateString) {
            if (!dateString) return 'N/A'
            const date = new Date(dateString)
            return `${String(date.getDate()).padStart(2, '0')}/${String(
                date.getMonth() + 1
            ).padStart(2, '0')}/${date.getFullYear()}`
        },
        formatCurrency(amount) {
            return new Intl.NumberFormat('vi-VN').format(amount)
        },
        getTodayDate() {
            return new Date().toISOString().split('T')[0]
        },
        getFirstDayOfMonth() {
            const date = new Date()
            date.setDate(1)
            return date.toISOString().split('T')[0]
        }
    }
}
</script>

<style scoped>
.expenses-page {
    padding: 20px;
}

.table th {
    white-space: nowrap;
}
</style>