<template>
  <div
    ref="containerRef"
    class="virtual-table"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <table class="table table-hover align-middle mb-0">
      <thead
        class="table-light"
        :style="{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-card)' }"
      >
        <tr>
          <slot name="header" />
        </tr>
      </thead>
    </table>
    <div
      class="virtual-table__spacer"
      :style="{ height: topSpacerHeight + 'px' }"
    />
    <table class="table table-hover align-middle mb-0">
      <tbody>
        <tr
          v-for="item in visibleItems"
          :key="getItemKey(item.data, item.index)"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot
            name="row"
            :item="item.data"
            :index="item.index"
          />
        </tr>
      </tbody>
    </table>
    <div
      class="virtual-table__spacer"
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
        default: 50
    },
    containerHeight: {
        type: Number,
        default: 400
    },
    overscan: {
        type: Number,
        default: 3
    },
    getItemKey: {
        type: Function,
        default: (item, index) => index
    }
})

const containerRef = ref(null)
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
    const index = Math.floor(scrollTop.value / props.itemHeight)
    return Math.max(0, index - props.overscan)
})

const endIndex = computed(() => {
    const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
    const index = startIndex.value + visibleCount + props.overscan * 2
    return Math.min(props.items.length, index)
})

const visibleItems = computed(() => props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
    data: item,
    index: startIndex.value + i
})))

const topSpacerHeight = computed(() => startIndex.value * props.itemHeight)

const bottomSpacerHeight = computed(() => {
    const remaining = props.items.length - endIndex.value
    return remaining * props.itemHeight
})

const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
}

const scrollToIndex = (index) => {
    if (!containerRef.value) return
    const targetScrollTop = index * props.itemHeight
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
.virtual-table {
    position: relative;
    overflow-y: auto;
    overflow-x: auto;
    will-change: scroll-position;
}

.virtual-table__spacer {
    width: 100%;
}

.virtual-table table {
    width: 100%;
    table-layout: fixed;
}

.virtual-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-card);
}
</style>

