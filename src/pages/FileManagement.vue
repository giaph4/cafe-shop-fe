<template>
    <div class="page-container container-fluid file-management-page">
        <div class="file-management-header">
            <div class="file-management-header__content">
                <div class="file-management-header__title-section">
                    <h2 class="page-title">Quản lý File</h2>
                    <p class="page-subtitle">Upload, xem và quản lý các file trong hệ thống.</p>
                </div>
                <div class="file-management-header__actions">
                    <button class="btn btn-outline-primary" type="button" @click="toggleFileList" :disabled="fileListLoading">
                        <i class="bi bi-list-ul me-2"></i>
                        {{ showFileList ? 'Ẩn danh sách' : 'Xem danh sách files' }}
                    </button>
                    <button class="btn btn-outline-secondary" type="button" @click="resetForms" :disabled="uploading || deleting">
                        <i class="bi bi-arrow-clockwise me-2"></i>
                        Làm mới
                    </button>
                </div>
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

        <!-- File List Section -->
        <div v-if="showFileList" class="card mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="bi bi-files me-2"></i>Danh sách Files
                </h5>
                <div class="d-flex gap-2 align-items-center">
                    <div class="input-group input-group-sm" style="max-width: 300px;">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input
                            type="text"
                            class="form-control"
                            v-model="fileListKeyword"
                            placeholder="Tìm kiếm file..."
                            @keyup.enter="handleFileListSearch"
                            :disabled="fileListLoading"
                        />
                        <button
                            class="btn btn-outline-secondary"
                            type="button"
                            @click="handleFileListSearch"
                            :disabled="fileListLoading"
                        >
                            <i class="bi bi-search"></i>
                        </button>
                    </div>
                    <button
                        class="btn btn-sm btn-outline-secondary"
                        type="button"
                        @click="fetchFileList"
                        :disabled="fileListLoading"
                    >
                        <span v-if="fileListLoading" class="spinner-border spinner-border-sm me-1"></span>
                        <i v-else class="bi bi-arrow-repeat me-1"></i>
                        Làm mới
                    </button>
                </div>
            </div>
            <div class="card-body">
                <LoadingState v-if="fileListLoading" />
                <ErrorState 
                    v-else-if="fileListError" 
                    :message="fileListError"
                    @retry="fetchFileList"
                />
                <EmptyState
                    v-else-if="fileList.length === 0"
                    title="Không có file nào"
                    message="Không có file nào trong hệ thống."
                />
                <div v-else class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Tên file</th>
                                <th>Kích thước</th>
                                <th>Loại</th>
                                <th>Ngày upload</th>
                                <th>URL</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(file, index) in fileList" :key="index">
                                <td>
                                    <i class="bi bi-file-earmark me-2"></i>
                                    {{ file.fileName || file.name || 'N/A' }}
                                </td>
                                <td>{{ formatFileSize(file.fileSize || file.size) }}</td>
                                <td>
                                    <span class="badge bg-secondary">{{ file.fileType || file.type || 'N/A' }}</span>
                                </td>
                                <td>
                                    <span v-if="file.uploadedAt || file.createdAt">
                                        {{ formatDateTime(file.uploadedAt || file.createdAt) }}
                                    </span>
                                    <span v-else class="text-muted">N/A</span>
                                </td>
                                <td>
                                    <a :href="file.fileUrl || file.url" target="_blank" class="text-decoration-none">
                                        <i class="bi bi-link-45deg me-1"></i>Xem
                                    </a>
                                </td>
                                <td class="text-end">
                                    <button
                                        class="btn btn-sm btn-outline-danger"
                                        @click="deleteFileFromList(file.fileName || file.name, index)"
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

        <Teleport to="body">
            <!-- Delete Confirmation Modal -->
            <div 
                class="modal fade" 
                id="deleteFileModal" 
                tabindex="-1" 
                ref="deleteConfirmModal" 
                aria-labelledby="deleteFileModalLabel"
                aria-hidden="true"
            >
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="deleteFileModalLabel">Xác nhận xóa</h5>
                            <button type="button" class="btn-close" @click="deleteConfirmModal?.hide()" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>Bạn có chắc chắn muốn xóa file này không?</p>
                            <div class="alert alert-warning mt-3">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Hành động này không thể hoàn tác.
                            </div>
                            <div v-if="deleteConfirmFileName" class="card mt-3">
                                <div class="card-body">
                                    <p class="mb-0"><strong>Tên file:</strong> {{ deleteConfirmFileName }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" @click="deleteConfirmModal?.hide()">
                                Hủy
                            </button>
                            <button type="button" class="btn btn-danger" @click="confirmDeleteFile" :disabled="deleting">
                                <span v-if="deleting" class="spinner-border spinner-border-sm me-2"></span>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Teleport } from 'vue'
import { Modal } from 'bootstrap'
import { toast } from 'vue3-toastify'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { uploadFile, uploadMultipleFiles, deleteFile, extractFileName, listFiles } from '@/api/fileService'
import { formatDateTime } from '@/utils/formatters'

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

// File list state
const fileList = ref([])
const fileListLoading = ref(false)
const fileListError = ref('')
const showFileList = ref(false)
const fileListKeyword = ref('')
const deleteConfirmModal = ref(null)
const deleteConfirmFileName = ref('')
const deleteConfirmIndex = ref(-1)

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
        deleteError.value = err.response?.data?.message || 'Không thể xóa file. Vui lòng thử lại.'
        toast.error(deleteError.value)
    } finally {
        deleting.value = false
    }
}

const deleteFileFromList = async (fileName, index) => {
    if (!fileName) {
        toast.warning('Tên file không hợp lệ.')
        return
    }
    
    deleteConfirmFileName.value = fileName
    deleteConfirmIndex.value = index
    deleteConfirmModal.value?.show()
    
    deleting.value = true
    deleteError.value = ''
    deleteSuccess.value = false
    
    try {
        await deleteFile(fileName)
        deleteSuccess.value = true
        toast.success('File đã được xóa thành công!')
        
        // Remove from file list
        if (index !== undefined && index >= 0) {
            fileList.value.splice(index, 1)
        } else {
            // Refresh file list
            await fetchFileList()
        }
        
        // Also remove from recent uploads if exists
        const recentIndex = recentUploads.value.findIndex(f => 
            (f.fileName || f.name) === fileName
        )
        if (recentIndex !== -1) {
            recentUploads.value.splice(recentIndex, 1)
        }
    } catch (err) {
        deleteError.value = err.response?.data?.message || 'Không thể xóa file. Vui lòng thử lại.'
        toast.error(deleteError.value)
    } finally {
        deleting.value = false
    }
}

const deleteRecentFile = async (fileName, index) => {
    deleteConfirmFileName.value = fileName
    deleteConfirmIndex.value = index
    deleteConfirmModal.value?.show()

    deleting.value = true
    try {
        await deleteFile(fileName)
        recentUploads.value.splice(index, 1)
        toast.success('File đã được xóa thành công.')
        
        // Also refresh file list if it's visible
        if (showFileList.value) {
            await fetchFileList()
        }
    } catch (err) {
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
    fileListError.value = ''
}

const fetchFileList = async () => {
    fileListLoading.value = true
    fileListError.value = ''
    try {
        const params = {}
        if (fileListKeyword.value && fileListKeyword.value.trim()) {
            params.keyword = fileListKeyword.value.trim()
        }
        
        const data = await listFiles(params)
        fileList.value = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : [])
    } catch (err) {
        fileListError.value = err.response?.data?.message || 'Không thể tải danh sách files.'
        fileList.value = []
    } finally {
        fileListLoading.value = false
    }
}

const toggleFileList = () => {
    showFileList.value = !showFileList.value
    if (showFileList.value && fileList.value.length === 0) {
        fetchFileList()
    }
}

const handleFileListSearch = () => {
    fetchFileList()
}

const confirmDeleteFile = async () => {
    const fileName = deleteConfirmFileName.value
    const index = deleteConfirmIndex.value
    deleteConfirmModal.value?.hide()
    
    deleting.value = true
    deleteError.value = ''
    deleteSuccess.value = false
    
    try {
        await deleteFile(fileName)
        deleteSuccess.value = true
        toast.success('File đã được xóa thành công!')
        
        // Remove from file list
        if (index !== undefined && index >= 0) {
            fileList.value.splice(index, 1)
        } else {
            // Refresh file list
            await fetchFileList()
        }
        
        // Also remove from recent uploads if exists
        const recentIndex = recentUploads.value.findIndex(f => 
            (f.fileName || f.name) === fileName
        )
        if (recentIndex !== -1) {
            recentUploads.value.splice(recentIndex, 1)
        }
    } catch (err) {
        deleteError.value = err.response?.data?.message || 'Không thể xóa file. Vui lòng thử lại.'
        toast.error(deleteError.value)
    } finally {
        deleting.value = false
        deleteConfirmFileName.value = ''
        deleteConfirmIndex.value = -1
    }
}

onMounted(() => {
    if (deleteConfirmModal.value) {
        deleteConfirmModal.value = new Modal(deleteConfirmModal.value)
    }
    // Optionally load file list on mount
    // fetchFileList()
})
</script>

<style scoped lang="scss">
.file-management-page {
    padding-bottom: var(--spacing-12);
}

.file-management-header {
    padding: var(--spacing-6);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    background: linear-gradient(165deg, var(--color-card), var(--color-card-accent));
    box-shadow: var(--shadow-md);
    margin-bottom: var(--spacing-6);
}

.file-management-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-6);
    flex-wrap: wrap;
}

.file-management-header__title-section {
    flex: 1;
    min-width: 0;
}

.file-management-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
}

.page-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-heading);
    margin-bottom: var(--spacing-1);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
}

.page-subtitle {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
}

.upload-card,
.delete-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    background: var(--color-card);
}

.card-header {
    background: var(--color-card-muted);
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-6);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

.card-header h5 {
    color: var(--color-heading);
    font-weight: var(--font-weight-semibold);
}

.list-group-item {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-2);
    transition: all var(--transition-base);
}

.list-group-item:hover {
    background-color: var(--color-card-muted);
}

.table {
    margin-bottom: 0;
}

.table thead th {
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: var(--letter-spacing-wide);
    border-bottom: 2px solid var(--color-border);
}

@media (max-width: 768px) {
    .file-management-header {
        padding: var(--spacing-4);
    }

    .file-management-header__content {
        flex-direction: column;
        align-items: flex-start;
    }

    .file-management-header__actions {
        width: 100%;
        justify-content: stretch;

        .btn {
            flex: 1;
        }
    }
}
</style>

