<template>
  <Teleport to="body">
    <div
      ref="modal"
      class="payment-result-modal modal fade"
      :class="{ show: result }"
      tabindex="-1"
      role="dialog"
      aria-labelledby="paymentResultModalLabel"
      :aria-hidden="!result"
      @click.self="handleClose"
    >
      <canvas id="confetti-canvas" />
      <div
        v-if="result"
        class="modal-backdrop fade show"
        @click="handleClose"
      />
      <div
        class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        @click.stop
      >
        <div class="modal-content">
          <!-- Success State -->
          <div
            v-if="result === 'success'"
            class="payment-result payment-result--success"
          >
            <div class="success-icon-wrapper">
              <div class="success-icon-circle">
                <i class="bi bi-check-circle-fill success-icon" />
              </div>
              <div class="ripple-bg" />
            </div>
            <h1>Thanh toán thành công!</h1>
            <p>{{ successMessage }}</p>
            <div
              v-if="orderInfo"
              class="order-info"
            >
              <span class="order-id">Mã đơn: #{{ orderInfo.id || orderInfo.code || 'N/A' }}</span>
              <span class="order-amount">{{ formatCurrency(orderInfo.totalAmount || orderInfo.total || 0) }}</span>
            </div>
            <div class="action-buttons">
              <button
                class="action-btn"
                @click="handleContinue"
              >
                Tiếp tục
              </button>
              <button
                v-if="showViewDetail"
                class="secondary-btn"
                @click="handleViewDetail"
              >
                Xem chi tiết đơn hàng
              </button>
            </div>
          </div>

          <!-- Failure State -->
          <div
            v-else-if="result && result === 'failure'"
            class="payment-result payment-result--failure"
          >
            <div class="error-wrapper">
              <div class="error-icon">
                <i class="bi bi-x-circle" />
              </div>
            </div>
            <h1>Thanh toán thất bại</h1>
            <p>{{ errorMessage || 'Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.' }}</p>
            <div class="action-buttons">
              <button
                class="action-btn action-btn--retry"
                @click="handleRetry"
              >
                Thử lại
              </button>
              <button
                class="secondary-btn"
                @click="handleClose"
              >
                Đóng
              </button>
            </div>
          </div>

          <!-- Timeout State -->
          <div
            v-else-if="result && result === 'timeout'"
            class="payment-result payment-result--timeout"
          >
            <div class="timeout-wrapper">
              <div class="timeout-icon">
                <i class="bi bi-clock-history" />
              </div>
            </div>
            <h1>Hết thời gian chờ</h1>
            <p>Yêu cầu thanh toán đã hết thời gian chờ. Vui lòng thử lại.</p>
            <div class="action-buttons">
              <button
                class="action-btn action-btn--retry"
                @click="handleRetry"
              >
                Thử lại
              </button>
              <button
                class="secondary-btn"
                @click="handleClose"
              >
                Đóng
              </button>
            </div>
          </div>

          <!-- Network Error State -->
          <div
            v-else-if="result && result === 'network_error'"
            class="payment-result payment-result--network-error"
          >
            <div class="network-error-wrapper">
              <div class="network-error-icon">
                <i class="bi bi-wifi-off" />
              </div>
            </div>
            <h1>Lỗi kết nối</h1>
            <p>Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.</p>
            <div class="action-buttons">
              <button
                class="action-btn action-btn--retry"
                @click="handleRetry"
              >
                Thử lại
              </button>
              <button
                class="secondary-btn"
                @click="handleClose"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Modal } from 'bootstrap'
import { formatCurrency } from '@/utils/formatters'
import { createConfetti, createConfettiCanvas } from '@/utils/confetti'

const props = defineProps({
    result: {
        type: String,
        required: false,
        default: null,
        validator: (value) => value === null || ['success', 'failure', 'timeout', 'network_error'].includes(value)
    },
    orderInfo: {
        type: Object,
        default: null
    },
    successMessage: {
        type: String,
        default: 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý và sẽ giao sớm nhất.'
    },
    errorMessage: {
        type: String,
        default: null
    },
    showViewDetail: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['continue', 'view-detail', 'retry', 'close'])

const modal = ref(null)
let modalInstance = null
let confettiCleanup = null

const handleContinue = () => {
    emit('continue')
    hide()
}

const handleViewDetail = () => {
    // Đóng modal trước khi emit event
    hide()
    // Đợi một chút để modal đóng hoàn toàn
    setTimeout(() => {
        emit('view-detail')
    }, 300)
}

const handleRetry = () => {
    emit('retry')
    hide()
}

const handleClose = () => {
    emit('close')
    hide()
}

const show = async () => {
    // Đóng tất cả modal khác trước khi mở
    await closeAllOtherModals()
    
    if (modalInstance) {
        modalInstance.show()

        // Trigger confetti nếu thành công
        if (props.result === 'success') {
            setTimeout(() => {
                createConfettiCanvas()
                confettiCleanup = createConfetti()
            }, 300)
        }
    }
}

// Đóng tất cả modal khác
const closeAllOtherModals = async () => {
    try {
        // Đóng tất cả modal Bootstrap còn sót lại
        if (typeof bootstrap !== 'undefined' && bootstrap?.Modal) {
            const openModals = document.querySelectorAll('.modal.show:not(.payment-result-modal)')
            const promises = []
            openModals.forEach(modalElement => {
                const bsModal = bootstrap.Modal.getInstance(modalElement)
                if (bsModal) {
                    promises.push(new Promise(resolve => {
                        modalElement.addEventListener('hidden.bs.modal', resolve, { once: true })
                        bsModal.hide()
                    }))
                }
            })
            await Promise.all(promises)
        }
    } catch (error) {
        console.warn('Error closing other modals:', error)
    }
    
    // Đợi modal đóng hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // Cleanup backdrop
    cleanupBackdrops()
}

// Cleanup backdrop
const cleanupBackdrops = () => {
    // Chỉ cleanup backdrop nếu modal không còn hiển thị
    if (!props.result) {
        const backdrops = document.querySelectorAll('.modal-backdrop')
        backdrops.forEach(backdrop => {
            // Chỉ xóa backdrop không thuộc về modal đang mở
            const modalElement = backdrop.closest('.modal.show')
            if (!modalElement) {
                backdrop.remove()
            }
        })
        
        // Xóa class modal-open khỏi body nếu không còn modal nào mở
        const openModals = document.querySelectorAll('.modal.show')
        if (openModals.length === 0) {
            document.body.classList.remove('modal-open')
            document.body.style.overflow = ''
            document.body.style.paddingRight = ''
        }
    }
}

const hide = () => {
    if (modalInstance) {
        modalInstance.hide()
    }

    // Cleanup confetti
    if (confettiCleanup) {
        confettiCleanup()
        confettiCleanup = null
    }

    // Remove canvas
    const canvas = document.getElementById('confetti-canvas')
    if (canvas) {
        canvas.remove()
    }
    
    // Cleanup backdrop và body styles sau khi đóng
    setTimeout(() => {
        // Xóa tất cả backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop')
        backdrops.forEach(backdrop => backdrop.remove())
        
        // Xóa class modal-open khỏi body
        document.body.classList.remove('modal-open')
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
    }, 350)
}

onMounted(() => {
    // Cleanup bất kỳ backdrop nào còn sót lại khi component mount
    cleanupBackdrops()
    
    if (modal.value) {
        modalInstance = new Modal(modal.value, {
            backdrop: false, // Tự quản lý backdrop
            keyboard: true
        })

        modal.value.addEventListener('hidden.bs.modal', () => {
            hide()
        })
    }
})

onBeforeUnmount(() => {
    if (confettiCleanup) {
        confettiCleanup()
    }

    const canvas = document.getElementById('confetti-canvas')
    if (canvas) {
        canvas.remove()
    }

    if (modalInstance) {
        modalInstance.dispose()
        modalInstance = null
    }
})

watch(() => props.result, async (newResult) => {
    if (newResult) {
        await nextTick()
        if (modalInstance && modal.value) {
            show()
        }
    } else {
        // Đóng modal nếu result = null
        if (modalInstance) {
            hide()
        }
    }
}, { immediate: true })

defineExpose({ show, hide })
</script>

<style scoped>
/* CSS Variables */
:root {
  --success-color: #4CAF50;
  --success-hover: #43a047;
  --failure-color: #f44336;
  --failure-hover: #d32f2f;
  --timeout-color: #ff9800;
  --network-error-color: #9e9e9e;
  --bg-color: #f0f2f5;
  --card-bg: #ffffff;
  --text-color: #333333;
  --text-secondary: #666666;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

/* Canvas */
#confetti-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

/* Modal Container - Fixed positioning */
.payment-result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1060; /* Cao hơn PosPaymentModal (1055) */
  display: none;
  overflow-x: hidden;
  overflow-y: auto;
  pointer-events: none;
}

.payment-result-modal.show {
  display: block;
  pointer-events: auto;
}

/* Modal Backdrop - Behind modal content */
.payment-result-modal :global(.modal-backdrop) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1055;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
}

/* Modal Dialog - Above backdrop */
.payment-result-modal :global(.modal-dialog) {
  position: relative;
  z-index: 1061;
  max-width: 450px;
  margin: var(--spacing-4) auto;
  pointer-events: none;
}

.payment-result-modal :global(.modal-content) {
  pointer-events: auto;
  border: none;
  border-radius: var(--component-radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-modal);
  background: var(--color-card);
  overflow: hidden;
}

.payment-result-modal :global(.modal-body) {
  padding: 0;
}

/* Payment Result Container */
.payment-result {
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Success State */
.payment-result--success {
  background: var(--card-bg);
}

/* Success Icon Animation */
.success-icon-wrapper {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(76, 175, 80, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-icon {
  font-size: 80px;
  color: var(--success-color);
  animation: checkmarkPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s both;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes checkmarkPop {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.ripple-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 50%;
  z-index: 1;
  animation: ripple 1.5s infinite;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 140px;
    height: 140px;
    opacity: 0;
  }
}

/* Failure State */
.payment-result--failure {
  background: var(--card-bg);
}

.error-wrapper {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(244, 67, 54, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: shake 0.5s ease-in-out;
}

.error-icon i {
  font-size: 60px;
  color: var(--failure-color);
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

/* Timeout State */
.payment-result--timeout {
  background: var(--card-bg);
}

.timeout-wrapper {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeout-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 152, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

.timeout-icon i {
  font-size: 60px;
  color: var(--timeout-color);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Network Error State */
.payment-result--network-error {
  background: var(--card-bg);
}

.network-error-wrapper {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-error-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(158, 158, 158, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeInOut 2s infinite;
}

.network-error-icon i {
  font-size: 60px;
  color: var(--network-error-color);
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Typography */
.payment-result h1 {
  color: var(--text-color);
  font-size: 24px;
  margin-bottom: 10px;
  font-weight: 700;
  font-family: var(--font-family-sans);
}

.payment-result p {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.5;
  margin-bottom: 30px;
  font-family: var(--font-family-sans);
}

/* Order Info */
.order-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  width: 100%;
  margin-bottom: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-id {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  font-family: var(--font-family-sans);
}

.order-amount {
  font-weight: 700;
  color: var(--text-color);
  font-family: var(--font-family-sans);
}

/* Action Buttons */
.action-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  background-color: var(--success-color);
  color: white;
  text-decoration: none;
  padding: 12px 30px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
  display: inline-block;
  border: none;
  cursor: pointer;
  width: 100%;
  font-family: var(--font-family-sans);
}

.action-btn:hover {
  background-color: var(--success-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
}

.action-btn--retry {
  background-color: var(--failure-color);
  box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
}

.action-btn--retry:hover {
  background-color: var(--failure-hover);
  box-shadow: 0 8px 20px rgba(244, 67, 54, 0.4);
}

.secondary-btn {
  background-color: transparent;
  color: var(--text-secondary);
  margin-top: 0;
  font-size: 14px;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-family: var(--font-family-sans);
}

.secondary-btn:hover {
  color: var(--text-color);
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .payment-result {
    padding: 30px 20px;
  }

  .payment-result h1 {
    font-size: 20px;
  }

  .payment-result p {
    font-size: 14px;
  }

  .success-icon-wrapper,
  .error-wrapper,
  .timeout-wrapper,
  .network-error-wrapper {
    width: 80px;
    height: 80px;
  }

  .success-icon-circle {
    width: 80px;
    height: 80px;
  }

  .success-icon {
    font-size: 50px;
  }

  .error-icon i,
  .timeout-icon i,
  .network-error-icon i {
    font-size: 50px;
  }
}
</style>

