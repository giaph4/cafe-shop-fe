/**
 * Confetti Animation Utility
 * Tạo hiệu ứng pháo giấy khi thanh toán thành công
 */

export function createConfetti (canvasId = 'confetti-canvas') {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
        console.warn(`Canvas với id "${canvasId}" không tồn tại`)
        return null
    }

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let particles = []
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF9800']

    function Particle (x, y) {
        this.x = x
        this.y = y
        this.size = Math.random() * 8 + 4
        this.speedX = Math.random() * 6 - 3
        this.speedY = Math.random() * -10 - 2
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.gravity = 0.2
        this.rotation = Math.random() * 360
        this.rotationSpeed = Math.random() * 10 - 5
    }

    Particle.prototype.update = function () {
        this.x += this.speedX
        this.y += this.speedY
        this.speedY += this.gravity
        this.rotation += this.rotationSpeed

        if (this.size > 0.2) this.size -= 0.05
    }

    Particle.prototype.draw = function () {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation * Math.PI / 180)
        ctx.fillStyle = this.color
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
        ctx.restore()
    }

    function startConfetti () {
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        for (let i = 0; i < 150; i++) {
            particles.push(new Particle(centerX, centerY))
        }

        animateConfetti()
    }

    function animateConfetti () {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < particles.length; i++) {
            particles[i].update()
            particles[i].draw()

            if (particles[i].size <= 0.2 || particles[i].y > canvas.height) {
                particles.splice(i, 1)
                i--
            }
        }

        if (particles.length > 0) {
            requestAnimationFrame(animateConfetti)
        } else {
            // Cleanup khi animation kết thúc
            canvas.remove()
        }
    }

    // Handle resize
    const handleResize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Start animation
    startConfetti()

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize)
        particles = []
    }
}

/**
 * Tạo canvas cho confetti
 */
export function createConfettiCanvas () {
    // Kiểm tra xem canvas đã tồn tại chưa
    let canvas = document.getElementById('confetti-canvas')
    if (canvas) {
        return canvas
    }

    canvas = document.createElement('canvas')
    canvas.id = 'confetti-canvas'
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '9999'
    document.body.appendChild(canvas)

    return canvas
}

