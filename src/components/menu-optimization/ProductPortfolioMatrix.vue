<template>
    <div class="product-portfolio-matrix">
        <div class="matrix-container">
            <div class="matrix-axis">
                <div class="axis-label axis-label--vertical">Margin cao</div>
                <div class="axis-label axis-label--vertical axis-label--bottom">Margin thấp</div>
            </div>
            <div class="matrix-grid">
                <div class="matrix-quadrant matrix-quadrant--star">
                    <div class="quadrant-label">Ngôi sao</div>
                    <div class="quadrant-products">
                        <div
                            v-for="product in starProducts"
                            :key="product.productId"
                            class="product-dot"
                            :title="product.productName"
                            @click="$emit('select', product)"
                        ></div>
                    </div>
                </div>
                <div class="matrix-quadrant matrix-quadrant--cash-cow">
                    <div class="quadrant-label">Bò sữa</div>
                    <div class="quadrant-products">
                        <div
                            v-for="product in cashCowProducts"
                            :key="product.productId"
                            class="product-dot"
                            :title="product.productName"
                            @click="$emit('select', product)"
                        ></div>
                    </div>
                </div>
                <div class="matrix-quadrant matrix-quadrant--question-mark">
                    <div class="quadrant-label">Dấu hỏi</div>
                    <div class="quadrant-products">
                        <div
                            v-for="product in questionMarkProducts"
                            :key="product.productId"
                            class="product-dot"
                            :title="product.productName"
                            @click="$emit('select', product)"
                        ></div>
                    </div>
                </div>
                <div class="matrix-quadrant matrix-quadrant--dog">
                    <div class="quadrant-label">Chó</div>
                    <div class="quadrant-products">
                        <div
                            v-for="product in dogProducts"
                            :key="product.productId"
                            class="product-dot"
                            :title="product.productName"
                            @click="$emit('select', product)"
                        ></div>
                    </div>
                </div>
            </div>
            <div class="matrix-axis matrix-axis--horizontal">
                <div class="axis-label">Volume thấp</div>
                <div class="axis-label axis-label--right">Volume cao</div>
            </div>
        </div>
        <div class="matrix-legend">
            <div class="legend-item">
                <div class="legend-dot legend-dot--star"></div>
                <span>Ngôi sao: {{ starProducts.length }} sản phẩm</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot legend-dot--cash-cow"></div>
                <span>Bò sữa: {{ cashCowProducts.length }} sản phẩm</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot legend-dot--question-mark"></div>
                <span>Dấu hỏi: {{ questionMarkProducts.length }} sản phẩm</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot legend-dot--dog"></div>
                <span>Chó: {{ dogProducts.length }} sản phẩm</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    products: {
        type: Array,
        required: true,
        default: () => []
    }
})

defineEmits(['select'])

const starProducts = computed(() => {
    return props.products.filter(p => p.classification === 'STAR')
})

const cashCowProducts = computed(() => {
    return props.products.filter(p => p.classification === 'CASH_COW')
})

const questionMarkProducts = computed(() => {
    return props.products.filter(p => p.classification === 'QUESTION_MARK')
})

const dogProducts = computed(() => {
    return props.products.filter(p => p.classification === 'DOG')
})
</script>

<style scoped>
.product-portfolio-matrix {
    font-family: var(--font-family-sans);
}

.matrix-container {
    position: relative;
    width: 100%;
    height: 400px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-card);
}

.matrix-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    position: relative;
}

.matrix-quadrant {
    border: 1px solid var(--color-border);
    padding: var(--spacing-3);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.matrix-quadrant--star {
    background: var(--color-soft-emerald);
    border-top-left-radius: var(--radius-sm);
}

.matrix-quadrant--cash-cow {
    background: var(--color-soft-sky);
    border-top-right-radius: var(--radius-sm);
}

.matrix-quadrant--question-mark {
    background: var(--color-soft-amber);
    border-bottom-left-radius: var(--radius-sm);
}

.matrix-quadrant--dog {
    background: var(--color-soft-rose);
    border-bottom-right-radius: var(--radius-sm);
}

.quadrant-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-heading);
    font-family: var(--font-family-sans);
    margin-bottom: var(--spacing-2);
    font-size: var(--font-size-sm);
}

.quadrant-products {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-1);
    justify-content: center;
    align-items: center;
    flex: 1;
    width: 100%;
}

.product-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    transition: all var(--transition-base);
}

.product-dot:hover {
    transform: scale(1.5);
    box-shadow: 0 0 4px var(--color-primary);
}

.matrix-axis {
    position: absolute;
    left: -60px;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 50px;
}

.matrix-axis--horizontal {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -40px;
    top: auto;
    flex-direction: row;
    height: 30px;
    width: auto;
}

.axis-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-muted);
    font-family: var(--font-family-sans);
    writing-mode: vertical-rl;
    text-orientation: mixed;
}

.axis-label--vertical {
    writing-mode: vertical-rl;
    text-orientation: mixed;
}

.axis-label--horizontal {
    writing-mode: horizontal-tb;
}

.axis-label--right {
    margin-left: auto;
}

.axis-label--bottom {
    margin-top: auto;
}

.matrix-legend {
    display: flex;
    gap: var(--spacing-4);
    margin-top: var(--spacing-3);
    justify-content: center;
    flex-wrap: wrap;
    font-family: var(--font-family-sans);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
    color: var(--color-text);
}

.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.legend-dot--star {
    background: var(--color-success);
}

.legend-dot--cash-cow {
    background: var(--color-info);
}

.legend-dot--question-mark {
    background: var(--color-warning);
}

.legend-dot--dog {
    background: var(--color-danger);
}
</style>

