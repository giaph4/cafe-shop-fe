<template>
    <div class="revenue">
        <div class="revenue__grid">
            <div class="card chart-card">
                <div class="card-header">
                    <h5>Doanh thu theo ngày</h5>
                    <p>Trực quan hóa doanh thu trong giai đoạn đã chọn</p>
                </div>
                <apexchart type="area" height="320" :series="revenueSeries" :options="revenueOptions"/>
            </div>

            <div class="card chart-card">
                <div class="card-header">
                    <h5>Lợi nhuận</h5>
                    <p>So sánh doanh thu và lợi nhuận trong kỳ</p>
                </div>
                <apexchart type="bar" height="320" :series="profitSeries" :options="profitOptions"/>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h5>Doanh thu theo danh mục</h5>
            </div>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                    <tr>
                        <th>Danh mục</th>
                        <th class="text-end">Số lượng</th>
                        <th class="text-end">Doanh thu</th>
                        <th class="text-end">Tỷ trọng</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="item in categorySales" :key="item.categoryName">
                        <td>{{ item.categoryName }}</td>
                        <td class="text-end">{{ item.totalQuantity }}</td>
                        <td class="text-end">{{ formatCurrency(item.totalRevenue) }}</td>
                        <td class="text-end">
                            <span class="badge bg-dark">{{ item.revenuePercentage?.toFixed(2) ?? 0 }}%</span>
                        </td>
                    </tr>
                    <tr v-if="!categorySales?.length">
                        <td colspan="4">
                            <EmptyState message="Chưa có doanh thu theo danh mục"/>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="revenue__grid">
            <div class="card">
                <div class="card-header">
                    <h5>Doanh thu theo khung giờ ({{ hourlySalesTitle }})</h5>
                </div>
                <div class="hourly-grid" v-if="hourlySales?.length">
                    <div v-for="bucket in hourlySales" :key="bucket.hour" class="hourly-card">
                        <span class="hourly-card__hour">{{ bucket.hour }}h</span>
                        <strong>{{ formatCurrency(bucket.revenue) }}</strong>
                        <span class="hourly-card__orders">{{ bucket.orderCount }} đơn</span>
                    </div>
                </div>
                <EmptyState v-else message="Chưa có thống kê theo giờ"/>
            </div>

            <div class="card">
                <div class="card-header">
                    <h5>Sản phẩm bán chạy</h5>
                    <p>Tổng kết doanh số theo sản phẩm</p>
                </div>
                <div v-if="productSummary" class="product-summary">
                    <div class="product-summary__headline">
                        <div>
                            <span>Tổng số lượng</span>
                            <strong>{{ productSummary.totalQuantitySold }}</strong>
                        </div>
                        <div>
                            <span>Tổng doanh thu</span>
                            <strong>{{ formatCurrency(productSummary.totalRevenueGenerated) }}</strong>
                        </div>
                    </div>
                    <div class="product-summary__list">
                        <div v-for="product in topProducts" :key="product.productId" class="product-summary__item">
                            <div class="product-summary__name">{{ product.productName }}</div>
                            <div class="product-summary__metrics">
                                <span>{{ product.totalQuantitySold }} sp</span>
                                <strong>{{ formatCurrency(product.totalRevenueGenerated) }}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <EmptyState v-else message="Chưa có dữ liệu sản phẩm"/>
            </div>
        </div>
    </div>
</template>

<script setup>
import {computed} from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import EmptyState from '@/components/common/EmptyState.vue'
import {formatCurrency} from '@/utils/formatters'

const apexchart = VueApexCharts

const props = defineProps({
    revenueSeries: {type: Array, default: () => []},
    revenueOptions: {type: Object, default: () => ({})},
    profitSeries: {type: Array, default: () => []},
    profitOptions: {type: Object, default: () => ({})},
    categorySales: {type: Array, default: () => []},
    hourlySales: {type: Array, default: () => []},
    productSummary: {type: Object, default: null}
})

const hourlySalesTitle = computed(() => {
    if (!props.hourlySales?.length) return ''
    const date = new Date()
    return date.toLocaleDateString('vi-VN')
})

const topProducts = computed(() => props.productSummary?.products?.slice(0, 5) ?? [])
</script>

<style scoped>
.revenue {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.revenue__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
}

.chart-card .card-header {
    border-bottom: none;
    margin-bottom: 1rem;
}

.hourly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.9rem;
}

.hourly-card {
    border-radius: 16px;
    border: 1px solid var(--color-border);
    padding: 0.85rem;
    background: var(--color-card-muted);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.hourly-card__hour {
    font-weight: 600;
}

.hourly-card__orders {
    font-size: 0.78rem;
    color: var(--color-text-muted);
}

.product-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.product-summary__headline {
    display: flex;
    gap: 1.5rem;
    background: var(--color-soft-primary);
    border-radius: 16px;
    padding: 1rem 1.4rem;
}

.product-summary__headline > div {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.product-summary__headline span {
    font-size: 0.8rem;
    color: var(--color-text-muted);
}

.product-summary__list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.product-summary__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.8rem;
}

.product-summary__name {
    font-weight: 600;
}

.product-summary__metrics {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

@media (max-width: 992px) {
    .product-summary__headline {
        flex-direction: column;
    }
}
</style>
