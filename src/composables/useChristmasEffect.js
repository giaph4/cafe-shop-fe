import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Composable để quản lý hiệu ứng Noel (Christmas Tree Burst Effect)
 * Sử dụng để tạo hiệu ứng nổ cây thông Noel khi click button
 */
export function useChristmasEffect() {
    const particles = ref([])
    const showMessage = ref(false)

    // Kho ký tự để random
    const icons = ['🎄', '🎄', '🎄', '❄️', '⭐', '🎅', '🎁', '🦌']

    /**
     * Tạo hiệu ứng nổ từ vị trí button
     * @param {HTMLElement} buttonElement - Element button được click
     */
    const spawnEffect = (buttonElement) => {
        if (!buttonElement) return

        // 1. Hiển thị lời chúc
        showMessage.value = true
        setTimeout(() => {
            showMessage.value = false
        }, 3000)

        // 2. Lấy vị trí button để hiệu ứng nổ ra từ đúng chỗ đó
        const rect = buttonElement.getBoundingClientRect()
        
        // Tâm của button
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // 3. Tạo ra 30 hạt mỗi lần bấm
        const count = 30

        for (let i = 0; i < count; i++) {
            const id = Date.now() + i + Math.random()

            // Random góc bay (0 -> 360 độ)
            const angle = Math.random() * Math.PI * 2

            // Random lực bay (velocity) - độ xa
            const velocity = 100 + Math.random() * 250

            // Tính toán đích đến (x, y) dựa trên góc và lực
            // Thêm một chút Gravity (trọng lực) ảo bằng cách tăng Y dương nhiều hơn Y âm
            const tx = Math.cos(angle) * velocity
            const ty = Math.sin(angle) * velocity + 100 // +100 để tạo cảm giác rơi xuống cuối

            // Random độ xoay
            const r = (Math.random() - 0.5) * 360

            particles.value.push({
                id,
                x: centerX,
                y: centerY,
                tx: tx,
                ty: ty,
                r: r,
                char: icons[Math.floor(Math.random() * icons.length)]
            })
        }

        // 4. Dọn dẹp các hạt sau khi animation kết thúc (1.2s)
        setTimeout(() => {
            // Xóa 30 hạt đầu tiên (cũ nhất) để tránh đầy bộ nhớ
            if (particles.value.length > count) {
                particles.value.splice(0, count)
            } else {
                particles.value = []
            }
        }, 1200)
    }

    /**
     * Hàm bind style vào thẻ div particle
     * @param {Object} p - Particle object
     * @returns {Object} Style object
     */
    const getParticleStyle = (p) => {
        return {
            left: p.x + 'px',
            top: p.y + 'px',
            '--tx': p.tx + 'px',
            '--ty': p.ty + 'px',
            '--r': p.r + 'deg'
        }
    }

    return {
        particles,
        showMessage,
        spawnEffect,
        getParticleStyle
    }
}
