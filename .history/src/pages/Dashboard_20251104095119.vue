<template>
    <div class="container-fluid py-4" data-aos="fade-up">
        <div class="row g-4">
            <div class="col-md-4" v-for="card in stats" :key="card.title">
                <div class="card p-3 text-center">
                    <h6 class="text-muted">{{ card.title }}</h6>
                    <h2>{{ card.value }}</h2>
                    <small class="text-success">{{ card.percent }}% so với tháng trước</small>
                </div>
            </div>
        </div>

        <div class="row mt-4 g-4">
            <div class="col-lg-8">
                <div class="card p-3">
                    <h5 class="ms-3 mt-2">Tổng quan Doanh thu</h5>
                    <apexchart type="area" height="250" :options="chartOptions" :series="chartSeries" />
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card p-3 h-100">
                    <h5>Lợi nhuận</h5>
                    <h3>$5,078.78</h3>
                    <div class="progress mt-3" style="height: 10px">
                        <div class="progress-bar" role="progressbar" style="width: 68%; background-color: #a36b4a"
                            aria-valuenow="68" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p class="mt-2 text-muted">Profile is 68% more than last Month</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Đăng ký component apexchart
const apexchart = VueApexCharts

const stats = ref([
    { title: 'Total Income', value: '$1200', percent: 45 },
    { title: 'Total Expense', value: '4.500K', percent: -15 }, // Sửa đổi một chút cho đa dạng
    { title: 'Total Bonus', value: '6.100K', percent: 30 },
])

const chartOptions = ref({
    chart: {
        toolbar: { show: false },
        sparkline: { enabled: false },
    },
    colors: ['#A36B4A'], // Màu primary
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
        type: 'gradient',
        gradient: {
            shadeIntensity: 0.5,
            opacityFrom: 0.5,
            opacityTo: 0.1,
        },
    },
    xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: {
            style: {
                colors: '#3B2F2F',
                fontFamily: 'Inter',
            },
        },
    },
    yaxis: {
        labels: {
            style: {
                colors: '#3B2F2F',
                fontFamily: 'Inter',
            },
        },
    },
    tooltip: {
        theme: 'light',
    },
})

const chartSeries = ref([
    {
        name: 'Revenue',
        data: [2, 4, 10, 6, 8, 3, 5],
    },
])
</script>

<style scoped>
h2 {
    color: #a36b4a;
}

.text-success {
    color: #28a745 !important;
}
</style>