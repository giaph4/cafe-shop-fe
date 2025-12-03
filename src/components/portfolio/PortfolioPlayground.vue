<template>
    <section id="playground" class="portfolio-playground">
        <div class="portfolio-playground__container">
            <h2 class="portfolio-playground__title">
                <span class="portfolio-playground__number">08.</span>
                CREATIVE PLAYGROUND
            </h2>

            <p class="portfolio-playground__subtitle">
                Ngoài code, tôi còn có những sở thích và đam mê khác giúp tôi cân bằng cuộc sống và tăng cường sự sáng tạo.
            </p>

            <div class="portfolio-playground__grid" ref="gridRef">
                <div 
                    v-for="(item, index) in playgroundItems" 
                    :key="index"
                    class="portfolio-playground__item"
                    :ref="el => itemRefs[index] = el"
                    @mouseenter="hoveredIndex = index"
                    @mouseleave="hoveredIndex = null"
                    :style="{ 
                        transform: `rotate(${hoveredIndex === index ? '5deg' : '0deg'}) translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`
                    }"
                >
                    <div class="portfolio-playground__item-icon">
                        <i :class="item.icon"></i>
                    </div>
                    <h3 class="portfolio-playground__item-title">{{ item.title }}</h3>
                    <p class="portfolio-playground__item-description">{{ item.description }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const gridRef = ref(null)
const itemRefs = ref([])
const hoveredIndex = ref(null)

const playgroundItems = [
    {
        title: 'Gaming',
        description: 'Chơi game để giải trí và học hỏi về game design, AI behavior',
        icon: 'bi bi-controller'
    },
    {
        title: 'Music',
        description: 'Nghe nhạc và thỉnh thoảng thử sáng tác để thư giãn',
        icon: 'bi bi-music-note-beamed'
    },
    {
        title: 'Reading',
        description: 'Đọc sách về công nghệ, kiến trúc phần mềm và tâm lý học',
        icon: 'bi bi-book'
    },
    {
        title: 'Photography',
        description: 'Chụp ảnh để ghi lại những khoảnh khắc đẹp trong cuộc sống',
        icon: 'bi bi-camera'
    },
    {
        title: 'Fitness',
        description: 'Tập thể dục để giữ sức khỏe và tinh thần minh mẫn',
        icon: 'bi bi-heart-pulse'
    },
    {
        title: 'Learning',
        description: 'Không ngừng học hỏi công nghệ mới và cải thiện kỹ năng',
        icon: 'bi bi-lightbulb'
    }
]

onMounted(() => {
    itemRefs.value.forEach((itemRef, index) => {
        if (itemRef) {
            useIntersectionObserver(itemRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(itemRef, {
                        initial: { opacity: 0, scale: 0.8, rotate: -10 },
                        enter: { 
                            opacity: 1, 
                            scale: 1,
                            rotate: 0,
                            transition: { 
                                delay: index * 0.1,
                                duration: 0.5,
                                type: 'spring',
                                stiffness: 100
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
.portfolio-playground {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #0f172a;
    color: #ffffff;
}

.portfolio-playground__container {
    max-width: 1200px;
    margin: 0 auto;
}

.portfolio-playground__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: var(--spacing-4);
}

.portfolio-playground__number {
    color: #8b5cf6;
}

.portfolio-playground__subtitle {
    text-align: center;
    color: #94a3b8;
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-12);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.portfolio-playground__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-6);
}

.portfolio-playground__item {
    padding: var(--spacing-6);
    background: rgba(30, 41, 59, 0.5);
    border: 2px solid #334155;
    border-radius: var(--radius-xl);
    text-align: center;
    transition: all var(--transition-base);
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.portfolio-playground__item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1));
    opacity: 0;
    transition: opacity var(--transition-fast);
}

.portfolio-playground__item:hover::before {
    opacity: 1;
}

.portfolio-playground__item:hover {
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
    transform: translateY(-5px) scale(1.02) !important;
}

.portfolio-playground__item-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--spacing-4);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(139, 92, 246, 0.15);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-4xl);
    color: #8b5cf6;
    transition: all var(--transition-fast);
    position: relative;
    z-index: 5;
}

.portfolio-playground__item:hover .portfolio-playground__item-icon {
    background: rgba(139, 92, 246, 0.3);
    transform: scale(1.1) rotate(5deg);
}

.portfolio-playground__item-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-3);
    position: relative;
    z-index: 5;
}

.portfolio-playground__item-description {
    color: #94a3b8;
    line-height: var(--line-height-relaxed);
    font-size: var(--font-size-sm);
    position: relative;
    z-index: 5;
}
</style>

