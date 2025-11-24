<template>
    <Teleport to="body">
        <div class="modal fade" ref="modal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="d-flex align-items-center gap-2">
                            <i :class="getFileIcon(file?.fileType)" class="fs-4"></i>
                            <div>
                                <h5 class="modal-title mb-0">{{ file?.fileName || 'Preview File' }}</h5>
                                <small class="text-muted">{{ formatFileSize(file?.fileSize) }} • {{ file?.fileType || 'Unknown' }}</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close" @click="hide" aria-label="Đóng"></button>
                    </div>

                    <div class="modal-body modal-body-scroll">
                        <div v-if="loading" class="text-center py-5">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-3 text-muted">Đang tải file...</p>
                        </div>
                        <div v-else-if="error" class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            {{ error }}
                        </div>
                        <div v-else-if="file" class="file-preview-container">
                            <!-- Image Preview -->
                            <div v-if="isImage" class="preview-image">
                                <img :src="previewUrl" :alt="file.fileName" class="img-fluid" />
                            </div>

                            <!-- PDF Preview -->
                            <div v-else-if="isPdf" class="preview-pdf">
                                <iframe :src="previewUrl" class="w-100" style="min-height: 600px; border: none;"></iframe>
                            </div>

                            <!-- Video Preview -->
                            <div v-else-if="isVideo" class="preview-video">
                                <video :src="previewUrl" controls class="w-100" style="max-height: 600px;"></video>
                            </div>

                            <!-- Audio Preview -->
                            <div v-else-if="isAudio" class="preview-audio text-center py-5">
                                <i class="bi bi-music-note-beamed display-1 text-primary mb-3"></i>
                                <audio :src="previewUrl" controls class="w-100"></audio>
                            </div>

                            <!-- Text Preview -->
                            <div v-else-if="isText" class="preview-text">
                                <pre class="bg-light p-3 rounded" style="max-height: 500px; overflow: auto;">{{ textContent }}</pre>
                            </div>

                            <!-- Unsupported Preview -->
                            <div v-else class="preview-unsupported text-center py-5">
                                <i class="bi bi-file-earmark display-1 text-muted mb-3"></i>
                                <p class="text-muted">Không thể preview loại file này</p>
                                <a :href="file.fileUrl" target="_blank" class="btn btn-primary">
                                    <i class="bi bi-download me-2"></i>Tải xuống để xem
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <div class="file-metadata">
                                <small class="text-muted">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    Upload: {{ formatDateTime(file?.uploadedAt) || 'N/A' }}
                                </small>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-secondary" @click="copyUrl">
                                    <i class="bi bi-clipboard me-2"></i>Copy URL
                                </button>
                                <a :href="file?.fileUrl" target="_blank" class="btn btn-primary" download>
                                    <i class="bi bi-download me-2"></i>Tải xuống
                                </a>
                                <button type="button" class="btn btn-outline-secondary" @click="hide">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import { getFile } from '@/api/fileService'
import { formatDateTime } from '@/utils/formatters'
import logger from '@/utils/logger'

const props = defineProps({
    file: {
        type: Object,
        default: null
    }
})

const modal = ref(null)
let modalInstance = null
const loading = ref(false)
const error = ref(null)
const textContent = ref('')
const previewUrl = ref('')

const isImage = computed(() => {
    const type = props.file?.fileType || ''
    return type.startsWith('image/')
})

const isPdf = computed(() => {
    const type = props.file?.fileType || ''
    return type === 'application/pdf'
})

const isVideo = computed(() => {
    const type = props.file?.fileType || ''
    return type.startsWith('video/')
})

const isAudio = computed(() => {
    const type = props.file?.fileType || ''
    return type.startsWith('audio/')
})

const isText = computed(() => {
    const type = props.file?.fileType || ''
    return type.startsWith('text/') || 
           type === 'application/json' ||
           type === 'application/xml' ||
           type === 'application/javascript'
})

const getFileIcon = (fileType) => {
    if (!fileType) return 'bi bi-file-earmark'
    if (fileType.startsWith('image/')) return 'bi bi-file-earmark-image'
    if (fileType.startsWith('video/')) return 'bi bi-file-earmark-play'
    if (fileType.startsWith('audio/')) return 'bi bi-file-earmark-music'
    if (fileType === 'application/pdf') return 'bi bi-file-earmark-pdf'
    if (fileType.includes('word')) return 'bi bi-file-earmark-word'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'bi bi-file-earmark-excel'
    if (fileType.includes('zip') || fileType.includes('archive')) return 'bi bi-file-earmark-zip'
    return 'bi bi-file-earmark'
}

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const loadPreview = async () => {
    if (!props.file?.fileUrl) {
        error.value = 'Không có URL file'
        return
    }

    loading.value = true
    error.value = null
    textContent.value = ''
    previewUrl.value = ''

    try {
        if (isImage.value || isPdf.value || isVideo.value || isAudio.value) {
            // Direct URL preview for media files
            previewUrl.value = props.file.fileUrl
        } else if (isText.value) {
            // Load text content
            const blob = await getFile(props.file.fileName)
            const text = await blob.text()
            textContent.value = text
        } else {
            // Unsupported file type
            previewUrl.value = props.file.fileUrl
        }
    } catch (err) {
        logger.error('Failed to load file for preview:', err)
        error.value = err.response?.data?.message || 'Không thể tải file để preview'
        toast.error('Không thể tải file để preview')
    } finally {
        loading.value = false
    }
}

const copyUrl = async () => {
    if (!props.file?.fileUrl) return
    try {
        await navigator.clipboard.writeText(props.file.fileUrl)
        toast.success('Đã copy URL vào clipboard!')
    } catch (err) {
        logger.error('Failed to copy URL:', err)
        toast.error('Không thể copy URL')
    }
}

const show = () => {
    modalInstance?.show()
    loadPreview()
}

const hide = () => {
    modalInstance?.hide()
    // Cleanup
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = ''
    textContent.value = ''
    error.value = null
}

watch(() => props.file, () => {
    if (props.file && modalInstance?._isShown) {
        loadPreview()
    }
})

onMounted(() => {
    modalInstance = new Modal(modal.value, { backdrop: true })
})

onBeforeUnmount(() => {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value)
    }
    modalInstance?.dispose()
})

defineExpose({ show, hide })
</script>

<style scoped>
.file-preview-container {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image img {
    max-height: 70vh;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-pdf iframe {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-video video {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-text pre {
    font-size: 0.875rem;
    line-height: 1.6;
}

.file-metadata {
    display: flex;
    align-items: center;
    gap: 1rem;
}
</style>

