<template>
  <div
    v-if="enabled"
    class="christmas-effect-container"
  >
    <!-- Background tuyết rơi -->
    <div class="snow-bg" />

    <!-- Lời chúc -->
    <div
      class="christmas-message"
      :class="{ show: showMessage }"
    >
      🎄 Merry Christmas! 🎄
    </div>

    <!-- Container chứa các hạt (Particles) -->
    <div class="particle-container">
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :style="getParticleStyle(p)"
      >
        {{ p.char }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { useChristmasEffect } from '@/composables/useChristmasEffect'
import { setGlobalSpawnEffect } from '@/directives/christmas'
import { setGlobalSpawnEffectForPlugin } from '@/plugins/christmasAutoApply'

const settingsStore = useSettingsStore()
const enabled = computed(() => settingsStore.christmasEffectEnabled)

const { particles, showMessage, getParticleStyle, spawnEffect } = useChristmasEffect()

// Wrapper function để kiểm tra enabled
const handleSpawnEffect = (buttonElement) => {
    if (enabled.value) {
        spawnEffect(buttonElement)
    }
}

// Set global function khi component mount
onMounted(() => {
    setGlobalSpawnEffect(handleSpawnEffect)
    setGlobalSpawnEffectForPlugin(handleSpawnEffect)
})

// Clear global function khi component unmount
onBeforeUnmount(() => {
    setGlobalSpawnEffect(null)
    setGlobalSpawnEffectForPlugin(null)
})

// Expose để directive có thể sử dụng
defineExpose({
    spawnEffect: handleSpawnEffect
})
</script>

<style scoped>
.christmas-effect-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
}

/* --- Background Snow Animation --- */
.snow-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    background-image:
        radial-gradient(4px 4px at 100px 50px, rgba(255, 255, 255, 0.8) 50%, transparent),
        radial-gradient(6px 6px at 200px 150px, rgba(255, 255, 255, 0.8) 50%, transparent),
        radial-gradient(3px 3px at 300px 250px, rgba(255, 255, 255, 0.8) 50%, transparent);
    background-size: 650px 650px;
    animation: snow 10s linear infinite;
    opacity: 0.3;
}

@keyframes snow {
    from {
        background-position: 0 0, 0 0, 0 0;
    }

    to {
        background-position: 650px 650px, 400px 400px, 300px 300px;
    }
}

/* --- The Particles (Trees/Stars) --- */
.particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 20;
}

.particle {
    position: absolute;
    font-size: 1.5rem;
    left: 0;
    top: 0;
    opacity: 0;
    --tx: 0px;
    --ty: 0px;
    --r: 0deg;
    animation: burst 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    will-change: transform, opacity;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    user-select: none;
}

/* Animation định nghĩa cú nổ */
@keyframes burst {
    0% {
        transform: translate(0, 0) scale(0.5) rotate(0deg);
        opacity: 1;
    }

    50% {
        opacity: 1;
    }

    100% {
        transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(var(--r));
        opacity: 0;
    }
}

/* Chữ Merry Christmas hiện ra */
.christmas-message {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    text-align: center;
    font-size: clamp(2rem, 5vw, 3rem);
    color: #f8b229;
    text-shadow: 0 0 10px rgba(248, 178, 41, 0.5);
    opacity: 0;
    transition: opacity 1s ease;
    font-family: 'Mountains of Christmas', cursive, serif;
    z-index: 30;
    pointer-events: none;
}

.christmas-message.show {
    opacity: 1;
}
</style>
