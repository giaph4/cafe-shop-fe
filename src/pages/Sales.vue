<template>
    <div class="container-fluid" data-aos="fade-up">
        <h2 class="text-primary mb-4">Báo cáo & Thống kê</h2>

        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Doanh thu theo ngày</h5>
                        <apexchart type="bar" :options="dailyRevenueChart.options" :series="dailyRevenueChart.series"></apexchart>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Top sản phẩm bán chạy</h5>
                        <apexchart type="pie" :options="bestSellersChart.options" :series="bestSellersChart.series"></apexchart>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { getRevenueByDate, getBestSellers } from '@/api/reportService'
import { formatCurrency } from '@/utils/formatters'

const apexchart = VueApexCharts

const dailyRevenueChart = ref({
    options: {
        chart: { id: 'daily-revenue' },
        xaxis: { categories: [] },
        yaxis: { labels: { formatter: (val) => formatCurrency(val) } },
    },
    series: [{ name: 'Doanh thu', data: [] }],
})

const bestSellersChart = ref({
    options: {
        chart: { id: 'best-sellers' },
        labels: [],
    },
    series: [],
})

onMounted(async () => {
    try {
        const today = new Date()
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)

        const revenueData = await getRevenueByDate(
            sevenDaysAgo.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
        )
        dailyRevenueChart.value.options.xaxis.categories = Object.keys(revenueData)
        dailyRevenueChart.value.series[0].data = Object.values(revenueData)

        const bestSellersData = await getBestSellers(
            sevenDaysAgo.toISOString().split('T')[0],
            today.toISOString().split('T')[0],
            5
        )
        bestSellersChart.value.options.labels = bestSellersData.map(p => p.productName)
        bestSellersChart.value.series = bestSellersData.map(p => p.totalQuantitySold)

    } catch (error) {
        // Error handled silently
    }
})
</script>
