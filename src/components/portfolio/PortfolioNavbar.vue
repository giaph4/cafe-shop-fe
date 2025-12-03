<template>
    <nav class="portfolio-navbar" ref="navbarRef">
        <div class="portfolio-navbar__brand">
            <i class="bi bi-terminal"></i>
            <span>HGP.SYSTEM</span>
        </div>
        <div class="portfolio-navbar__links">
            <a href="#about" class="portfolio-navbar__link">/ROOT/ABOUT</a>
            <a href="#skills" class="portfolio-navbar__link">/SYS/SKILLS</a>
            <a href="#projects" class="portfolio-navbar__link">/USR/PROJECTS</a>
            <a href="#contact" class="portfolio-navbar__link">/NET/CONTACT</a>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMotion } from '@vueuse/motion'

const navbarRef = ref(null)

onMounted(() => {
    if (navbarRef.value) {
        useMotion(navbarRef.value, {
            initial: { y: -100, opacity: 0 },
            enter: { y: 0, opacity: 1, transition: { duration: 800, ease: 'easeOut' } }
        })
    }
})
</script>

<style scoped>
.portfolio-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-4) var(--spacing-6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(6, 182, 212, 0.3);
}

.portfolio-navbar__brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    font-family: 'Courier New', monospace;
    color: #06b6d4;
}

.portfolio-navbar__links {
    display: none;
    gap: var(--spacing-8);
}

.portfolio-navbar__link {
    font-size: var(--font-size-sm);
    font-family: 'Courier New', monospace;
    color: #94a3b8;
    text-decoration: none;
    transition: color var(--transition-fast);
}

.portfolio-navbar__link:hover {
    color: #06b6d4;
}

@media (min-width: 768px) {
    .portfolio-navbar__links {
        display: flex;
    }
}
</style>

