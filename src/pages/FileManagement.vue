<template>
    <div class="file-management-page container-fluid" data-aos="fade-up">
        <div class="page-header card-shadow">
            <div>
                <h2 class="page-title">Quản lý File</h2>
                <p class="page-subtitle">Upload, xem và quản lý các file trong hệ thống.</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <button class="btn btn-outline-secondary" type="button" @click="resetForms" :disabled="uploading || deleting">
                    <i class="bi bi-arrow-clockwise me-2"></i>Làm mới
                </button>
            </div>
        </div>

        <div class="row g-4">
            <!-- Upload Section -->
            <div class="col-lg-6">
                <div class="card upload-card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-cloud-upload me-2"></i>Upload File
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-4">
                            <label class="form-label">Upload một file</label>
                            <input
                                type="file"
                                class="form-control"
                                ref="singleFileInput"
                                @change="handleSingleFileSelect"
                                :disabled="uploading"
                            />
                            <small class="text-muted d-block mt-2">
                                Chọn một file để upload lên hệ thống
                            </small>
                        </div>

                        <div class="mb-4">
                            <label class="form-label">Upload nhiều file</label>
                            <input
                                type="file"
                                class="form-control"
                                multiple
                                ref="multipleFileInput"
                                @change="handleMultipleFileSelect"
                                :disabled="uploading"
                            />
                            <small class="text-muted d-block mt-2">
                                Chọn nhiều file cùng lúc (giữ Ctrl/Cmd để chọn nhiều)
                            </small>
                        </div>

                        <div v-if="selectedFiles.length > 0" class="mb-3">
                            <label class="form-label">Files đã chọn ({{ selectedFiles.length }})</label>
                            <div class="list-group">
                                <div
                                    v-for="(file, index) in selectedFiles"
                                    :key="index"
                                    class="list-group-item d-flex justify-content-between align-items-center"
                                >
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-file-earmark"></i>
                                        <div>
                                            <div class="fw-semibold">{{ file.name }}</div>
                                            <small class="text-muted">{{ formatFileSize(file.size) }}</small>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger"
                                        @click="removeFile(index)"
                                        :disabled="uploading"
                                    >
                                        <i class="bi bi-x"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            class="btn btn-primary w-100"
                            type="button"
                            @click="handleUpload"
                            :disabled="uploading || selectedFiles.length === 0"
                        >
                            <span v-if="uploading" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-cloud-upload me-2"></i>
                            {{ uploading ? 'Đang upload...' : 'Upload File' }}
                        </button>

                        <div v-if="uploadError" class="alert alert-danger mt-3 mb-0">
                            {{ uploadError }}
                        </div>

                        <div v-if="uploadSuccess.length > 0" class="mt-3">
                            <div class="alert alert-success">
                                <strong>Upload thành công!</strong>
                                <ul class="mb-0 mt-2">
                                    <li v-for="(file, index) in uploadSuccess" :key="index">
                                        <a :href="file.fileUrl" target="_blank" class="text-decoration-none">
                                            {{ file.fileName }}
                                        </a>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary ms-2"
                                            @click="copyToClipboard(file.fileUrl)"
                                        >
                                            <i class="bi bi-clipboard"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Section -->
            <div class="col-lg-6">
                <div class="card delete-card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-trash me-2"></i>Xóa File
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Tên file hoặc URL</label>
                            <input
                                type="text"
                                class="form-control"
                                v-model="deleteFileName"
                                placeholder="Nhập tên file hoặc URL đầy đủ"
                                :disabled="deleting"
                            />
                            <small class="text-muted d-block mt-2">
                                Nhập tên file (ví dụ: abc123.jpg) hoặc URL đầy đủ của file
                            </small>
                        </div>

                        <button
                            class="btn btn-danger w-100"
                            type="button"
                            @click="handleDelete"
                            :disabled="deleting || !deleteFileName"
                        >
                            <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="bi bi-trash me-2"></i>
                            {{ deleting ? 'Đang xóa...' : 'Xóa File' }}
                        </button>

                        <div v-if="deleteError" class="alert alert-danger mt-3 mb-0">
                            {{ deleteError }}
                        </div>

                        <div v-if="deleteSuccess" class="alert alert-success mt-3 mb-0">
                            File đã được xóa thành công!
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Uploads (if any) -->
        <div v-if="recentUploads.length > 0" class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi bi-clock-history me-2"></i>Files vừa upload
                </h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Tên file</th>
                                <th>Kích thước</th>
                                <th>Loại</th>
                                <th>URL</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(file, index) in recentUploads" :key="index">
                                <td>
                                    <i class="bi bi-file-earmark me-2"></i>
                                    {{ file.fileName }}
                                </td>
                                <td>{{ formatFileSize(file.fileSize) }}</td>
                                <td>
                                    <span class="badge bg-secondary">{{ file.fileType || 'N/A' }}</span>
                                </td>
                                <td>
                                    <a :href="file.fileUrl" target="_blank" class="text-decoration-none">
                                        <i class="bi bi-link-45deg me-1"></i>Xem
                                    </a>
                                </td>
                                <td>
                                    <button
                                        class="btn btn-sm btn-outline-danger"
                                        @click="deleteRecentFile(file.fileName, index)"
                                        :disabled="deleting"
                                    >
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { toast } from 'vue3-toastify'
import { uploadFile, uploadMultipleFiles, deleteFile, extractFileName } from '@/api/fileService'

const singleFileInput = ref(null)
const multipleFileInput = ref(null)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref([])
const recentUploads = ref([])

const deleteFileName = ref('')
const deleting = ref(false)
const deleteError = ref('')
const deleteSuccess = ref(false)

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleSingleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
        selectedFiles.value = [file]
        multipleFileInput.value.value = ''
    }
}

const handleMultipleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
        selectedFiles.value = files
        singleFileInput.value.value = ''
    }
}

const removeFile = (index) => {
    selectedFiles.value.splice(index, 1)
}

const handleUpload = async () => {
    if (selectedFiles.value.length === 0) {
        toast.warning('Vui lòng chọn ít nhất một file để upload.')
        return
    }

    uploading.value = true
    uploadError.value = ''
    uploadSuccess.value = []

    try {
        let results = []
        
        if (selectedFiles.value.length === 1) {
            const result = await uploadFile(selectedFiles.value[0])
            results = [result]
        } else {
            results = await uploadMultipleFiles(selectedFiles.value)
        }

        uploadSuccess.value = results
        recentUploads.value.unshift(...results)
        
        // Giữ tối đa 20 files gần nhất
        if (recentUploads.value.length > 20) {
            recentUploads.value = recentUploads.value.slice(0, 20)
        }

        selectedFiles.value = []
        singleFileInput.value.value = ''
        multipleFileInput.value.value = ''
        
        toast.success(`Đã upload thành công ${results.length} file(s).`)
    } catch (err) {
        console.error(err)
        uploadError.value = err.response?.data?.message || 'Không thể upload file. Vui lòng thử lại.'
        toast.error(uploadError.value)
    } finally {
        uploading.value = false
    }
}

const handleDelete = async () => {
    if (!deleteFileName.value) {
        toast.warning('Vui lòng nhập tên file hoặc URL.')
        return
    }

    deleting.value = true
    deleteError.value = ''
    deleteSuccess.value = false

    try {
        const fileName = extractFileName(deleteFileName.value) || deleteFileName.value
        await deleteFile(fileName)
        
        // Xóa khỏi recent uploads nếu có
        const index = recentUploads.value.findIndex(f => f.fileName === fileName)
        if (index !== -1) {
            recentUploads.value.splice(index, 1)
        }

        deleteFileName.value = ''
        deleteSuccess.value = true
        toast.success('File đã được xóa thành công.')
        
        setTimeout(() => {
            deleteSuccess.value = false
        }, 3000)
    } catch (err) {
        console.error(err)
        deleteError.value = err.response?.data?.message || 'Không thể xóa file. Vui lòng thử lại.'
        toast.error(deleteError.value)
    } finally {
        deleting.value = false
    }
}

const deleteRecentFile = async (fileName, index) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${fileName}"?`)) {
        return
    }

    deleting.value = true
    try {
        await deleteFile(fileName)
        recentUploads.value.splice(index, 1)
        toast.success('File đã được xóa thành công.')
    } catch (err) {
        console.error(err)
        toast.error(err.response?.data?.message || 'Không thể xóa file.')
    } finally {
        deleting.value = false
    }
}

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        toast.success('Đã copy URL vào clipboard!')
    } catch (err) {
        console.error('Failed to copy:', err)
        toast.error('Không thể copy URL.')
    }
}

const resetForms = () => {
    selectedFiles.value = []
    deleteFileName.value = ''
    uploadError.value = ''
    deleteError.value = ''
    deleteSuccess.value = false
    uploadSuccess.value = []
    singleFileInput.value.value = ''
    multipleFileInput.value.value = ''
}
</script>

<style scoped>
.file-management-page {
    padding: 1.5rem;
}

.page-header {
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    border-radius: 18px;
    border: 1px solid var(--color-border);
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}


.upload-card,
.delete-card {
    border-radius: 18px;
    border: 1px solid var(--color-border);
    background: linear-gradient(170deg, var(--color-card), var(--color-card-accent));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.card-header {
    background: rgba(148, 163, 184, 0.08);
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 1.5rem;
    border-radius: 18px 18px 0 0;
}

.card-header h5 {
    color: var(--color-heading);
    font-weight: 600;
}

.list-group-item {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.table {
    margin-bottom: 0;
}

.table thead th {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--color-border);
}
</style>

