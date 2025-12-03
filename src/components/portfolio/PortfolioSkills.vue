<template>
    <section id="skills" class="portfolio-skills">
        <div class="portfolio-skills__container">
            <h2 class="portfolio-skills__title">
                <span class="portfolio-skills__number">02.</span>
                SYSTEM MODULES
            </h2>

            <div class="portfolio-skills__orbit" ref="orbitRef">
                <!-- Central Spring Boot Icon -->
                <div class="portfolio-skills__center" ref="centerRef">
                    <i class="bi bi-gear-fill"></i>
                    <div class="portfolio-skills__center-glow"></div>
                </div>

                <!-- Orbiting Skills -->
                <div 
                    v-for="(skill, index) in skills" 
                    :key="index"
                    class="portfolio-skills__orbit-item"
                    :style="getOrbitStyle(index)"
                    :ref="el => skillRefs[index] = el"
                    @mouseenter="hoveredSkill = index"
                    @mouseleave="hoveredSkill = null"
                >
                    <div 
                        class="portfolio-skills__skill-card"
                        :class="{ 'portfolio-skills__skill-card--hovered': hoveredSkill === index }"
                    >
                        <div class="portfolio-skills__skill-icon">
                            <i :class="skill.icon"></i>
                        </div>
                        <div class="portfolio-skills__skill-name">{{ skill.name }}</div>
                        <div class="portfolio-skills__skill-level">{{ skill.level }}%</div>
                        <div class="portfolio-skills__skill-bar">
                            <div 
                                class="portfolio-skills__skill-progress"
                                :style="{ width: `${skill.level}%` }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const orbitRef = ref(null)
const centerRef = ref(null)
const skillRefs = ref([])
const hoveredSkill = ref(null)

const skills = [
    { name: 'Spring Boot', level: 90, icon: 'bi bi-lightning-charge' },
    { name: 'Java Core', level: 85, icon: 'bi bi-code-square' },
    { name: 'Microservices', level: 75, icon: 'bi bi-server' },
    { name: 'Docker/K8s', level: 70, icon: 'bi bi-box' },
    { name: 'PostgreSQL', level: 80, icon: 'bi bi-database' },
    { name: 'RESTful API', level: 95, icon: 'bi bi-globe' }
]

const getOrbitStyle = (index) => {
    const total = skills.length
    const angle = (360 / total) * index
    const radius = 200 // Distance from center
    
    return {
        '--angle': `${angle}deg`,
        '--radius': `${radius}px`
    }
}

onMounted(() => {
    // Rotate center icon
    if (centerRef.value) {
        useIntersectionObserver(orbitRef.value, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                useMotion(centerRef.value, {
                    motion: {
                        rotate: {
                            value: 360,
                            repeat: Infinity,
                            duration: 20,
                            ease: 'linear'
                        }
                    }
                })
            }
        })
    }

    // Animate orbiting skills
    skillRefs.value.forEach((skillRef, index) => {
        if (skillRef) {
            useIntersectionObserver(orbitRef.value, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(skillRef, {
                        initial: { opacity: 0, scale: 0.5 },
                        enter: { 
                            opacity: 1, 
                            scale: 1,
                            transition: { 
                                delay: index * 0.1,
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
.portfolio-skills {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #000000;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.portfolio-skills__container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.portfolio-skills__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    text-align: center;
    margin-bottom: var(--spacing-16);
}

.portfolio-skills__number {
    color: #8b5cf6;
}

.portfolio-skills__orbit {
    position: relative;
    width: 100%;
    height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.portfolio-skills__center {
    position: absolute;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: #06b6d4;
    z-index: 10;
}

.portfolio-skills__center-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.3), transparent);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.5;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.1);
    }
}

.portfolio-skills__orbit-item {
    position: absolute;
    width: 200px;
    transform-origin: center;
    transform: 
        rotate(var(--angle))
        translateX(var(--radius))
        rotate(calc(-1 * var(--angle)));
    transition: transform var(--transition-smooth);
}

.portfolio-skills__skill-card {
    padding: var(--spacing-5);
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    text-align: center;
    transition: all var(--transition-base);
    position: relative;
    overflow: hidden;
}

.portfolio-skills__skill-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, #06b6d4, #8b5cf6);
    opacity: 0;
    transition: opacity var(--transition-fast);
}

.portfolio-skills__skill-card:hover,
.portfolio-skills__skill-card--hovered {
    border-color: rgba(139, 92, 246, 0.5);
    transform: scale(1.1);
    z-index: 20;
}

.portfolio-skills__skill-card:hover::before,
.portfolio-skills__skill-card--hovered::before {
    opacity: 1;
}

.portfolio-skills__skill-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto var(--spacing-3);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(51, 65, 85, 0.5);
    border-radius: var(--radius-md);
    font-size: var(--font-size-2xl);
    color: #06b6d4;
    transition: all var(--transition-fast);
}

.portfolio-skills__skill-card:hover .portfolio-skills__skill-icon,
.portfolio-skills__skill-card--hovered .portfolio-skills__skill-icon {
    background: rgba(6, 182, 212, 0.2);
    color: #06b6d4;
}

.portfolio-skills__skill-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-2);
}

.portfolio-skills__skill-level {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-xs);
    color: #64748b;
    margin-bottom: var(--spacing-3);
}

.portfolio-skills__skill-bar {
    width: 100%;
    height: 4px;
    background: #1e293b;
    border-radius: var(--radius-full);
    overflow: hidden;
}

.portfolio-skills__skill-progress {
    height: 100%;
    background: linear-gradient(90deg, #06b6d4, #8b5cf6);
    border-radius: var(--radius-full);
    transition: width 1.5s ease-out;
}

@media (max-width: 768px) {
    .portfolio-skills__orbit {
        height: 400px;
    }

    .portfolio-skills__orbit-item {
        width: 150px;
    }

    .portfolio-skills__center {
        width: 80px;
        height: 80px;
        font-size: 2.5rem;
    }
}
</style>

