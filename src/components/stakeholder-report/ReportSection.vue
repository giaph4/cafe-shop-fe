<template>
  <div class="report-section">
    <div class="card standard-card mb-4">
      <div class="card-header standard-card-header">
        <h5 class="card-title">
          {{ title }}
        </h5>
      </div>
      <div class="card-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    }
})
</script>

<style scoped>
.report-section {
    font-family: var(--font-family-sans);
}
</style>

