<template>
  <div
    ref="containerRef"
    class="virtual-grid"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div
      class="virtual-grid__spacer"
      :style="{ height: topSpacerHeight + 'px' }"
    />
    <div
      class="virtual-grid__items"
      :style="gridStyle"
    >
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item.data, item.index)"
        class="virtual-grid__item"
        :style="itemStyle"
      >
        <slot
          :item="item.data"
          :index="item.index"
        />
      </div>
    </div>
    <div
      class="virtual-grid__spacer"
      :style="{ height: bottomSpacerHeight + 'px' }"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
    items: {
        type: Array,
        required: true,
        default: () => []
    },
    itemHeight: {
        type: Number,
        required: true,
        default: 200
    },
    itemWidth: {
        type: Number,
        default: 200
    },
    containerHeight: {
        type: Number,
        default: 400
    },
    columns: {
        type: Number,
        default: 3
    },
    gap: {
        type: Number,
        default: 16
    },
    overscan: {
        type: Number,
        default: 2
    },
    getItemKey: {
        type: Function,
        default: (item, index) => index
    }
})

const containerRef = ref(null)
const scrollTop = ref(0)

const rowsPerPage = computed(() => Math.ceil(props.containerHeight / (props.itemHeight + props.gap)))
const totalRows = computed(() => Math.ceil(props.items.length / props.columns))
const totalHeight = computed(() => totalRows.value * (props.itemHeight + props.gap) - props.gap)

const startRow = computed(() => {
    const row = Math.floor(scrollTop.value / (props.itemHeight + props.gap))
    return Math.max(0, row - props.overscan)
})

const endRow = computed(() => {
    const visibleRows = rowsPerPage.value
    const row = startRow.value + visibleRows + props.overscan * 2
    return Math.min(totalRows.value, row)
})

const visibleItems = computed(() => {
    const startIndex = startRow.value * props.columns
    const endIndex = endRow.value * props.columns
    return props.items.slice(startIndex, endIndex).map((item, i) => ({
        data: item,
        index: startIndex + i
    }))
})

const topSpacerHeight = computed(() => startRow.value * (props.itemHeight + props.gap))

const bottomSpacerHeight = computed(() => {
    const remainingRows = totalRows.value - endRow.value
    return remainingRows * (props.itemHeight + props.gap)
})

const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${props.columns}, ${props.itemWidth}px)`,
    gap: `${props.gap}px`,
    justifyContent: 'center'
}))

const itemStyle = computed(() => ({
    height: `${props.itemHeight}px`,
    width: `${props.itemWidth}px`
}))

const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
}

const scrollToIndex = (index) => {
    if (!containerRef.value) return
    const row = Math.floor(index / props.columns)
    const targetScrollTop = row * (props.itemHeight + props.gap)
    containerRef.value.scrollTop = targetScrollTop
}

const scrollToItem = (item) => {
    const index = props.items.findIndex(i => i === item)
    if (index !== -1) {
        scrollToIndex(index)
    }
}

defineExpose({
    scrollToIndex,
    scrollToItem
})

watch(() => props.items.length, () => {
    if (scrollTop.value > totalHeight.value) {
        nextTick(() => {
            if (containerRef.value) {
                containerRef.value.scrollTop = 0
            }
        })
    }
})
</script>

<style scoped>
.virtual-grid {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    will-change: scroll-position;
}

.virtual-grid__spacer {
    width: 100%;
}

.virtual-grid__items {
    position: relative;
}

.virtual-grid__item {
    position: relative;
}
</style>

