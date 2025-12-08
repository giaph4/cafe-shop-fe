<template>
    <Teleport to="body">
        <div
            class="product-detail-modal modal fade show"
            tabindex="-1"
            @click.self="handleClose"
            style="display: block; z-index: 1055;"
        >
            <div class="modal-backdrop fade show" @click="handleClose" style="z-index: 1050;"></div>
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style="z-index: 1056;">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <div class="modal-header__content">
                            <h5 class="modal-title">{{ product.productName }}</h5>
                            <p class="modal-subtitle mb-0">Chi tiết phân tích sản phẩm</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="handleClose"
                            aria-label="Đóng"
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-4 mb-4">
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-info-circle me-2"></i>
                                        Thông tin sản phẩm
                                    </h6>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Tên sản phẩm:</span>
                                            <span class="info-value fw-semibold">{{ product.productName }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Danh mục:</span>
                                            <span class="info-value">{{ product.categoryName }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Giá bán:</span>
                                            <span class="info-value">{{ formatCurrency(product.price) }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Chi phí:</span>
                                            <span class="info-value">{{ formatCurrency(product.cost) }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Trạng thái:</span>
                                            <span class="info-value">
                                                <span class="badge badge-soft" :class="product.isAvailable ? 'badge-success' : 'badge-danger'">
                                                    {{ product.isAvailable ? 'Đang bán' : 'Ngừng bán' }}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-graph-up me-2"></i>
                                        Hiệu suất
                                    </h6>
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <div class="stat-box stat-box--success">
                                                <div class="stat-icon stat-icon--success">
                                                    <i class="bi bi-cash-stack"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Doanh thu</div>
                                                    <div class="stat-value">{{ formatCurrency(product.revenue) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box stat-box--info">
                                                <div class="stat-icon stat-icon--info">
                                                    <i class="bi bi-cart"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Số lượng</div>
                                                    <div class="stat-value">{{ formatNumber(product.quantity) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box stat-box--primary">
                                                <div class="stat-icon stat-icon--primary">
                                                    <i class="bi bi-graph-up-arrow"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Lợi nhuận</div>
                                                    <div class="stat-value" :class="product.profit >= 0 ? 'text-success' : 'text-danger'">
                                                        {{ formatCurrency(product.profit) }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box stat-box--warning">
                                                <div class="stat-icon stat-icon--warning">
                                                    <i class="bi bi-percent"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Margin</div>
                                                    <div class="stat-value">{{ product.margin.toFixed(1) }}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row g-4">
                            <div class="col-12">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-tags me-2"></i>
                                        Phân loại
                                    </h6>
                                    <div class="classification-display">
                                        <div class="classification-badge-large" :class="`badge-${product.classificationColor}`">
                                            <i :class="getClassificationIcon(product.classification)"></i>
                                            <span>{{ product.classificationLabel }}</span>
                                        </div>
                                        <div class="classification-description">
                                            {{ getClassificationDescription(product.classification) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-flat btn-flat--outline" @click="handleClose">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { formatCurrency, formatNumber } from '@/utils/formatters'

const props = defineProps({
    product: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close'])

const handleClose = () => {
    emit('close')
}

const getClassificationIcon = (classification) => {
    const icons = {
        'STAR': 'bi bi-star-fill',
        'CASH_COW': 'bi bi-cash-coin',
        'QUESTION_MARK': 'bi bi-question-circle-fill',
        'DOG': 'bi bi-x-circle-fill'
    }
    return icons[classification] || 'bi bi-circle'
}

const getClassificationDescription = (classification) => {
    const descriptions = {
        'STAR': 'Sản phẩm có volume cao và margin cao. Nên được quảng bá và tăng inventory.',
        'CASH_COW': 'Sản phẩm có margin cao nhưng volume thấp. Tập trung vào profitability.',
        'QUESTION_MARK': 'Sản phẩm có volume cao nhưng margin thấp. Cần tối ưu giá hoặc chi phí.',
        'DOG': 'Sản phẩm có volume thấp và margin thấp. Nên được xem xét ngừng bán hoặc tối ưu.'
    }
    return descriptions[classification] || ''
}
</script>

<style scoped>
.product-detail-modal {
    font-family: var(--font-family-sans);
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

:global(.modal-content) {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-card);
    box-shadow: var(--shadow-lg);
}

:global(.modal-header) {
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.modal-header__content {
    flex: 1;
}

:global(.modal-title) {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-lg);
    margin: 0;
}

.modal-subtitle {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-top: var(--spacing-1);
}

:global(.modal-body) {
    padding: var(--spacing-5);
    font-family: var(--font-family-sans);
}

:global(.modal-footer) {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-4) var(--spacing-5);
    background: var(--color-card);
}

.info-section {
    padding: var(--spacing-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.section-title {
    font-family: var(--font-family-sans);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-size: var(--font-size-base);
}

.info-grid {
    display: grid;
    gap: var(--spacing-3);
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
}

.info-value {
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text);
    text-align: right;
}

.stat-box {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-1);
    font-family: var(--font-family-sans);
}

.stat-value {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
}

.classification-display {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    align-items: flex-start;
}

.classification-badge-large {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-2);
}

.badge-success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.badge-info {
    background: var(--color-soft-sky);
    color: var(--color-info);
}

.badge-warning {
    background: var(--color-soft-amber);
    color: var(--color-warning);
}

.badge-danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.classification-description {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-family: var(--font-family-sans);
    line-height: var(--line-height-relaxed);
}

.badge-soft {
    padding: var(--spacing-1) var(--spacing-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-sans);
    border: 1px solid transparent;
    display: inline-block;
}
</style>

