<template>
  <section
    id="stats"
    class="portfolio-stats"
  >
    <div class="portfolio-stats__container">
      <h2 class="portfolio-stats__title">
        <span class="portfolio-stats__number">09.</span>
        SYSTEM METRICS
      </h2>

      <div class="portfolio-stats__content">
        <!-- Github Stats -->
        <div class="portfolio-stats__section">
          <h3 class="portfolio-stats__section-title">
            GitHub Activity
          </h3>
          <div
            ref="githubRef"
            class="portfolio-stats__github-grid"
          >
            <div
              v-for="(day, index) in githubDays"
              :key="index"
              :ref="el => githubDayRefs[index] = el"
              class="portfolio-stats__github-day"
              :style="{
                height: `${day.contributions * 20}px`,
                backgroundColor: getContributionColor(day.contributions)
              }"
            />
          </div>
          <div class="portfolio-stats__github-info">
            <div class="portfolio-stats__stat">
              <span class="portfolio-stats__stat-label">Total Commits</span>
              <span class="portfolio-stats__stat-value">{{ totalCommits }}+</span>
            </div>
            <div class="portfolio-stats__stat">
              <span class="portfolio-stats__stat-label">Repositories</span>
              <span class="portfolio-stats__stat-value">{{ repositories }}+</span>
            </div>
            <div class="portfolio-stats__stat">
              <span class="portfolio-stats__stat-label">Pull Requests</span>
              <span class="portfolio-stats__stat-value">{{ pullRequests }}+</span>
            </div>
          </div>
        </div>

        <!-- Testimonials -->
        <div class="portfolio-stats__section">
          <h3 class="portfolio-stats__section-title">
            Testimonials
          </h3>
          <div class="portfolio-stats__testimonials">
            <div
              v-for="(testimonial, index) in testimonials"
              :key="index"
              :ref="el => testimonialRefs[index] = el"
              class="portfolio-stats__testimonial"
            >
              <div class="portfolio-stats__testimonial-content">
                "{{ testimonial.content }}"
              </div>
              <div class="portfolio-stats__testimonial-author">
                <strong>{{ testimonial.author }}</strong>
                <span>{{ testimonial.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const githubRef = ref(null)
const githubDayRefs = ref([])
const testimonialRefs = ref([])

const totalCommits = ref(0)
const repositories = ref(0)
const pullRequests = ref(0)

// Generate mock GitHub contribution data (365 days)
const githubDays = Array.from({ length: 365 }, () => ({
    contributions: Math.floor(Math.random() * 5)
}))

const getContributionColor = (contributions) => {
    if (contributions === 0) return '#1e293b'
    if (contributions === 1) return '#0ea5e9'
    if (contributions === 2) return '#06b6d4'
    if (contributions === 3) return '#10b981'
    return '#8b5cf6'
}

const testimonials = [
    {
        content: 'Gia Pho có khả năng giải quyết vấn đề rất tốt và code rất sạch. Luôn sẵn sàng học hỏi và cải thiện.',
        author: 'Mentor',
        role: 'Senior Developer'
    },
    {
        content: 'Làm việc với Gia Pho rất thoải mái. Code review của bạn rất chi tiết và có tính xây dựng cao.',
        author: 'Team Lead',
        role: 'Tech Lead'
    }
]

onMounted(() => {
    // Animate counters
    const animateCounter = (ref, target, duration = 2000) => {
        const start = 0
        const increment = target / (duration / 16)
        let current = start

        const timer = setInterval(() => {
            current += increment
            if (current >= target) {
                ref.value = target
                clearInterval(timer)
            } else {
                ref.value = Math.floor(current)
            }
        }, 16)
    }

    if (githubRef.value) {
        useIntersectionObserver(githubRef.value, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                animateCounter(totalCommits, 500)
                animateCounter(repositories, 20)
                animateCounter(pullRequests, 50)
            }
        })
    }

    // Animate GitHub days
    githubDayRefs.value.forEach((dayRef, index) => {
        if (dayRef) {
            useIntersectionObserver(githubRef.value, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    setTimeout(() => {
                        useMotion(dayRef, {
                            initial: { scaleY: 0 },
                            enter: {
                                scaleY: 1,
                                transition: {
                                    delay: (index % 52) * 0.01,
                                    duration: 0.3
                                }
                            }
                        })
                    }, index * 5)
                }
            })
        }
    })

    // Animate testimonials
    testimonialRefs.value.forEach((testimonialRef, index) => {
        if (testimonialRef) {
            useIntersectionObserver(testimonialRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(testimonialRef, {
                        initial: { opacity: 0, y: 30 },
                        enter: {
                            opacity: 1,
                            y: 0,
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
})
</script>

<style scoped>
.portfolio-stats {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #000000;
    color: #ffffff;
}

.portfolio-stats__container {
    max-width: 1200px;
    margin: 0 auto;
}

.portfolio-stats__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: var(--spacing-16);
}

.portfolio-stats__number {
    color: #06b6d4;
}

.portfolio-stats__content {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-12);
}

.portfolio-stats__section {
    padding: var(--spacing-8);
    background: rgba(30, 41, 59, 0.3);
    border: 1px solid #334155;
    border-radius: var(--radius-xl);
}

.portfolio-stats__section-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-6);
    color: #06b6d4;
}

.portfolio-stats__github-grid {
    display: grid;
    grid-template-columns: repeat(52, 1fr);
    gap: var(--spacing-1);
    margin-bottom: var(--spacing-6);
    padding: var(--spacing-4);
    background: #0f172a;
    border-radius: var(--radius-md);
}

.portfolio-stats__github-day {
    width: 100%;
    min-height: 10px;
    border-radius: 2px;
    transition: all var(--transition-fast);
    transform-origin: bottom;
}

.portfolio-stats__github-day:hover {
    transform: scaleY(1.2);
    box-shadow: 0 0 10px currentColor;
}

.portfolio-stats__github-info {
    display: flex;
    justify-content: space-around;
    gap: var(--spacing-4);
    flex-wrap: wrap;
}

.portfolio-stats__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2);
}

.portfolio-stats__stat-label {
    font-size: var(--font-size-xs);
    color: #64748b;
    font-family: 'Courier New', monospace;
    text-transform: uppercase;
}

.portfolio-stats__stat-value {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: #06b6d4;
}

.portfolio-stats__testimonials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-6);
}

.portfolio-stats__testimonial {
    padding: var(--spacing-6);
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    border-left: 3px solid #06b6d4;
}

.portfolio-stats__testimonial-content {
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    color: #cbd5e1;
    margin-bottom: var(--spacing-4);
    font-style: italic;
}

.portfolio-stats__testimonial-author {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
}

.portfolio-stats__testimonial-author strong {
    color: #06b6d4;
}

.portfolio-stats__testimonial-author span {
    font-size: var(--font-size-sm);
    color: #64748b;
}

@media (min-width: 992px) {
    .portfolio-stats__content {
        grid-template-columns: 1fr 1fr;
    }
}
</style>

