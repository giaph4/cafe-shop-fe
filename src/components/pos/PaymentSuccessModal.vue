<template>
  <Teleport to="body">
    <div
      ref="modalElement"
      class="modal fade"
      tabindex="-1"
      aria-labelledby="successModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content text-center">
          <div class="modal-body">
            <div class="success-checkmark">
              <div class="check-icon">
                <span class="icon-line line-tip" />
                <span class="icon-line line-long" />
                <div class="icon-circle" />
                <div class="icon-fix" />
              </div>
            </div>

            <h4 id="successModalLabel" class="modal-title">
              Thanh toán thành công!
            </h4>
            <p class="text-muted">
              Đơn hàng đã được xử lý và ghi nhận.
            </p>

            <div class="d-grid gap-2 mt-4">
              <button
                type="button"
                class="btn btn-primary"
                @click="handleViewDetails"
              >
                <i class="bi bi-receipt-cutoff me-2" />
                Xem chi tiết đơn hàng
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary mt-2"
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
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['close', 'view-details'])

const modalElement = ref(null)
let modalInstance = null

const handleClose = () => {
  emit('close')
}

const handleViewDetails = () => {
  if (props.orderId) {
    emit('view-details', props.orderId)
  }
}

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    modalInstance?.show()
  } else {
    modalInstance?.hide()
  }
})

onMounted(() => {
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value, {
      backdrop: 'static',
      keyboard: false
    })

    modalElement.value.addEventListener('hidden.bs.modal', () => {
        emit('close');
    });
  }
})

onBeforeUnmount(() => {
  modalInstance?.dispose()
})
</script>

<style scoped>
.modal-content {
  border-radius: var(--radius-lg);
  border: none;
  padding: var(--spacing-5);
}

.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-success-dark);
}

.btn-primary {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.btn-primary:hover {
    background-color: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
}

/* Success Checkmark Animation */
.success-checkmark {
  width: 80px;
  height: 115px;
  margin: 0 auto;
}
.check-icon {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid var(--color-success);
}
.check-icon::before {
  top: 3px;
  left: -2px;
  width: 30px;
  transform-origin: 100% 50%;
  border-radius: 100px 0 0 100px;
}
.check-icon::after {
  top: 0;
  left: 30px;
  width: 60px;
  transform-origin: 0 50%;
  border-radius: 0 100px 100px 0;
  animation: rotate-circle 4.25s ease-in;
}
.check-icon::before,
.check-icon::after {
  content: '';
  height: 100px;
  position: absolute;
  background: var(--color-card);
  transform: rotate(-45deg);
}
.icon-line {
  height: 5px;
  background-color: var(--color-success);
  display: block;
  border-radius: 2px;
  position: absolute;
  z-index: 10;
}
.icon-line.line-tip {
  top: 46px;
  left: 14px;
  width: 25px;
  transform: rotate(45deg);
  animation: icon-line-tip 0.75s;
}
.icon-line.line-long {
  top: 38px;
  right: 8px;
  width: 47px;
  transform: rotate(-45deg);
  animation: icon-line-long 0.75s;
}
.icon-circle {
  top: -4px;
  left: -4px;
  z-index: 10;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  position: absolute;
  box-sizing: content-box;
  border: 4px solid rgba(var(--rgb-success), 0.5);
}
.icon-fix {
  top: 8px;
  width: 5px;
  left: 26px;
  z-index: 1;
  height: 85px;
  position: absolute;
  transform: rotate(-45deg);
  background-color: var(--color-card);
}
@keyframes rotate-circle {
  0% {
    transform: rotate(-45deg);
  }
  5% {
    transform: rotate(-45deg);
  }
  12% {
    transform: rotate(-405deg);
  }
  100% {
    transform: rotate(-405deg);
  }
}
@keyframes icon-line-tip {
  0% {
    width: 0;
    left: 1px;
    top: 19px;
  }
  54% {
    width: 0;
    left: 1px;
    top: 19px;
  }
  70% {
    width: 50px;
    left: -8px;
    top: 37px;
  }
  84% {
    width: 17px;
    left: 21px;
    top: 48px;
  }
  100% {
    width: 25px;
    left: 14px;
    top: 46px;
  }
}
@keyframes icon-line-long {
  0% {
    width: 0;
    right: 46px;
    top: 54px;
  }
  65% {
    width: 0;
    right: 46px;
    top: 54px;
  }
  84% {
    width: 55px;
    right: 0px;
    top: 35px;
  }
  100% {
    width: 47px;
    right: 8px;
    top: 38px;
  }
}
</style>
