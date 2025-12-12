/**
 * Example usage of Virtual Scrolling components
 *
 * This file demonstrates how to use VirtualList, VirtualTable, and VirtualGrid
 * in your Vue components.
 */

// Example 1: Using VirtualList for a simple list
/*
<template>
  <VirtualList
    :items="items"
    :item-height="60"
    :container-height="500"
    :overscan="3"
  >
    <template #default="{ item, index }">
      <div class="list-item">
        <h4>{{ item.name }}</h4>
        <p>{{ item.description }}</p>
      </div>
    </template>
  </VirtualList>
</template>

<script setup>
import { ref } from 'vue'
import VirtualList from '@/components/common/VirtualList.vue'

const items = ref([
  { id: 1, name: 'Item 1', description: 'Description 1' },
  // ... thousands of items
])
</script>
*/

// Example 2: Using VirtualTable for a table
/*
<template>
  <VirtualTable
    :items="products"
    :item-height="50"
    :container-height="600"
    :overscan="5"
  >
    <template #header>
      <th>ID</th>
      <th>Name</th>
      <th>Price</th>
      <th>Actions</th>
    </template>
    <template #row="{ item, index }">
      <td>{{ item.id }}</td>
      <td>{{ item.name }}</td>
      <td>{{ formatCurrency(item.price) }}</td>
      <td>
        <button @click="editItem(item)">Edit</button>
      </td>
    </template>
  </VirtualTable>
</template>

<script setup>
import { ref } from 'vue'
import VirtualTable from '@/components/common/VirtualTable.vue'
import { formatCurrency } from '@/utils/formatters'

const products = ref([
  // ... thousands of products
])
</script>
*/

// Example 3: Using VirtualGrid for a grid layout
/*
<template>
  <VirtualGrid
    :items="products"
    :item-height="250"
    :item-width="200"
    :columns="4"
    :container-height="600"
    :gap="16"
  >
    <template #default="{ item, index }">
      <div class="product-card">
        <img :src="item.image" :alt="item.name" />
        <h4>{{ item.name }}</h4>
        <p>{{ formatCurrency(item.price) }}</p>
      </div>
    </template>
  </VirtualGrid>
</template>

<script setup>
import { ref } from 'vue'
import VirtualGrid from '@/components/common/VirtualGrid.vue'
import { formatCurrency } from '@/utils/formatters'

const products = ref([
  // ... thousands of products
])
</script>
*/

// Example 4: Using useFixedVirtualScroll composable
/*
<template>
  <div
    ref="containerRef"
    class="custom-virtual-list"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div :style="{ height: topSpacerHeight + 'px' }" />
    <div class="items">
      <div
        v-for="item in visibleItems"
        :key="item.index"
        class="item"
        :style="{ height: itemHeight + 'px' }"
      >
        {{ item.data.name }}
      </div>
    </div>
    <div :style="{ height: bottomSpacerHeight + 'px' }" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useFixedVirtualScroll } from '@/composables/useVirtualScroll'

const items = ref([...]) // large array

const {
  containerRef,
  visibleItems,
  topSpacerHeight,
  bottomSpacerHeight,
  handleScroll,
  scrollToIndex
} = useFixedVirtualScroll({
  items,
  itemHeight: 50,
  containerHeight: 500,
  overscan: 3
})
</script>
*/

export default {}

