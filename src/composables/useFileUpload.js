/**
 * Composable xử lý upload file
 * Tách logic upload file ra khỏi component để dễ bảo trì và tái sử dụng
 *
 * Cách sử dụng:
 * const { fileItems, selectedFiles, handleFileSelect, handleUpload, removeFile, ... } = useFileUpload()
 */

import { ref } from 'vue'
import { toast } from 'vue3-toastify'
import { uploadFile, uploadMultipleFiles } from '@/api/fileService'
import logger from '@/utils/logger'

/**
 * Throttle progress updates để tránh UI jank
 */
const PROGRESS_UPDATE_THROTTLE_MS = 100

/**
 * File upload composable
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onUploadSuccess - Callback khi upload thành công
 * @param {Function} options.onUploadError - Callback khi upload lỗi
 * @returns {Object} - File upload state và methods
 */
export function useFileUpload (options = {}) {
    const { onUploadSuccess, onUploadError } = options

    const selectedFiles = ref([])
    const fileItems = ref([])
    const uploading = ref(false)
    const uploadError = ref('')
    const uploadSuccess = ref([])

    // Throttle progress updates để tránh UI lag
    const throttledProgressUpdates = new Map()

    /**
     * Cập nhật tiến độ upload file với throttle
     * Throttle progress updates để giảm số lượng re-renders
     */
    const updateFileProgress = (fileItem, progress) => {
        if (!fileItem || !fileItem.id) return

        const now = Date.now()
        const lastUpdate = throttledProgressUpdates.get(fileItem.id) || 0

        // Chỉ update nếu đã qua throttle interval hoặc là final update (100%)
        if (progress === 100 || now - lastUpdate >= PROGRESS_UPDATE_THROTTLE_MS) {
            fileItem.progress = progress
            throttledProgressUpdates.set(fileItem.id, now)

            // Cleanup throttle map entry khi upload complete
            if (progress === 100) {
                throttledProgressUpdates.delete(fileItem.id)
            }
        }
    }

    /**
     * Thêm files và tạo preview
     * Sử dụng FileReader.readAsDataURL thay vì URL.createObjectURL để tránh memory leak
     */
    const addFiles = (files) => {
        files.forEach(file => {
            const fileItem = {
                id: `file-${Date.now()}-${Math.random()}`,
                file,
                preview: null,
                previewUrl: null,
                uploading: false,
                progress: 0,
                error: null
            }

            // Generate preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    fileItem.preview = e.target.result
                }
                reader.onerror = () => {
                    logger.warn('Failed to read file for preview:', file.name)
                }
                reader.readAsDataURL(file)
            }

            fileItems.value.push(fileItem)
            selectedFiles.value.push(file)
        })
    }

    /**
     * Xóa file và dọn dẹp preview URL
     * Cleanup preview URL khi xóa file để tránh memory leak
     */
    const removeFile = (index) => {
        if (fileItems.value[index]?.uploading) return

        const fileItem = fileItems.value[index]

        // Cleanup preview URL nếu có
        if (fileItem?.previewUrl && fileItem.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(fileItem.previewUrl)
        }
        if (fileItem?.preview) {
            fileItem.preview = null
        }

        // Cleanup throttle entry
        if (fileItem?.id) {
            throttledProgressUpdates.delete(fileItem.id)
        }

        fileItems.value.splice(index, 1)
        selectedFiles.value.splice(index, 1)
    }

    /**
     * Xử lý upload file
     * Tách logic upload ra khỏi component để dễ bảo trì
     */
    const handleUpload = async () => {
        if (selectedFiles.value.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một file để upload.')
            return
        }

        uploading.value = true
        uploadError.value = ''
        uploadSuccess.value = []

        // Mark all files as uploading
        fileItems.value.forEach(item => {
            item.uploading = true
            item.progress = 0
            item.error = null
        })

        try {
            let results = []

            if (selectedFiles.value.length === 1) {
                // Single file upload with progress simulation
                const fileItem = fileItems.value[0]
                updateFileProgress(fileItem, 50)
                const result = await uploadFile(selectedFiles.value[0])
                updateFileProgress(fileItem, 100)
                results = [result]
            } else {
                // Multiple files upload - simulate progress for each
                const uploadPromises = fileItems.value.map(async (fileItem, index) => {
                    try {
                        updateFileProgress(fileItem, 30)
                        await new Promise(resolve => setTimeout(resolve, 100))
                        updateFileProgress(fileItem, 70)
                        return { fileItem, index }
                    } catch (err) {
                        fileItem.error = err.message || 'Upload failed'
                        fileItem.uploading = false
                        throttledProgressUpdates.delete(fileItem.id)
                        throw err
                    }
                })

                await Promise.all(uploadPromises)

                // Update all progress to 90% before actual upload
                fileItems.value.forEach(item => updateFileProgress(item, 90))

                // Actual upload
                results = await uploadMultipleFiles(selectedFiles.value)

                // Mark all as complete
                fileItems.value.forEach(item => {
                    updateFileProgress(item, 100)
                    item.uploading = false
                })
            }

            // Thêm ngày upload cho mỗi kết quả
            const now = new Date().toISOString()
            results = results.map(file => ({
                ...file,
                uploadedAt: now
            }))

            uploadSuccess.value = results

            // Call success callback if provided
            if (onUploadSuccess) {
                onUploadSuccess(results)
            }

            // Clear selected files after a short delay
            setTimeout(() => {
                // Cleanup preview URLs
                fileItems.value.forEach((fileItem) => {
                    if (fileItem?.previewUrl && fileItem.previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(fileItem.previewUrl)
                    }
                    if (fileItem?.preview) {
                        fileItem.preview = null
                    }
                })

                selectedFiles.value = []
                fileItems.value = []
            }, 1000)

            toast.success(`Đã upload thành công ${results.length} file(s).`)
        } catch (err) {
            logger.error('Upload error:', err)
            uploadError.value = err.response?.data?.message || 'Không thể upload file. Vui lòng thử lại.'
            toast.error(uploadError.value)

            // Mark failed files
            fileItems.value.forEach(item => {
                item.uploading = false
                if (!item.error) {
                    item.error = uploadError.value
                }
                // Cleanup throttle entry on error
                throttledProgressUpdates.delete(item.id)
            })

            // Call error callback if provided
            if (onUploadError) {
                onUploadError(err)
            }
        } finally {
            uploading.value = false
        }
    }

    /**
     * Reset file upload state
     */
    const reset = () => {
        // Cleanup preview URLs
        fileItems.value.forEach((fileItem) => {
            if (fileItem?.previewUrl && fileItem.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(fileItem.previewUrl)
            }
            if (fileItem?.preview) {
                fileItem.preview = null
            }
        })

        selectedFiles.value = []
        fileItems.value = []
        uploadError.value = ''
        uploadSuccess.value = []
        throttledProgressUpdates.clear()
    }

    /**
     * Cleanup khi component unmount
     */
    const cleanup = () => {
        reset()
    }

    return {
        // State
        selectedFiles,
        fileItems,
        uploading,
        uploadError,
        uploadSuccess,

        // Methods
        addFiles,
        removeFile,
        handleUpload,
        reset,
        cleanup
    }
}

