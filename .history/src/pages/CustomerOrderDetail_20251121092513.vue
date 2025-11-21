<template>
  <div class="container mx-auto p-4 sm:p-6">
    <div v-if="loading" class="text-center">
      <p>Loading customer details...</p>
    </div>
    <div v-else-if="error" class="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
      <p class="font-bold">Error:</p>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="customer">
      <!-- Customer Details Card -->
      <div class="mb-8 bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          {{ customer.fullName }}
        </h1>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
          <p><strong>Phone:</strong> {{ customer.phone }}</p>
          <p><strong>Email:</strong> {{ customer.email || 'N/A' }}</p>
          <p><strong>Total Spent:</strong> {{ formatCurrency(customer.totalSpent) }}</p>
          <p><strong>Member Since:</strong> {{ formatDate(customer.createdAt) }}</p>
        </div>
      </div>

      <!-- Purchase History -->
      <div class="bg-white rounded-lg shadow-md">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800">Purchase History</h2>
        </div>
        <div v-if="historyLoading" class="text-center p-4">
          <p>Loading purchase history...</p>
        </div>
        <div v-else-if="historyError" class="p-4 text-red-700 bg-red-100 rounded-lg m-6" role="alert">
          <p>{{ historyError }}</p>
        </div>
        <div v-else-if="purchaseHistory.content && purchaseHistory.content.length > 0">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-gray-500">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3">Order ID</th>
                  <th scope="col" class="px-6 py-3">Date</th>
                  <th scope="col" class="px-6 py-3">Total</th>
                  <th scope="col" class="px-6 py-3">Status</th>
                  <th scope="col" class="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in purchaseHistory.content" :key="order.id" class="bg-white border-b hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">#{{ order.id }}</td>
                  <td class="px-6 py-4">{{ formatDate(order.orderDate) }}</td>
                  <td class="px-6 py-4">{{ formatCurrency(order.finalAmount) }}</td>
                  <td class="px-6 py-4">
                    <span :class="getStatusClass(order.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <router-link :to="`/orders/${order.id}`" class="font-medium text-indigo-600 hover:text-indigo-900">
                      View Details
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <Pagination
            :current-page="pagination.currentPage.value"
            :total-pages="pagination.totalPages.value"
            :total-items="purchaseHistory.totalElements"
            :items-per-page="pagination.itemsPerPage.value"
            @page-changed="pagination.goToPage"
          />
        </div>
        <div v-else class="text-center p-6">
          <p class="text-gray-500">This customer has no purchase history.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerById, getCustomerPurchaseHistory } from '@/api/customerService'
import Pagination from '@/components/common/Pagination.vue'
import { usePagination, PaginationMode } from '@/composables/usePagination'
import { formatCurrency, formatDate } from '@/utils/formatters'

const route = useRoute()
const customer = ref(null)
const purchaseHistory = ref({ content: [], totalElements: 0 })
const error = ref(null)
const historyError = ref(null)
const loading = ref(true)
const historyLoading = ref(true)

const customerId = route.params.id

const pagination = usePagination({
  mode: PaginationMode.SERVER,
  fetchData: fetchHistory,
  initialItemsPerPage: 10,
})

async function fetchCustomerDetails() {
  loading.value = true
  error.value = null
  try {
    const response = await getCustomerById(customerId)
    customer.value = response
  } catch (err) {
    console.error('Failed to fetch customer details:', err)
    error.value = 'Failed to load customer details. The customer may not exist or there was a network error.'
  } finally {
    loading.value = false
  }
}

async function fetchHistory(page, size) {
  historyLoading.value = true
  historyError.value = null
  try {
    const response = await getCustomerPurchaseHistory({
      id: customerId,
      page: page - 1, // API is 0-indexed
      size,
    })
    purchaseHistory.value = response
    pagination.updateTotalItems(response.totalElements)
  } catch (err) {
    console.error('Failed to fetch purchase history:', err)
    historyError.value = 'Failed to load purchase history.'
  } finally {
    historyLoading.value = false
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

onMounted(() => {
  fetchCustomerDetails()
  fetchHistory(pagination.currentPage.value, pagination.itemsPerPage.value)
})
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>