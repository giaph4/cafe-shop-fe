<template>
    <section class="portfolio-hero" ref="heroRef">
        <!-- Background Grid Animation -->
        <div class="portfolio-hero__grid"></div>

        <!-- Terminal Boot Animation -->
        <div class="portfolio-hero__terminal" v-if="showTerminal" ref="terminalRef">
            <div class="terminal-line" v-for="(line, index) in terminalLines" :key="index" :style="{ animationDelay: `${index * 0.3}s` }">
                <span class="terminal-prompt">></span>
                <span class="terminal-text">{{ line }}</span>
            </div>
        </div>

        <!-- Main Content -->
        <div class="portfolio-hero__content" ref="contentRef">
            <div class="portfolio-hero__status" ref="statusRef">
                SYSTEM STATUS: ONLINE
            </div>

            <h1 class="portfolio-hero__title" ref="titleRef">
                HUỲNH GIA PHO
            </h1>

            <div class="portfolio-hero__subtitle" ref="subtitleRef">
                <span>Backend Architect</span>
                <span class="portfolio-hero__highlight">&lt;Spring Boot /&gt;</span>
            </div>

            <div class="portfolio-hero__actions" ref="actionsRef">
                <button class="portfolio-hero__btn portfolio-hero__btn--primary" @click="scrollToAbout">
                    INITIALIZE
                </button>
                <button class="portfolio-hero__btn portfolio-hero__btn--secondary" @click="scrollToProjects">
                    VIEW LOGS
                </button>
            </div>
        </div>

        <!-- Decorative Floating Elements -->
        <div class="portfolio-hero__decor portfolio-hero__decor--left" ref="decorLeftRef">
            <i class="bi bi-database"></i>
        </div>
        <div class="portfolio-hero__decor portfolio-hero__decor--right" ref="decorRightRef">
            <i class="bi bi-cpu"></i>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMotion } from '@vueuse/motion'

const heroRef = ref(null)
const terminalRef = ref(null)
const contentRef = ref(null)
const statusRef = ref(null)
const titleRef = ref(null)
const subtitleRef = ref(null)
const actionsRef = ref(null)
const decorLeftRef = ref(null)
const decorRightRef = ref(null)

const showTerminal = ref(true)
const terminalLines = [
    'System booting...',
    'Loading modules...',
    'Spring Boot Context initialized',
    'All systems operational'
]

const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
    // Hide terminal after animation
    setTimeout(() => {
        showTerminal.value = false
    }, 2000)

    // Animate terminal
    if (terminalRef.value) {
        useMotion(terminalRef.value, {
            initial: { opacity: 1 },
            enter: { opacity: 1 },
            leave: { opacity: 0, transition: { duration: 0.5 } }
        })
    }

    // Animate status badge
    if (statusRef.value) {
        useMotion(statusRef.value, {
            initial: { opacity: 0, scale: 0.5 },
            enter: { opacity: 1, scale: 1, transition: { delay: 2.5, duration: 0.8 } }
        })
    }

    // Animate title
    if (titleRef.value) {
        useMotion(titleRef.value, {
            initial: { opacity: 0, scale: 0.5, y: 50 },
            enter: { opacity: 1, scale: 1, y: 0, transition: { delay: 3, duration: 1, ease: 'easeOut' } }
        })
    }

    // Animate subtitle
    if (subtitleRef.value) {
        useMotion(subtitleRef.value, {
            initial: { opacity: 0, y: 30 },
            enter: { opacity: 1, y: 0, transition: { delay: 3.5, duration: 0.8 } }
        })
    }

    // Animate actions
    if (actionsRef.value) {
        useMotion(actionsRef.value, {
            initial: { opacity: 0 },
            enter: { opacity: 1, transition: { delay: 4, duration: 0.8 } }
        })
    }

    // Parallax effect for decor elements using scroll
    const handleScroll = () => {
        const scrollY = window.scrollY
        if (decorLeftRef.value) {
            decorLeftRef.value.style.transform = `translateY(${scrollY * 0.5 - 100}px)`
        }
        if (decorRightRef.value) {
            decorRightRef.value.style.transform = `translateY(${scrollY * -0.5 + 100}px)`
        }
    }
    
    window.addEventListener('scroll', handleScroll)
    onUnmounted(() => {
        window.removeEventListener('scroll', handleScroll)
    })
})
</script>

<style scoped>
.portfolio-hero {
    position: relative;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: #000000;
}

.portfolio-hero__grid {
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(to right, rgba(8, 51, 68, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(8, 51, 68, 0.3) 1px, transparent 1px);
    background-size: 4rem 4rem;
    mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%);
    opacity: 0.2;
}

.portfolio-hero__terminal {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: #06b6d4;
    z-index: 10;
}

.terminal-line {
    opacity: 0;
    animation: terminalType 0.5s ease-out forwards;
    margin-bottom: var(--spacing-2);
}

.terminal-prompt {
    color: #10b981;
    margin-right: var(--spacing-2);
}

.terminal-text {
    color: #06b6d4;
}

@keyframes terminalType {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.portfolio-hero__content {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: var(--spacing-4);
}

.portfolio-hero__status {
    display: inline-block;
    margin-bottom: var(--spacing-4);
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: var(--radius-full);
    border: 1px solid rgba(6, 182, 212, 0.5);
    background: rgba(6, 182, 212, 0.2);
    color: #06b6d4;
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
}

.portfolio-hero__title {
    font-size: clamp(2.5rem, 8vw, 6rem);
    font-weight: 900;
    margin-bottom: var(--spacing-6);
    letter-spacing: -0.02em;
    background: linear-gradient(to bottom, #ffffff, #64748b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
}

.portfolio-hero__subtitle {
    height: 3rem;
    overflow: hidden;
    margin-bottom: var(--spacing-8);
    font-size: clamp(1rem, 3vw, 1.875rem);
    color: #94a3b8;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
}

.portfolio-hero__highlight {
    color: #06b6d4;
}

.portfolio-hero__actions {
    display: flex;
    gap: var(--spacing-4);
    justify-content: center;
    flex-wrap: wrap;
}

.portfolio-hero__btn {
    padding: var(--spacing-3) var(--spacing-6);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-base);
}

.portfolio-hero__btn--primary {
    background: #06b6d4;
    color: #000000;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
}

.portfolio-hero__btn--primary:hover {
    background: #0891b2;
    transform: translateY(-2px);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.7);
}

.portfolio-hero__btn--secondary {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #374151;
}

.portfolio-hero__btn--secondary:hover {
    border-color: #06b6d4;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
}

.portfolio-hero__decor {
    position: absolute;
    opacity: 0.2;
    font-size: 8rem;
    color: #06b6d4;
    z-index: 1;
}

.portfolio-hero__decor--left {
    top: 25%;
    left: 10%;
}

.portfolio-hero__decor--right {
    bottom: 25%;
    right: 10%;
    color: #8b5cf6;
}

@media (max-width: 768px) {
    .portfolio-hero__decor {
        font-size: 4rem;
    }

    .portfolio-hero__decor--left {
        left: 5%;
    }

    .portfolio-hero__decor--right {
        right: 5%;
    }
}
</style>

