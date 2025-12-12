<template>
  <section
    id="experience"
    class="portfolio-experience"
  >
    <div class="portfolio-experience__container">
      <h2 class="portfolio-experience__title">
        <span class="portfolio-experience__number">04.</span>
        EXPERIENCE TIMELINE
      </h2>

      <div
        ref="pipelineRef"
        class="portfolio-experience__pipeline"
      >
        <!-- Pipeline Line -->
        <svg
          class="portfolio-experience__line"
          viewBox="0 0 10 1000"
          preserveAspectRatio="none"
        >
          <path
            d="M 5 0 L 5 1000"
            stroke="url(#gradient)"
            stroke-width="2"
            :stroke-dasharray="pipelineProgress"
            stroke-dashoffset="0"
            fill="none"
          />
          <defs>
            <linearGradient
              id="gradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style="stop-color:#06b6d4;stop-opacity:1"
              />
              <stop
                offset="100%"
                style="stop-color:#8b5cf6;stop-opacity:1"
              />
            </linearGradient>
          </defs>
        </svg>

        <!-- Timeline Items -->
        <div
          v-for="(item, index) in experiences"
          :key="index"
          :ref="el => itemRefs[index] = el"
          class="portfolio-experience__item"
          :class="{ 'portfolio-experience__item--active': activeIndex >= index }"
          :style="{ top: `${(index / (experiences.length - 1)) * 100}%` }"
        >
          <div class="portfolio-experience__item-dot" />
          <div class="portfolio-experience__item-content">
            <div class="portfolio-experience__item-date">
              {{ item.date }}
            </div>
            <h3 class="portfolio-experience__item-title">
              {{ item.title }}
            </h3>
            <p class="portfolio-experience__item-description">
              {{ item.description }}
            </p>
            <div class="portfolio-experience__item-tags">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="portfolio-experience__tag"
              >#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const pipelineRef = ref(null)
const itemRefs = ref([])
const activeIndex = ref(-1)
const pipelineProgress = ref('0 1000')

const experiences = [
    {
        date: '2024',
        title: 'Spring Boot Developer',
        description: 'Phát triển hệ thống quản lý cafe với Spring Boot, JPA, RESTful API',
        tags: ['Spring Boot', 'Java', 'PostgreSQL']
    },
    {
        date: '2023',
        title: 'Backend Intern',
        description: 'Học tập và phát triển kỹ năng Backend với Java và Spring Framework',
        tags: ['Java', 'Spring', 'MySQL']
    },
    {
        date: '2022',
        title: 'Computer Science Student',
        description: 'Nghiên cứu và học tập các nguyên lý lập trình, cấu trúc dữ liệu và giải thuật',
        tags: ['Algorithms', 'Data Structures', 'OOP']
    }
]

onMounted(() => {
    const updatePipeline = () => {
        if (!pipelineRef.value) return

        const rect = pipelineRef.value.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const elementTop = rect.top + scrollTop
        const elementHeight = rect.height

        // Calculate progress
        const viewportTop = scrollTop
        const viewportBottom = scrollTop + windowHeight
        const elementBottom = elementTop + elementHeight

        if (viewportBottom > elementTop && viewportTop < elementBottom) {
            const progress = Math.max(0, Math.min(1, (viewportBottom - elementTop) / elementHeight))
            const dashLength = progress * 1000
            pipelineProgress.value = `${dashLength} 1000`

            // Update active items
            const itemCount = experiences.length
            activeIndex.value = Math.floor(progress * itemCount)
        }
    }

    window.addEventListener('scroll', updatePipeline)
    updatePipeline()

    // Animate items on scroll
    itemRefs.value.forEach((itemRef, index) => {
        if (itemRef) {
            useIntersectionObserver(itemRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(itemRef, {
                        initial: { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
                        enter: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                delay: index * 0.2,
                                duration: 0.6
                            }
                        }
                    })
                }
            })
        }
    })

    const cleanup = () => {
        window.removeEventListener('scroll', updatePipeline)
    }

    onUnmounted(cleanup)
})
</script>

<style scoped>
.portfolio-experience {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #0f172a;
    color: #ffffff;
}

.portfolio-experience__container {
    max-width: 1200px;
    margin: 0 auto;
}

.portfolio-experience__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: var(--spacing-16);
}

.portfolio-experience__number {
    color: #06b6d4;
}

.portfolio-experience__pipeline {
    position: relative;
    min-height: 800px;
    padding: var(--spacing-8) 0;
}

.portfolio-experience__line {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
    height: 100%;
}

.portfolio-experience__item {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-6);
    width: 100%;
    max-width: 500px;
    opacity: 0.3;
    transition: opacity var(--transition-base);
}

.portfolio-experience__item--active {
    opacity: 1;
}

.portfolio-experience__item:nth-child(even) {
    flex-direction: row-reverse;
    left: auto;
    right: 50%;
    transform: translateX(50%);
}

.portfolio-experience__item-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1e293b;
    border: 3px solid #334155;
    position: relative;
    z-index: 10;
    flex-shrink: 0;
    transition: all var(--transition-base);
}

.portfolio-experience__item--active .portfolio-experience__item-dot {
    background: #06b6d4;
    border-color: #06b6d4;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
    animation: pulse 2s ease-in-out infinite;
}

.portfolio-experience__item-content {
    flex: 1;
    padding: var(--spacing-5);
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.portfolio-experience__item-date {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    color: #06b6d4;
    margin-bottom: var(--spacing-2);
}

.portfolio-experience__item-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2);
}

.portfolio-experience__item-description {
    color: #94a3b8;
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-3);
}

.portfolio-experience__item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
}

.portfolio-experience__tag {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    color: #8b5cf6;
    padding: var(--spacing-1) var(--spacing-2);
    background: rgba(139, 92, 246, 0.1);
    border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
    .portfolio-experience__item {
        flex-direction: column !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        text-align: center;
    }

    .portfolio-experience__line {
        left: 30px;
    }

    .portfolio-experience__item-content {
        margin-left: var(--spacing-8);
    }
}
</style>

