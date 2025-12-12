<template>
  <div class="route-loading">
    <div class="route-loading__spinner">
      <div class="spinner-ring" />
      <div class="spinner-ring" />
      <div class="spinner-ring" />
    </div>
    <p class="route-loading__text">
      Đang tải...
    </p>
  </div>
</template>

<script setup>
// Component loading với animation đẹp cho lazy loading
</script>

<style scoped>
.route-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--spacing-4);
    padding: var(--spacing-6);
}

.route-loading__spinner {
    position: relative;
    width: 64px;
    height: 64px;
}

.spinner-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
    animation-delay: 0s;
    border-top-color: var(--color-primary);
}

.spinner-ring:nth-child(2) {
    animation-delay: -0.4s;
    border-top-color: var(--color-primary);
    opacity: 0.7;
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
}

.spinner-ring:nth-child(3) {
    animation-delay: -0.8s;
    border-top-color: var(--color-primary);
    opacity: 0.5;
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.route-loading__text {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    font-family: var(--font-family-sans);
    margin: 0;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
}
</style>
