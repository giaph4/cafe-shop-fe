<template>
    <Teleport to="body">
        <div class="modal fade" ref="modalEl" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title">Xem & chỉnh sửa ảnh đại diện</h5>
                            <p class="text-muted mb-0">Bạn có thể phóng to/thu nhỏ cửa sổ và dùng cọ để vẽ ghi chú lên ảnh.</p>
                        </div>
                        <button type="button" class="btn-close" @click="hide"></button>
                    </div>

                    <div class="modal-body">
                        <div v-if="loading" class="text-center py-4">
                            <span class="spinner-border text-primary"></span>
                            <div class="text-muted small mt-2">Đang tải ảnh...</div>
                        </div>
                        <div v-else class="editor-wrapper">
                            <div class="canvas-container">
                                <canvas
                                    ref="canvasEl"
                                    width="640"
                                    height="640"
                                    @pointerdown="handlePointerDown"
                                    @pointermove.prevent="handlePointerMove"
                                    @pointerup="handlePointerUp"
                                    @pointerleave="handlePointerUp"
                                ></canvas>
                                <div v-if="!imageLoaded" class="canvas-placeholder">
                                    <i class="bi bi-image"></i>
                                    <p class="mb-0">Chưa có ảnh hợp lệ để chỉnh sửa.</p>
                                </div>
                            </div>
                            <div class="tool-panel">
                                <div class="tool-group">
                                    <label class="form-label">Màu cọ</label>
                                    <input type="color" v-model="brushColor" class="form-control form-control-color" />
                                </div>
                                <div class="tool-group">
                                    <label class="form-label">Kích thước cọ: {{ brushSize }} px</label>
                                    <input type="range" min="2" max="60" step="1" v-model.number="brushSize" class="form-range" />
                                </div>
                                <div class="tool-actions btn-group flex-wrap" role="group">
                                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="resetDrawing" :disabled="!imageLoaded">
                                        <i class="bi bi-arrow-counterclockwise me-1"></i>Làm mới
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm" @click="clearCanvas" :disabled="!imageLoaded">
                                        <i class="bi bi-eraser me-1"></i>Xóa nét vẽ
                                    </button>
                                </div>
                                <div class="alert alert-light mt-3 small">
                                    <div class="fw-semibold mb-1">Mẹo:</div>
                                    <ul class="mb-0 ps-3">
                                        <li>Giữ chuột và kéo để vẽ.</li>
                                        <li>Dùng nút "Làm mới" để tải lại ảnh gốc.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                        <button type="button" class="btn btn-primary" @click="applyEdits" :disabled="!imageLoaded || applying">
                            <span v-if="applying" class="spinner-border spinner-border-sm me-2"></span>
                            Lưu chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import {Modal} from 'bootstrap'
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue'
import {toast} from 'vue3-toastify'
import api from '@/api/axios'
import logger from '@/utils/logger'

const emit = defineEmits(['apply', 'closed'])

const modalEl = ref(null)
const canvasEl = ref(null)
let modalInstance = null
let ctx = null

const loading = ref(false)
const applying = ref(false)
const brushColor = ref('#ff4d4f')
const brushSize = ref(8)
const imageLoaded = ref(false)
const baseImageSrc = ref('')
let baseImage = null
let fetchedObjectUrl = ''

const isDrawing = ref(false)
const lastPoint = ref({x: 0, y: 0})

const initCanvasContext = () => {
    if (!canvasEl.value) return
    ctx = canvasEl.value.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height)
}

const revokeFetchedUrl = () => {
    if (fetchedObjectUrl) {
        URL.revokeObjectURL(fetchedObjectUrl)
        fetchedObjectUrl = ''
    }
}

const resolveImageSource = async (src) => {
    if (!src) return ''
    if (src.startsWith('data:') || src.startsWith('blob:')) {
        return src
    }

    const isAbsolute = /^https?:\/\//i.test(src)
    const requestUrl = isAbsolute ? src : src.startsWith('/') ? src : `/${src}`

    try {
        const response = await api.get(requestUrl, {
            responseType: 'blob',
            // Nếu là URL tuyệt đối, bỏ baseURL để axios dùng trực tiếp
            baseURL: isAbsolute ? undefined : import.meta.env.VITE_API_BASE_URL
        })

        const blob = response?.data
        if (!blob || !blob.size) {
            throw new Error('Empty blob')
        }

        revokeFetchedUrl()
        fetchedObjectUrl = URL.createObjectURL(blob)
        return fetchedObjectUrl
    } catch (err) {
        logger.error('Failed to load image for editing:', err)
        toast.error('Không thể tải ảnh gốc để chỉnh sửa. Bạn hãy chọn ảnh mới từ máy nhé.')
        return ''
    }
}

const drawBaseImage = async () => {
    if (!baseImageSrc.value) {
        imageLoaded.value = false
        toast.warning('Không tìm thấy nguồn ảnh để chỉnh sửa.')
        return
    }

    loading.value = true
    imageLoaded.value = false

    try {
        const resolvedSrc = await resolveImageSource(baseImageSrc.value)
        if (!resolvedSrc) {
            loading.value = false
            return
        }

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            baseImage = img
            if (!canvasEl.value) {
                loading.value = false
                return
            }
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height)

            const canvasWidth = canvasEl.value.width
            const canvasHeight = canvasEl.value.height
            const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height)
            const drawWidth = img.width * scale
            const drawHeight = img.height * scale
            const offsetX = (canvasWidth - drawWidth) / 2
            const offsetY = (canvasHeight - drawHeight) / 2

            try {
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
                imageLoaded.value = true
            } catch (drawErr) {
                logger.error('Failed to draw image (CORS):', drawErr)
                toast.error('Không thể hiển thị ảnh để chỉnh sửa (CORS). Vui lòng chọn ảnh khác hoặc liên hệ quản trị.')
                imageLoaded.value = false
            } finally {
                loading.value = false
            }
        }

        img.onerror = () => {
            loading.value = false
            imageLoaded.value = false
            toast.error('Không thể tải ảnh để chỉnh sửa. Vui lòng thử lại hoặc chọn ảnh khác.')
        }

        img.src = resolvedSrc
    } catch (err) {
        logger.error('Failed to load image:', err)
        loading.value = false
        imageLoaded.value = false
        toast.error('Không thể tải ảnh để chỉnh sửa. Vui lòng thử lại hoặc chọn ảnh khác.')
    }
}

const hide = () => {
    modalInstance?.hide()
}

const open = async (src) => {
    if (!src) {
        toast.warning('Chưa có ảnh để xem/chỉnh sửa.')
        return
    }
    baseImageSrc.value = src
    await nextTick()
    modalInstance?.show()
    await nextTick()
    initCanvasContext()
    drawBaseImage()
}

const handlePointerDown = (event) => {
    if (!imageLoaded.value || !ctx) return
    isDrawing.value = true
    canvasEl.value.setPointerCapture(event.pointerId)
    const {x, y} = getCanvasCoordinates(event)
    lastPoint.value = {x, y}
    ctx.beginPath()
    ctx.moveTo(x, y)
}

const handlePointerMove = (event) => {
    if (!isDrawing.value || !ctx) return
    const {x, y} = getCanvasCoordinates(event)
    ctx.strokeStyle = brushColor.value
    ctx.lineWidth = brushSize.value
    ctx.lineTo(x, y)
    ctx.stroke()
    lastPoint.value = {x, y}
}

const handlePointerUp = (event) => {
    if (!isDrawing.value) return
    isDrawing.value = false
    if (canvasEl.value) {
        canvasEl.value.releasePointerCapture(event.pointerId)
    }
    ctx?.closePath?.()
}

const getCanvasCoordinates = (event) => {
    const rect = canvasEl.value.getBoundingClientRect()
    return {
        x: ((event.clientX - rect.left) / rect.width) * canvasEl.value.width,
        y: ((event.clientY - rect.top) / rect.height) * canvasEl.value.height
    }
}

const resetDrawing = () => {
    if (!ctx) return
    drawBaseImage()
}

const clearCanvas = () => {
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height)
    if (baseImage) {
        const canvasWidth = canvasEl.value.width
        const canvasHeight = canvasEl.value.height
        const scale = Math.min(canvasWidth / baseImage.width, canvasHeight / baseImage.height)
        const drawWidth = baseImage.width * scale
        const drawHeight = baseImage.height * scale
        const offsetX = (canvasWidth - drawWidth) / 2
        const offsetY = (canvasHeight - drawHeight) / 2
        ctx.drawImage(baseImage, offsetX, offsetY, drawWidth, drawHeight)
    }
}

const applyEdits = () => {
    if (!canvasEl.value || !imageLoaded.value) return
    applying.value = true
    canvasEl.value.toBlob(
        (blob) => {
            applying.value = false
            if (!blob) {
                toast.error('Không thể lấy dữ liệu ảnh sau khi chỉnh sửa.')
                return
            }
            const file = new File([blob], `avatar-edit-${Date.now()}.png`, {type: 'image/png'})
            const url = URL.createObjectURL(file)
            emit('apply', {file, url})
            hide()
        },
        'image/png',
        0.95
    )
}

onMounted(() => {
    modalInstance = new Modal(modalEl.value, {backdrop: 'static'})
    modalEl.value.addEventListener('hidden.bs.modal', () => {
        isDrawing.value = false
        emit('closed')
    })
})

onBeforeUnmount(() => {
    modalInstance?.dispose()
    modalInstance = null
    revokeFetchedUrl()
    if (ctx && canvasEl.value) {
        ctx = null
    }
})

defineExpose({open, hide})
</script>

<style scoped>
.editor-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
    justify-content: center;
}

.canvas-container {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.35);
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
    background: #ffffff;
}

canvas {
    display: block;
    width: min(640px, 80vw);
    height: min(640px, 80vw);
    touch-action: none;
}

.canvas-placeholder {
    position: absolute;
    inset: 0;
    background: rgba(248, 249, 252, 0.92);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #64748b;
    text-align: center;
    padding: 1rem;
    gap: 0.75rem;
}

.canvas-placeholder i {
    font-size: 3rem;
}

.tool-panel {
    min-width: 240px;
    max-width: 280px;
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.tool-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tool-actions .btn {
    min-width: 110px;
}

@media (max-width: 768px) {
    .tool-panel {
        width: 100%;
        max-width: none;
    }
}
</style>
