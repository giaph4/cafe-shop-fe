<template>
  <section
    id="about"
    ref="aboutRef"
    class="portfolio-about"
  >
    <div class="portfolio-about__container">
      <div
        ref="contentRef"
        class="portfolio-about__content"
      >
        <h2 class="portfolio-about__title">
          <span class="portfolio-about__number">01.</span>
          <span class="portfolio-about__title-text">KERNEL INFO</span>
        </h2>
        <p class="portfolio-about__description">
          Tôi là một lập trình viên đam mê kiến trúc hệ thống và tối ưu hóa hiệu năng.
          Không chỉ viết code chạy được, tôi viết code <span class="portfolio-about__highlight">sạch, dễ bảo trì và mở rộng</span>.
          Thế giới của tôi xoay quanh Spring Boot, Microservices và giải quyết các bài toán hóc búa ở phía Server-side.
        </p>

        <div class="portfolio-about__stats">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            :ref="el => statRefs[index] = el"
            class="portfolio-about__stat-card"
          >
            <div class="portfolio-about__stat-label">
              {{ stat.label }}
            </div>
            <div class="portfolio-about__stat-value">
              {{ stat.value }}
            </div>
          </div>
        </div>
      </div>

      <div
        ref="visualRef"
        class="portfolio-about__visual"
      >
        <div
          ref="scanLineRef"
          class="portfolio-about__scan-line"
        />
        <div class="portfolio-about__code-box">
          <code class="portfolio-about__code">
            class HuynhGiaPho extends Developer &#123;<br>
            &nbsp;&nbsp;constructor() &#123;<br>
            &nbsp;&nbsp;&nbsp;&nbsp;this.passion = "Infinite";<br>
            &nbsp;&nbsp;&nbsp;&nbsp;this.stack = "Spring Boot";<br>
            &nbsp;&nbsp;&#125;<br>
            &#125;
          </code>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useMotion } from '@vueuse/motion'

const aboutRef = ref(null)
const contentRef = ref(null)
const visualRef = ref(null)
const scanLineRef = ref(null)
const statRefs = ref([])

const stats = [
    { label: 'VERSION', value: '2004.03.15' },
    { label: 'CORE', value: 'Java / JVM' },
    { label: 'LOC', value: 'Vietnam' },
    { label: 'EXP', value: 'Junior+' }
]

onMounted(() => {
    // Animate content on scroll
    if (contentRef.value) {
        useIntersectionObserver(contentRef.value, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                useMotion(contentRef.value, {
                    initial: { opacity: 0, x: -50 },
                    enter: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                })
            }
        })
    }

    // Scan line effect
    if (scanLineRef.value && visualRef.value) {
        useIntersectionObserver(visualRef.value, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                useMotion(scanLineRef.value, {
                    initial: { y: '-100%' },
                    enter: {
                        y: '100%',
                        transition: {
                            duration: 2,
                            ease: 'linear',
                            delay: 0.5
                        }
                    }
                })
            }
        })
    }

    // Animate stats
    statRefs.value.forEach((statRef, index) => {
        if (statRef) {
            useIntersectionObserver(statRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(statRef, {
                        initial: { opacity: 0, y: 20 },
                        enter: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                delay: 0.5 + index * 0.1,
                                duration: 0.5
                            }
                        }
                    })
                }
            })
        }
    })
})
</script>

<style scoped>
.portfolio-about {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #0f172a;
    color: #ffffff;
    display: flex;
    align-items: center;
}

.portfolio-about__container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-12);
    align-items: center;
}

.portfolio-about__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
}

.portfolio-about__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    margin-bottom: var(--spacing-4);
}

.portfolio-about__number {
    color: #06b6d4;
}

.portfolio-about__title-text {
    border-bottom: 2px solid #06b6d4;
    padding-bottom: var(--spacing-2);
}

.portfolio-about__description {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-relaxed);
    color: #94a3b8;
}

.portfolio-about__highlight {
    color: #06b6d4;
}

.portfolio-about__stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-4);
    margin-top: var(--spacing-8);
}

.portfolio-about__stat-card {
    padding: var(--spacing-4);
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    transition: border-color var(--transition-fast);
}

.portfolio-about__stat-card:hover {
    border-color: rgba(6, 182, 212, 0.5);
}

.portfolio-about__stat-label {
    font-size: var(--font-size-xs);
    color: #06b6d4;
    font-family: 'Courier New', monospace;
    margin-bottom: var(--spacing-1);
    text-transform: uppercase;
}

.portfolio-about__stat-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: #ffffff;
}

.portfolio-about__visual {
    position: relative;
    height: 400px;
    width: 100%;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2));
    border-radius: var(--radius-2xl);
    border: 1px solid #334155;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.portfolio-about__scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #06b6d4, transparent);
    box-shadow: 0 0 20px #06b6d4;
    z-index: 10;
}

.portfolio-about__code-box {
    position: relative;
    z-index: 5;
    padding: var(--spacing-6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: var(--radius-xl);
}

.portfolio-about__code {
    color: #06b6d4;
    font-size: var(--font-size-sm);
    font-family: 'Courier New', monospace;
    line-height: var(--line-height-relaxed);
}

@media (min-width: 992px) {
    .portfolio-about__container {
        grid-template-columns: 1fr 1fr;
    }
}
</style>

