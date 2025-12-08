<template>
    <div class="trends-tab">
        <div v-if="!selectedStaffId" class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Vui lòng chọn nhân viên ở bộ lọc để xem xu hướng
        </div>
        <div v-else>
            <div class="card standard-card mb-4">
                <div class="card-header standard-card-header">
                    <h6 class="card-title mb-0">Xu hướng hiệu suất</h6>
                    <div class="d-flex gap-2">
                        <select class="form-select form-select-sm clean-input" v-model="period" style="width: auto;">
                            <option value="week">Theo tuần</option>
                            <option value="month">Theo tháng</option>
                        </select>
                        <button
                            class="btn btn-flat btn-flat--outline btn-sm"
                            @click="loadTrends"
                            :disabled="loading"
                        >
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-arrow-clockwise me-2"></i>
                            Tải lại
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <TrendsChart v-if="trendsData && trendsData.length > 0" :trends-data="trendsData" />
                    <EmptyState
                        v-else
                        title="Chưa có dữ liệu"
                        message="Chưa có dữ liệu xu hướng"
                    >
                        <template #icon>
                            <i class="bi bi-graph-up"></i>
                        </template>
                    </EmptyState>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStaffPerformanceStore } from '@/store/staffPerformance'
import TrendsChart from './TrendsChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const props = defineProps({
    selectedStaffId: {
        type: [String, Number],
        default: null
    }
})

const store = useStaffPerformanceStore()
const loading = computed(() => store.loading)
const trendsData = computed(() => store.trendsData)

const period = ref('week')

const loadTrends = async () => {
    if (!props.selectedStaffId) return
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    
    try {
        await store.getTrends({
            userId: props.selectedStaffId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            period: period.value
        })
    } catch (err) {
        console.error('Failed to load trends', err)
    }
}

watch([() => props.selectedStaffId, period], () => {
    if (props.selectedStaffId) {
        loadTrends()
    }
}, { immediate: true })

onMounted(() => {
    if (props.selectedStaffId) {
        loadTrends()
    }
})
</script>

<style scoped>
.trends-tab {
    font-family: var(--font-family-sans);
}

.alert {
    font-family: var(--font-family-sans);
    border-radius: var(--radius-sm);
    border: 1px solid;
    padding: var(--spacing-3) var(--spacing-4);
}

.alert-info {
    background: var(--color-soft-sky);
    border-color: var(--color-info);
    color: var(--color-text);
}

.alert i {
    color: var(--color-info);
}
</style>

