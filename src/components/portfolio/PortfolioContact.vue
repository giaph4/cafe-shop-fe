<template>
  <section
    id="contact"
    class="portfolio-contact"
  >
    <div class="portfolio-contact__container">
      <h2 class="portfolio-contact__title">
        <span class="portfolio-contact__number">04.</span>
        INITIALIZE HANDSHAKE
      </h2>

      <p class="portfolio-contact__subtitle">
        Hệ thống của tôi luôn sẵn sàng cho những thử thách mới.
        Nếu bạn cần một giải pháp Backend mạnh mẽ hay chỉ đơn giản là muốn trao đổi về công nghệ, hãy kết nối.
      </p>

      <!-- Terminal Input -->
      <div
        ref="terminalRef"
        class="portfolio-contact__terminal"
      >
        <div class="portfolio-contact__terminal-header">
          <div class="portfolio-contact__terminal-dots">
            <span />
            <span />
            <span />
          </div>
          <span class="portfolio-contact__terminal-title">Terminal</span>
        </div>
        <div class="portfolio-contact__terminal-body">
          <div
            v-for="(line, index) in terminalHistory"
            :key="index"
            class="portfolio-contact__terminal-line"
          >
            <span class="portfolio-contact__terminal-prompt">$</span>
            <span class="portfolio-contact__terminal-text">{{ line }}</span>
          </div>
          <div class="portfolio-contact__terminal-input">
            <span class="portfolio-contact__terminal-prompt">$</span>
            <input
              ref="inputRef"
              v-model="message"
              type="text"
              class="portfolio-contact__terminal-field"
              placeholder="Type your message here..."
              @keyup.enter="sendMessage"
            >
            <span
              class="portfolio-contact__terminal-cursor"
              :class="{ 'portfolio-contact__terminal-cursor--blink': !isTyping }"
            />
          </div>
        </div>
      </div>

      <!-- Social Links -->
      <div
        ref="socialRef"
        class="portfolio-contact__social"
      >
        <a
          v-for="(social, index) in socialLinks"
          :key="index"
          :ref="el => socialRefs[index] = el"
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="portfolio-contact__social-link"
        >
          <i :class="social.icon" />
          <span>{{ social.name }}</span>
        </a>
      </div>

      <!-- Footer -->
      <footer
        ref="footerRef"
        class="portfolio-contact__footer"
      >
        <p class="portfolio-contact__footer-text">
          BUILT WITH VUE & SPRING BOOT PASSION
        </p>
        <p class="portfolio-contact__footer-text">
          © 2024 HUỲNH GIA PHO. ALL RIGHTS RESERVED.
        </p>
        <p
          v-if="showShutdown"
          class="portfolio-contact__footer-shutdown"
        >
          System shutting down...
        </p>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useMotion } from '@vueuse/motion'
import { useIntersectionObserver } from '@vueuse/core'

const terminalRef = ref(null)
const socialRef = ref(null)
const footerRef = ref(null)
const inputRef = ref(null)
const socialRefs = ref([])

const message = ref('')
const terminalHistory = ref(['Welcome to HGP.SYSTEM', 'Type your message and press Enter to send'])
const isTyping = ref(false)
const showShutdown = ref(false)

const socialLinks = [
    { name: 'GitHub', icon: 'bi bi-github', url: 'https://github.com' },
    { name: 'LinkedIn', icon: 'bi bi-linkedin', url: 'https://linkedin.com' },
    { name: 'Email', icon: 'bi bi-envelope', url: 'mailto:contact@huynhgiapho.dev' }
]

const sendMessage = () => {
    if (!message.value.trim()) return

    terminalHistory.value.push(`> ${message.value}`)
    message.value = ''

    // Simulate response
    setTimeout(() => {
        terminalHistory.value.push('Message received. I will get back to you soon!')
    }, 500)
}

onMounted(() => {
    // Animate terminal
    if (terminalRef.value) {
        useIntersectionObserver(terminalRef.value, ([{ isIntersecting }]) => {
            if (isIntersecting) {
                useMotion(terminalRef.value, {
                    initial: { opacity: 0, y: 30 },
                    enter: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.8 }
                    }
                })

                // Focus input
                nextTick(() => {
                    if (inputRef.value) {
                        inputRef.value.focus()
                    }
                })
            }
        })
    }

    // Animate social links
    socialRefs.value.forEach((socialRef, index) => {
        if (socialRef) {
            useIntersectionObserver(socialRef, ([{ isIntersecting }]) => {
                if (isIntersecting) {
                    useMotion(socialRef, {
                        initial: { opacity: 0, scale: 0.8 },
                        enter: {
                            opacity: 1,
                            scale: 1,
                            transition: {
                                delay: index * 0.1,
                                duration: 0.5,
                                type: 'spring'
                            }
                        }
                    })
                }
            })
        }
    })

    // Show shutdown message when scrolled to bottom
    const handleScroll = () => {
        const windowHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop

        if (scrollTop + windowHeight >= documentHeight - 100) {
            showShutdown.value = true
        } else {
            showShutdown.value = false
        }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    onUnmounted(() => {
        window.removeEventListener('scroll', handleScroll)
    })
})
</script>

<style scoped>
.portfolio-contact {
    min-height: 100vh;
    padding: var(--spacing-20) var(--spacing-6);
    background: #000000;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #1e293b;
}

.portfolio-contact__container {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.portfolio-contact__title {
    font-size: var(--font-size-5xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-8);
}

.portfolio-contact__number {
    color: #06b6d4;
}

.portfolio-contact__subtitle {
    font-size: var(--font-size-lg);
    color: #94a3b8;
    margin-bottom: var(--spacing-12);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: var(--line-height-relaxed);
}

.portfolio-contact__terminal {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: var(--spacing-12);
    text-align: left;
}

.portfolio-contact__terminal-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    background: #1e293b;
    border-bottom: 1px solid #334155;
}

.portfolio-contact__terminal-dots {
    display: flex;
    gap: var(--spacing-2);
}

.portfolio-contact__terminal-dots span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #64748b;
}

.portfolio-contact__terminal-dots span:nth-child(1) {
    background: #ef4444;
}

.portfolio-contact__terminal-dots span:nth-child(2) {
    background: #eab308;
}

.portfolio-contact__terminal-dots span:nth-child(3) {
    background: #10b981;
}

.portfolio-contact__terminal-title {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: #94a3b8;
}

.portfolio-contact__terminal-body {
    padding: var(--spacing-4);
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
}

.portfolio-contact__terminal-line {
    margin-bottom: var(--spacing-2);
    color: #06b6d4;
}

.portfolio-contact__terminal-prompt {
    color: #10b981;
    margin-right: var(--spacing-2);
}

.portfolio-contact__terminal-text {
    color: #cbd5e1;
}

.portfolio-contact__terminal-input {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
}

.portfolio-contact__terminal-field {
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    outline: none;
}

.portfolio-contact__terminal-field::placeholder {
    color: #64748b;
}

.portfolio-contact__terminal-cursor {
    width: 8px;
    height: 16px;
    background: #06b6d4;
    display: inline-block;
}

.portfolio-contact__terminal-cursor--blink {
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
}

.portfolio-contact__social {
    display: flex;
    justify-content: center;
    gap: var(--spacing-4);
    margin-bottom: var(--spacing-12);
    flex-wrap: wrap;
}

.portfolio-contact__social-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-6);
    background: #1e293b;
    border-radius: var(--radius-full);
    color: #94a3b8;
    text-decoration: none;
    transition: all var(--transition-fast);
    font-size: var(--font-size-sm);
}

.portfolio-contact__social-link:hover {
    color: #ffffff;
    background: #06b6d4;
    transform: scale(1.1);
}

.portfolio-contact__social-link i {
    font-size: var(--font-size-lg);
}

.portfolio-contact__footer {
    margin-top: var(--spacing-12);
    padding-top: var(--spacing-8);
    border-top: 1px solid #1e293b;
}

.portfolio-contact__footer-text {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: #64748b;
    margin-bottom: var(--spacing-2);
}

.portfolio-contact__footer-shutdown {
    font-family: 'Courier New', monospace;
    font-size: var(--font-size-sm);
    color: #06b6d4;
    margin-top: var(--spacing-4);
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style>

