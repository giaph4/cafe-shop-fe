<template>
    <footer class="neo-bottom-bar">
        <!-- Trái: Thông tin hệ thống / môi trường -->
        <div class="neo-bottom-bar__section neo-bottom-bar__section--left">
            <div class="neo-bottom-bar__info">
                <div class="neo-bottom-bar__app-name">
                    <strong>Cafe Dashboard</strong>
                    <span class="neo-bottom-bar__env-badge">POS • Production</span>
                </div>
                <div class="neo-bottom-bar__status">
                    <span class="neo-bottom-bar__status-dot"></span>
                    <span class="neo-bottom-bar__status-text">Hệ thống hoạt động ổn định</span>
                </div>
            </div>
        </div>

        <!-- Giữa: Actions nhanh / phím tắt -->
        <div class="neo-bottom-bar__section neo-bottom-bar__section--center">
            <div class="neo-bottom-bar__actions">
                <button
                    class="neo-bottom-bar__action"
                    type="button"
                    title="Trợ giúp"
                    @click="handleHelp"
                >
                    <i class="bi bi-question-circle"></i>
                    <span class="neo-bottom-bar__action-label">Trợ giúp</span>
                </button>
                <button
                    class="neo-bottom-bar__action"
                    type="button"
                    title="Gửi phản hồi"
                    @click="handleFeedback"
                >
                    <i class="bi bi-chat-dots"></i>
                    <span class="neo-bottom-bar__action-label">Phản hồi</span>
                </button>
                <div class="neo-bottom-bar__shortcuts">
                    <span class="neo-bottom-bar__shortcut">
                        <kbd>Ctrl</kbd> + <kbd>M</kbd> <span>Máy tính</span>
                    </span>
                </div>
            </div>
        </div>

        <!-- Phải: Thời gian / ngày tháng -->
        <div class="neo-bottom-bar__section neo-bottom-bar__section--right">
            <div class="neo-bottom-bar__meta">
                <span class="neo-bottom-bar__meta-text">
                    <i class="bi bi-clock me-1"></i>
                    {{ currentTime }}
                </span>
                <span class="neo-bottom-bar__meta-divider">•</span>
                <span class="neo-bottom-bar__meta-text">
                    <i class="bi bi-calendar3 me-1"></i>
                    {{ currentDate }}
                </span>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import logger from '@/utils/logger'

const currentTime = ref('')
const currentDate = ref('')

const updateDateTime = () => {
    const now = new Date()
    currentTime.value = now.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    })
    currentDate.value = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const handleHelp = () => {
    // Placeholder for help action
    logger.log('Help clicked')
}

const handleFeedback = () => {
    // Placeholder for feedback action
    logger.log('Feedback clicked')
}

let timeInterval = null

onMounted(() => {
    updateDateTime()
    timeInterval = setInterval(updateDateTime, 1000)
})

onBeforeUnmount(() => {
    if (timeInterval) {
        clearInterval(timeInterval)
    }
})
</script>

<style scoped>
.neo-bottom-bar {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: var(--component-radius-lg, 16px);
    border: 1px solid var(--color-border);
    background: var(--color-card);
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
}

.neo-bottom-bar__section {
    display: inline-flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
}

.neo-bottom-bar__section--center {
    justify-content: center;
}

.neo-bottom-bar__section--right {
    justify-content: flex-end;
    gap: 0.8rem;
}

.neo-bottom-bar__info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.neo-bottom-bar__app-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--color-heading);
}

.neo-bottom-bar__env-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    background: var(--color-primary-soft, rgba(79, 70, 229, 0.12));
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.neo-bottom-bar__info-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-subtle);
}

.neo-bottom-bar__status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.neo-bottom-bar__status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

.neo-bottom-bar__status-text {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-heading);
}

.neo-bottom-bar__actions {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
}

.neo-bottom-bar__action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    background: var(--color-card-muted);
    color: var(--color-text-muted);
    font-size: 0.88rem;
    font-weight: 500;
    transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
    cursor: pointer;
}

.neo-bottom-bar__action:hover,
.neo-bottom-bar__action:focus-visible {
    background: rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.32);
    color: var(--color-primary);
    transform: translateY(-1px);
}

.neo-bottom-bar__action i {
    font-size: 1rem;
}

.neo-bottom-bar__action-label {
    white-space: nowrap;
}

.neo-bottom-bar__shortcuts {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: 0.5rem;
    color: var(--color-text-muted);
    font-size: 0.8rem;
}

.neo-bottom-bar__shortcut kbd {
    background: var(--color-card-muted);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.1rem 0.35rem;
    font-size: 0.75rem;
}

.neo-bottom-bar__meta {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
}

.neo-bottom-bar__meta-text {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
}

.neo-bottom-bar__meta-text i {
    font-size: 0.9rem;
}

.neo-bottom-bar__meta-divider {
    color: var(--color-text-subtle);
    font-size: 0.85rem;
}

@media (max-width: 992px) {
    .neo-bottom-bar {
        flex-direction: column;
        align-items: flex-start;
        padding: 0.75rem 1rem;
    }

    .neo-bottom-bar__section--left {
        width: 100%;
    }

    .neo-bottom-bar__section--right {
        width: 100%;
        justify-content: space-between;
    }

    .neo-bottom-bar__section--center {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .neo-bottom-bar__actions {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 768px) {
    :root {
        --bottom-bar-padding-x: clamp(0.85rem, 4vw, 1.2rem);
        --bottom-bar-gap: 0.9rem;
    }

    .neo-bottom-bar__actions {
        flex-wrap: wrap;
    }

    .neo-bottom-bar__meta-text {
        font-size: 0.8rem;
    }
}

@media (max-width: 576px) {
    .neo-bottom-bar {
        align-items: flex-start;
    }

    .neo-bottom-bar__section--left,
    .neo-bottom-bar__section--right {
        justify-content: flex-start;
    }

    .neo-bottom-bar__meta {
        flex-direction: column;
        gap: 0.4rem;
    }

    .neo-bottom-bar__meta-divider {
        display: none;
    }
}
</style>

