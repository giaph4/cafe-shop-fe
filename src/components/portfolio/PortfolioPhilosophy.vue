<template>
    <section id="philosophy" class="portfolio-philosophy">
        <div class="portfolio-philosophy__container">
            <h2 class="portfolio-philosophy__title">
                <span class="portfolio-philosophy__number">07.</span>
                CODE PHILOSOPHY
            </h2>

            <div class="portfolio-philosophy__content" ref="contentRef">
                <div 
                    v-for="(principle, index) in principles" 
                    :key="index"
                    class="portfolio-philosophy__principle"
                    :ref="el => principleRefs[index] = el"
                >
                    <div class="portfolio-philosophy__principle-icon">
                        <i :class="principle.icon"></i>
                    </div>
                    <h3 class="portfolio-philosophy__principle-title">{{ principle.title }}</h3>
                    <p class="portfolio-philosophy__principle-description">{{ principle.description }}</p>
                </div>
            </div>

            <!-- Background Code -->
            <div class="portfolio-philosophy__code-bg">
                <code 
                    v-for="(line, index) in codeLines" 
                    :key="index"
                    class="portfolio-philosophy__code-line"
                    :style="{ animationDelay: `${index * 0.5}s` }"
                >
                    {{ line }}
                </code>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const contentRef = ref(null)
const principleRefs = ref([])

const principles = [
    {
        title: 'Clean Code',
        description: 'Code không chỉ chạy được, mà còn dễ đọc, dễ hiểu và dễ bảo trì. Mỗi dòng code là một câu chuyện.',
        icon: 'bi bi-code-slash'
    },
    {
        title: 'SOLID Principles',
        description: 'Tuân thủ các nguyên tắc thiết kế để tạo ra kiến trúc linh hoạt, mở rộng và dễ test.',
        icon: 'bi bi-diagram-3'
    },
    {
        title: 'Microservices',
        description: 'Xây dựng hệ thống phân tán, độc lập và có khả năng scale theo từng service riêng biệt.',
        icon: 'bi bi-layers'
    },
    {
        title: 'Performance First',
        description: 'Tối ưu hóa không chỉ là về tốc độ, mà còn về hiệu quả sử dụng tài nguyên và trải nghiệm người dùng.',
        icon: 'bi bi-speedometer2'
    }
]

const codeLines = [
    '@Service',
    'public class ServiceImpl {',
    '    @Transactional',
    '    public Response process() {',
    '        // Clean, maintainable code',
    '    }',
    '}'
]

onMounted(() => {
    principleRefs.value.forEach((principleRef, index) => {
        if (principleRef) {
            useIntersectionObserver(principleRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(principleRef, {
                        initial: { opacity: 0, y: 50 },
                        enter: { 
                            opacity: 1, 
                            y: 0,
                            transition: { 
                                delay: index * 0.15,
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
.portfolio-philosophy {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #000000;
    color: #ffffff;
    position: relative;
    overflow: hidden;
}

.portfolio-philosophy__container {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 10;
}

.portfolio-philosophy__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: var(--spacing-16);
}

.portfolio-philosophy__number {
    color: #06b6d4;
}

.portfolio-philosophy__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-6);
    margin-bottom: var(--spacing-12);
}

.portfolio-philosophy__principle {
    padding: var(--spacing-6);
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    text-align: center;
    transition: all var(--transition-base);
    position: relative;
    z-index: 5;
}

.portfolio-philosophy__principle:hover {
    border-color: rgba(6, 182, 212, 0.5);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
}

.portfolio-philosophy__principle-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--spacing-4);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(6, 182, 212, 0.15);
    border-radius: var(--radius-md);
    font-size: var(--font-size-3xl);
    color: #06b6d4;
    transition: all var(--transition-fast);
}

.portfolio-philosophy__principle:hover .portfolio-philosophy__principle-icon {
    background: rgba(6, 182, 212, 0.3);
    transform: scale(1.1);
}

.portfolio-philosophy__principle-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-3);
}

.portfolio-philosophy__principle-description {
    color: #94a3b8;
    line-height: var(--line-height-relaxed);
    font-size: var(--font-size-sm);
}

.portfolio-philosophy__code-bg {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    z-index: 1;
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    color: #06b6d4;
    padding: var(--spacing-6);
    overflow: hidden;
}

.portfolio-philosophy__code-line {
    display: block;
    margin-bottom: var(--spacing-2);
    animation: codeFloat 20s linear infinite;
    white-space: nowrap;
}

@keyframes codeFloat {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100vw);
    }
}
</style>

