<template>
    <div class="portfolio-page">
        <!-- Scroll Progress Bar -->
        <div class="scroll-progress" :style="{ width: `${scrollProgress}%` }"></div>

        <!-- Navigation -->
        <PortfolioNavbar />

        <!-- Hero Section - Màn 1: The Initialization -->
        <PortfolioHero />

        <!-- About Section - Màn 2: The Core Identity -->
        <PortfolioAbout />

        <!-- Skills Section - Màn 3: The Tech Stack Orbit -->
        <PortfolioSkills />

        <!-- Experience Timeline - Màn 4 -->
        <PortfolioExperience />

        <!-- Projects Section - Màn 5-6 -->
        <PortfolioProjects />

        <!-- Code Philosophy - Màn 7 -->
        <PortfolioPhilosophy />

        <!-- Creative Playground - Màn 8 -->
        <PortfolioPlayground />

        <!-- Testimonials/Github Stats - Màn 9 -->
        <PortfolioStats />

        <!-- Contact Section - Màn 10 -->
        <PortfolioContact />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PortfolioNavbar from '@/components/portfolio/PortfolioNavbar.vue'
import PortfolioHero from '@/components/portfolio/PortfolioHero.vue'
import PortfolioAbout from '@/components/portfolio/PortfolioAbout.vue'
import PortfolioSkills from '@/components/portfolio/PortfolioSkills.vue'
import PortfolioExperience from '@/components/portfolio/PortfolioExperience.vue'
import PortfolioProjects from '@/components/portfolio/PortfolioProjects.vue'
import PortfolioPhilosophy from '@/components/portfolio/PortfolioPhilosophy.vue'
import PortfolioPlayground from '@/components/portfolio/PortfolioPlayground.vue'
import PortfolioStats from '@/components/portfolio/PortfolioStats.vue'
import PortfolioContact from '@/components/portfolio/PortfolioContact.vue'

const scrollProgress = ref(0)

const { y } = useScroll(window)

const updateScrollProgress = () => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const progress = (scrollTop / (documentHeight - windowHeight)) * 100
    scrollProgress.value = Math.min(100, Math.max(0, progress))
}

onMounted(() => {
    window.addEventListener('scroll', updateScrollProgress)
    updateScrollProgress()
})

onUnmounted(() => {
    window.removeEventListener('scroll', updateScrollProgress)
})
</script>

<style scoped>
.portfolio-page {
    min-height: 100vh;
    background: #000000;
    color: #ffffff;
    font-family: var(--font-family-sans);
    position: relative;
    overflow-x: hidden;
}

.scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #06b6d4, #8b5cf6);
    z-index: 1000;
    transition: width 0.1s ease-out;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}
</style>

