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
                            <h5 class="modal-title">Chi tiết sản phẩm: <strong>{{ product.name }}</strong></h5>
                            <p class="modal-subtitle mb-0">Xem thông tin chi tiết về lợi nhuận và hiệu suất</p>
                        </div>
                        <button
                            type="button"
                            class="btn-close"
                            @click="handleClose"
                            aria-label="Đóng"
                        ></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-box me-2"></i>
                                        Thông tin sản phẩm
                                    </h6>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Tên:</span>
                                            <span class="info-value fw-semibold">{{ product.name }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Danh mục:</span>
                                            <span class="info-value">{{ product.categoryName }}</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Phân loại:</span>
                                            <span class="info-value">
                                                <span class="badge badge-soft" :class="getClassificationClass(product.classification)">
                                                    {{ product.classification }}
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
                                        Chỉ số tài chính
                                    </h6>
                                    <div class="row g-3">
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--primary">
                                                    <i class="bi bi-cash-stack"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Doanh thu</div>
                                                    <div class="stat-value">{{ formatCurrency(product.totalRevenue) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--danger">
                                                    <i class="bi bi-cart-x"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Chi phí</div>
                                                    <div class="stat-value">{{ formatCurrency(product.totalCost) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--success">
                                                    <i class="bi bi-graph-up"></i>
                                                </div>
                                                <div class="stat-content">
                                                    <div class="stat-label">Lợi nhuận</div>
                                                    <div class="stat-value">{{ formatCurrency(product.profit) }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="stat-box">
                                                <div class="stat-icon stat-icon--info">
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
                        <div class="row g-4 mt-2">
                            <div class="col-12">
                                <div class="info-section">
                                    <h6 class="section-title mb-3">
                                        <i class="bi bi-list-check me-2"></i>
                                        Chi tiết metrics
                                    </h6>
                                    <div class="table-responsive">
                                        <table class="table table-minimal">
                                            <thead>
                                                <tr>
                                                    <th>Chỉ số</th>
                                                    <th>Giá trị</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Giá bán</td>
                                                    <td class="revenue-cell">{{ formatCurrency(product.price) }}</td>
                                                </tr>
                                                <tr>
                                                    <td>Chi phí đơn vị</td>
                                                    <td class="cost-cell">{{ formatCurrency(product.costPerUnit) }}</td>
                                                </tr>
                                                <tr>
                                                    <td>Tổng số lượng bán</td>
                                                    <td>{{ formatNumber(product.totalQuantity) }}</td>
                                                </tr>
                                                <tr>
                                                    <td>Xếp hạng volume</td>
                                                    <td>{{ product.volumeRank || 'N/A' }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-flat btn-flat--outline" @click="handleClose">
                            Đóng
                        </button>
                        <button
                            v-if="product.margin < 20"
                            type="button"
                            class="btn btn-flat btn-flat--primary"
                            @click="handlePricing"
                        >
                            <i class="bi bi-tag me-2"></i>
                            Đề xuất giá
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

const emit = defineEmits(['close', 'pricing'])

const handleClose = () => {
    emit('close')
}

const handlePricing = () => {
    emit('pricing', props.product)
    handleClose()
}

const getClassificationClass = (classification) => {
    const classes = {
        'Star': 'badge-success',
        'Cash Cow': 'badge-info',
        'Question Mark': 'badge-warning',
        'Dog': 'badge-danger'
    }
    return classes[classification] || 'badge-neutral'
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

.stat-icon--primary {
    background: var(--color-soft-primary);
    color: var(--color-primary);
}

.stat-icon--danger {
    background: var(--color-soft-rose);
    color: var(--color-danger);
}

.stat-icon--success {
    background: var(--color-soft-emerald);
    color: var(--color-success);
}

.stat-icon--info {
    background: var(--color-soft-sky);
    color: var(--color-info);
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

.revenue-cell {
    color: var(--color-success);
    font-weight: var(--font-weight-semibold);
}

.cost-cell {
    color: var(--color-danger);
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

.badge-neutral {
    background: var(--color-card-muted);
    color: var(--color-text-muted);
}
</style>

