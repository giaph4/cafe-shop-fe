<template>
    <section id="projects" class="portfolio-projects">
        <div class="portfolio-projects__container">
            <h2 class="portfolio-projects__title">
                <span class="portfolio-projects__number">03.</span>
                DEPLOYED PROTOCOLS
            </h2>

            <div class="portfolio-projects__list">
                <div 
                    v-for="(project, index) in projects" 
                    :key="index"
                    class="portfolio-projects__item"
                    :class="{ 'portfolio-projects__item--reverse': index % 2 !== 0 }"
                    :ref="el => projectRefs[index] = el"
                >
                    <!-- Mockup Visual -->
                    <div class="portfolio-projects__visual" ref="visualRef">
                        <div class="portfolio-projects__mockup">
                            <div class="portfolio-projects__mockup-header">
                                <div class="portfolio-projects__mockup-dot portfolio-projects__mockup-dot--red"></div>
                                <div class="portfolio-projects__mockup-dot portfolio-projects__mockup-dot--yellow"></div>
                                <div class="portfolio-projects__mockup-dot portfolio-projects__mockup-dot--green"></div>
                            </div>
                            <div class="portfolio-projects__mockup-content">
                                <code class="portfolio-projects__code">
                                    <span class="portfolio-projects__code-annotation">@Service</span><br/>
                                    public class <span class="portfolio-projects__code-class">{{ project.title.replace(/\s/g, '') }}</span> &#123;<br/>
                                    &nbsp;&nbsp;<span class="portfolio-projects__code-annotation">@Autowired</span><br/>
                                    &nbsp;&nbsp;private KafkaTemplate template;<br/>
                                    &nbsp;&nbsp;<span class="portfolio-projects__code-comment">// Core logic optimized for high throughput</span><br/>
                                    &#125;
                                </code>
                            </div>
                            <div class="portfolio-projects__mockup-overlay">
                                <button class="portfolio-projects__view-btn" @click="viewArchitecture(project)">
                                    View Architecture
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="portfolio-projects__content">
                        <span class="portfolio-projects__type">{{ project.type }}</span>
                        <h3 class="portfolio-projects__name">{{ project.title }}</h3>
                        <div class="portfolio-projects__description">
                            {{ project.description }}
                        </div>
                        <div class="portfolio-projects__tags">
                            <span v-for="tag in project.tags" :key="tag" class="portfolio-projects__tag">#{{ tag }}</span>
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
import logger from '@/utils/logger'

const projectRefs = ref([])
const visualRef = ref(null)

const projects = [
    {
        title: 'E-Commerce Microservices',
        description: 'Hệ thống bán hàng phân tán sử dụng Spring Cloud, Kafka và Docker. Xử lý hàng ngàn request đồng thời với độ trễ thấp.',
        tags: ['Java', 'Spring Cloud', 'Kafka', 'Redis'],
        type: 'Architecture'
    },
    {
        title: 'Real-time Banking Core',
        description: 'Mô phỏng lõi ngân hàng xử lý giao dịch thời gian thực với độ trễ thấp. Đảm bảo tính nhất quán và an toàn dữ liệu.',
        tags: ['Spring Boot', 'WebFlux', 'PostgreSQL'],
        type: 'Fintech'
    },
    {
        title: 'IoT Data Aggregator',
        description: 'Thu thập và xử lý dữ liệu từ hàng ngàn cảm biến IoT đồng thời. Tối ưu hóa hiệu năng với reactive programming.',
        tags: ['Java', 'MQTT', 'MongoDB', 'InfluxDB'],
        type: 'Big Data'
    }
]

const viewArchitecture = (project) => {
    // TODO: Open modal with system architecture diagram
    logger.log('View architecture for:', project.title)
}

onMounted(() => {
    projectRefs.value.forEach((projectRef, index) => {
        if (projectRef) {
            useIntersectionObserver(projectRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(projectRef, {
                        initial: { opacity: 0, x: index % 2 === 0 ? -100 : 100 },
                        enter: { 
                            opacity: 1, 
                            x: 0,
                            transition: { 
                                delay: index * 0.2,
                                duration: 0.8 
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
.portfolio-projects {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #0f172a;
    color: #ffffff;
    position: relative;
    overflow: hidden;
}

.portfolio-projects::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 400px;
    height: 400px;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 50%;
    filter: blur(100px);
    z-index: 0;
}

.portfolio-projects__container {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 10;
}

.portfolio-projects__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: right;
    margin-bottom: var(--spacing-16);
}

.portfolio-projects__number {
    color: #06b6d4;
}

.portfolio-projects__list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-16);
}

.portfolio-projects__item {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-8);
    align-items: center;
}

.portfolio-projects__item--reverse {
    direction: rtl;
}

.portfolio-projects__item--reverse > * {
    direction: ltr;
}

.portfolio-projects__visual {
    position: relative;
    min-height: 300px;
}

.portfolio-projects__mockup {
    position: relative;
    background: #1e293b;
    border-radius: var(--radius-xl);
    border: 1px solid #334155;
    overflow: hidden;
    transition: all var(--transition-base);
}

.portfolio-projects__mockup:hover {
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
}

.portfolio-projects__mockup-header {
    display: flex;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    background: #0f172a;
    border-bottom: 1px solid #334155;
}

.portfolio-projects__mockup-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.portfolio-projects__mockup-dot--red {
    background: #ef4444;
}

.portfolio-projects__mockup-dot--yellow {
    background: #eab308;
}

.portfolio-projects__mockup-dot--green {
    background: #10b981;
}

.portfolio-projects__mockup-content {
    padding: var(--spacing-6);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    color: #64748b;
    opacity: 0.6;
}

.portfolio-projects__code {
    line-height: var(--line-height-relaxed);
}

.portfolio-projects__code-annotation {
    color: #8b5cf6;
}

.portfolio-projects__code-class {
    color: #eab308;
}

.portfolio-projects__code-comment {
    color: #10b981;
}

.portfolio-projects__mockup-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-base);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.portfolio-projects__mockup:hover .portfolio-projects__mockup-overlay {
    opacity: 1;
}

.portfolio-projects__view-btn {
    padding: var(--spacing-3) var(--spacing-6);
    background: #ffffff;
    color: #000000;
    font-weight: var(--font-weight-bold);
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    transform: translateY(20px);
    transition: transform var(--transition-base);
}

.portfolio-projects__mockup:hover .portfolio-projects__view-btn {
    transform: translateY(0);
}

.portfolio-projects__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
}

.portfolio-projects__type {
    color: #06b6d4;
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-2);
}

.portfolio-projects__name {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-4);
}

.portfolio-projects__description {
    padding: var(--spacing-6);
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    color: #cbd5e1;
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-6);
}

.portfolio-projects__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
}

.portfolio-projects__tag {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: #06b6d4;
}

@media (max-width: 992px) {
    .portfolio-projects__item {
        grid-template-columns: 1fr;
    }

    .portfolio-projects__item--reverse {
        direction: ltr;
    }
}
</style>

