<template>
    <Teleport to="body">
        <Transition name="calculator-overlay">
            <div
                v-if="isOpen"
                class="calculator-overlay"
                @click.self="handleOverlayClick"
                @keydown.esc="handleEscape"
                role="dialog"
                aria-modal="true"
                aria-labelledby="calculator-title"
            >
                <div
                    ref="panelRef"
                    class="calculator-panel"
                    :class="{ 'is-pinned': isPinned, 'is-mobile': isMobile }"
                    @click.stop
                >
                    <!-- Header -->
                    <header class="calculator-header">
                        <div class="calculator-header__title">
                            <i class="bi bi-calculator me-2"></i>
                            <h3 id="calculator-title">Máy tính</h3>
                        </div>
                        <div class="calculator-header__actions">
                            <button
                                type="button"
                                class="calculator-btn calculator-btn--icon"
                                :class="{ 'is-active': isPinned }"
                                @click="togglePin"
                                :title="isPinned ? 'Bỏ ghim' : 'Ghim panel'"
                                aria-label="Ghim panel"
                            >
                                <i class="bi" :class="isPinned ? 'bi-pin-fill' : 'bi-pin'"></i>
                            </button>
                            <button
                                type="button"
                                class="calculator-btn calculator-btn--icon"
                                @click="closePanel"
                                title="Đóng (Esc)"
                                aria-label="Đóng máy tính"
                            >
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </header>

                    <!-- Body -->
                    <div class="calculator-body">
                        <!-- Mode Tabs -->
                        <div class="calculator-tabs">
                            <button
                                v-for="tab in tabs"
                                :key="tab.key"
                                type="button"
                                class="calculator-tab"
                                :class="{ 'is-active': activeTab === tab.key }"
                                @click="activeTab = tab.key"
                            >
                                <i :class="tab.icon" class="me-1"></i>
                                {{ tab.label }}
                            </button>
                        </div>

                        <!-- Standard Calculator -->
                        <div v-if="activeTab === 'standard'" class="calculator-standard">
                            <!-- Display -->
                            <div class="calculator-display">
                                <div class="calculator-display__expression" v-if="expression">
                                    {{ expression }}
                                </div>
                                <div class="calculator-display__result" :class="{ 'is-error': hasError }">
                                    {{ displayValue }}
                                </div>
                            </div>

                            <!-- Keypad (phong cách Windows Calculator) -->
                            <div class="calculator-keypad">
                                <button
                                    v-for="key in keypadLayout"
                                    :key="key"
                                    type="button"
                                    class="calculator-key"
                                    :class="getKeyClass(key)"
                                    @click="handleKey(key)"
                                >
                                    {{ getKeyLabel(key) }}
                                </button>
                            </div>
                        </div>

                        <!-- Quick Pay Mode -->
                        <div v-if="activeTab === 'quickpay'" class="calculator-quickpay">
                            <div class="quickpay-form">
                                <div class="quickpay-field">
                                    <label>Số lượng</label>
                                    <input
                                        ref="quantityInput"
                                        type="number"
                                        v-model.number="quickPay.quantity"
                                        @input="calculateQuickPay"
                                        min="0"
                                        step="0.01"
                                        autocomplete="off"
                                        class="calculator-input"
                                    />
                                </div>
                                <div class="quickpay-field">
                                    <label>Giá đơn vị</label>
                                    <input
                                        type="number"
                                        v-model.number="quickPay.unitPrice"
                                        @input="calculateQuickPay"
                                        min="0"
                                        step="0.01"
                                        autocomplete="off"
                                        class="calculator-input"
                                    />
                                </div>
                                <div class="quickpay-field">
                                    <label>Giảm giá</label>
                                    <div class="quickpay-discount">
                                        <input
                                            type="number"
                                            v-model.number="quickPay.discount"
                                            @input="calculateQuickPay"
                                            min="0"
                                            step="0.01"
                                            autocomplete="off"
                                            class="calculator-input"
                                        />
                                        <select
                                            v-model="quickPay.discountType"
                                            @change="calculateQuickPay"
                                            class="calculator-select"
                                        >
                                            <option value="nominal">VNĐ</option>
                                            <option value="percent">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="quickpay-field">
                                    <label>VAT (%)</label>
                                    <input
                                        type="number"
                                        v-model.number="quickPay.vatPercent"
                                        @input="calculateQuickPay"
                                        min="0"
                                        step="0.1"
                                        autocomplete="off"
                                        class="calculator-input"
                                    />
                                </div>
                                <div class="quickpay-field">
                                    <label>Tip (%)</label>
                                    <input
                                        type="number"
                                        v-model.number="quickPay.tipPercent"
                                        @input="calculateQuickPay"
                                        min="0"
                                        step="0.1"
                                        autocomplete="off"
                                        class="calculator-input"
                                    />
                                </div>
                            </div>

                            <!-- Quick Pay Results -->
                            <Transition name="fade">
                                <div v-if="quickPayResult" class="quickpay-results">
                                    <div class="quickpay-step">
                                        <span class="quickpay-step__label">Subtotal:</span>
                                        <span class="quickpay-step__value">{{ formatCurrency(quickPayResult.subtotal) }}</span>
                                    </div>
                                    <div v-if="quickPayResult.discountAmount > 0" class="quickpay-step">
                                        <span class="quickpay-step__label">Giảm giá:</span>
                                        <span class="quickpay-step__value">-{{ formatCurrency(quickPayResult.discountAmount) }}</span>
                                    </div>
                                    <div class="quickpay-step">
                                        <span class="quickpay-step__label">Sau giảm giá:</span>
                                        <span class="quickpay-step__value">{{ formatCurrency(quickPayResult.subtotalAfterDiscount) }}</span>
                                    </div>
                                    <div v-if="quickPayResult.vatAmount > 0" class="quickpay-step">
                                        <span class="quickpay-step__label">VAT ({{ quickPayResult.vatPercent }}%):</span>
                                        <span class="quickpay-step__value">+{{ formatCurrency(quickPayResult.vatAmount) }}</span>
                                    </div>
                                    <div v-if="quickPayResult.tipAmount > 0" class="quickpay-step">
                                        <span class="quickpay-step__label">Tip ({{ quickPayResult.tipPercent }}%):</span>
                                        <span class="quickpay-step__value">+{{ formatCurrency(quickPayResult.tipAmount) }}</span>
                                    </div>
                                    <div class="quickpay-total">
                                        <span class="quickpay-total__label">Tổng cộng:</span>
                                        <span class="quickpay-total__value">{{ formatCurrency(quickPayResult.total) }}</span>
                                    </div>
                                </div>
                            </Transition>
                        </div>

                        <!-- Currency Converter -->
                        <div v-if="activeTab === 'currency'" class="calculator-currency">
                            <div class="currency-form">
                                <div class="currency-field">
                                    <label>Từ</label>
                                    <div class="currency-input-group">
                                        <input
                                            type="number"
                                            v-model.number="currency.fromAmount"
                                            @input="calculateCurrency"
                                            min="0"
                                            step="0.01"
                                            autocomplete="off"
                                            class="calculator-input"
                                            placeholder="0"
                                        />
                                        <select
                                            v-model="currency.fromCurrency"
                                            @change="calculateCurrency"
                                            class="calculator-select calculator-select--currency"
                                        >
                                            <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                                                {{ curr.symbol }} {{ curr.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div class="currency-swap">
                                    <button
                                        type="button"
                                        class="currency-swap-btn"
                                        @click="swapCurrencies"
                                        title="Đổi chiều"
                                    >
                                        <i class="bi bi-arrow-down-up"></i>
                                    </button>
                                </div>
                                <div class="currency-field">
                                    <label>Sang</label>
                                    <div class="currency-input-group">
                                        <input
                                            type="number"
                                            v-model.number="currency.toAmount"
                                            @input="calculateCurrencyReverse"
                                            min="0"
                                            step="0.01"
                                            autocomplete="off"
                                            class="calculator-input"
                                            placeholder="0"
                                            readonly
                                        />
                                        <select
                                            v-model="currency.toCurrency"
                                            @change="calculateCurrency"
                                            class="calculator-select calculator-select--currency"
                                        >
                                            <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                                                {{ curr.symbol }} {{ curr.name }}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                                <div class="currency-field">
                                    <label>Tỷ giá (1 {{ currency.fromCurrency }} = ? {{ currency.toCurrency }})</label>
                                    <div class="currency-rate">
                                        <input
                                            type="number"
                                            v-model.number="currency.exchangeRate"
                                            @input="calculateCurrency"
                                            min="0"
                                            step="0.0001"
                                            autocomplete="off"
                                            class="calculator-input"
                                            placeholder="Tự động"
                                        />
                                        <button
                                            type="button"
                                            class="calculator-btn calculator-btn--text"
                                            @click="useDefaultRate"
                                            title="Dùng tỷ giá mặc định"
                                        >
                                            <i class="bi bi-arrow-clockwise"></i>
                                        </button>
                                    </div>
                                    <div class="currency-rate-info">
                                        <small v-if="currency.exchangeRate > 0">
                                            1 {{ getCurrencySymbol(currency.fromCurrency) }} = 
                                            {{ formatNumber(currency.exchangeRate) }} {{ getCurrencySymbol(currency.toCurrency) }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <Transition name="fade">
                                <div v-if="currencyResult !== null && currency.fromAmount > 0" class="currency-result">
                                    <div class="currency-result__from">
                                        {{ formatCurrencyAmount(currency.fromAmount, currency.fromCurrency) }}
                                    </div>
                                    <div class="currency-result__arrow">
                                        <i class="bi bi-arrow-right"></i>
                                    </div>
                                    <div class="currency-result__to">
                                        {{ formatCurrencyAmount(currencyResult, currency.toCurrency) }}
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>

                    <!-- Footer -->
                    <footer class="calculator-footer">
                        <button
                            v-if="activeTab === 'quickpay' && quickPayResult"
                            type="button"
                            class="calculator-btn calculator-btn--primary"
                            @click="handleConfirmQuickPay"
                        >
                            <i class="bi bi-check-circle me-2"></i>
                            Xác nhận
                        </button>
                        <button
                            v-if="activeTab === 'quickpay' && quickPayResult"
                            type="button"
                            class="calculator-btn calculator-btn--secondary"
                            @click="handleCopyTotal"
                        >
                            <i class="bi bi-clipboard me-2"></i>
                            Copy tổng
                        </button>
                        <div class="calculator-footer__info">
                            <kbd>Ctrl+M</kbd> để mở/đóng
                        </div>
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
    add, subtract, multiply, divide, power, sqrt, log, ln,
    sin, cos, tan, factorial, percent, toggleSign,
    roundTo100, roundTo1000, calculateQuickPay as calcQuickPay, convertCurrency
} from '@/utils/calculatorMath'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'calculate:completed'])

// State
const isOpen = ref(props.modelValue)
const isPinned = ref(false)
const isMobile = ref(window.innerWidth < 768)
const panelRef = ref(null)
const quantityInput = ref(null)

// Calculator state
const displayValue = ref('0')
const expression = ref('')
const currentValue = ref(0)
const previousValue = ref(null)
const operation = ref(null)
const shouldResetDisplay = ref(false)
const hasError = ref(false)
const memory = ref(0)

// History
const history = ref([])
const MAX_HISTORY = 20

// Tabs
const activeTab = ref('standard')
const tabs = [
    { key: 'standard', label: 'Máy tính', icon: 'bi-calculator' },
    { key: 'quickpay', label: 'Tính tiền', icon: 'bi-cash-coin' },
    { key: 'currency', label: 'Đổi tiền', icon: 'bi-currency-exchange' }
]

// Quick Pay
const quickPay = ref({
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    discountType: 'nominal',
    vatPercent: 0,
    tipPercent: 0
})
const quickPayResult = ref(null)

// Currency
const currencies = [
    { code: 'VND', name: 'Việt Nam Đồng', symbol: '₫', rate: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.00004 }, // 1 USD = 25,000 VND
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.000036 }, // 1 EUR = 27,800 VND
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.000032 }, // 1 GBP = 31,250 VND
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 0.0056 }, // 1 JPY = 178.57 VND
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 0.00028 }, // 1 CNY = 3,571 VND
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 0.05 }, // 1 KRW = 20 VND
    { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 0.0011 }, // 1 THB = 909 VND
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 0.00003 }, // 1 SGD = 33,333 VND
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 0.000027 }, // 1 AUD = 37,037 VND
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 0.000029 }, // 1 CAD = 34,483 VND
]

const currency = ref({
    fromAmount: 0,
    fromCurrency: 'VND',
    toAmount: 0,
    toCurrency: 'USD',
    exchangeRate: 0.00004 // Default: 1 VND = 0.00004 USD (1 USD = 25,000 VND)
})
const currencyResult = ref(null)

// Layout keypad chuẩn, tối giản giống Windows Calculator (theme sáng)
const keypadLayout = [
    // Hàng 1: Memory
    'MC', 'MR', 'M+', 'M-',
    // Hàng 2: phần trăm + xoá
    '%', 'CE', 'C', '⌫',
    // Hàng 3-6: số & toán tử
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '±', '0', '.', '='
]

// Computed
const getKeyClass = (key) => {
    if (['+', '-', '×', '÷', '='].includes(key)) return 'calculator-key--operator'
    if (['CE', 'C', '⌫'].includes(key)) return 'calculator-key--clear'
    if (key === '0') return 'calculator-key--zero'
    if (['M+', 'M-', 'MR', 'MC'].includes(key)) return 'calculator-key--memory'
    return ''
}

const getKeyLabel = (key) => {
    const labels = {
        '÷': '÷',
        '×': '×',
        '⌫': '⌫',
        '±': '±',
        '=': '=',
        'R100': 'R100',
        'R1000': 'R1000'
    }
    return labels[key] || key
}

// Methods
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0'
    const numStr = num.toString()
    if (numStr.includes('e')) return num.toExponential(2)
    if (numStr.includes('.')) {
        const parts = numStr.split('.')
        return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
    }
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(num)
}

const updateDisplay = (value) => {
    displayValue.value = formatNumber(value)
    currentValue.value = value
}

const handleKey = (key) => {
    hasError.value = false
    
    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        handleNumber(key)
    } else if (key === '.') {
        handleDecimal()
    } else if (['+', '-', '×', '÷'].includes(key)) {
        handleOperation(key)
    } else if (key === '=') {
        handleEquals()
    } else if (key === 'C') {
        handleClear()
    } else if (key === 'CE') {
        handleClearEntry()
    } else if (key === '⌫') {
        handleBackspace()
    } else if (key === '±') {
        handleToggleSign()
    } else if (key === '%') {
        handlePercent()
    } else if (key === 'R100') {
        handleRoundTo100()
    } else if (key === 'R1000') {
        handleRoundTo1000()
    } else if (key.startsWith('M')) {
        handleMemory(key)
    }
}

const handleNumber = (num) => {
    if (shouldResetDisplay.value) {
        displayValue.value = num
        shouldResetDisplay.value = false
    } else {
        if (displayValue.value === '0') {
            displayValue.value = num
        } else {
            displayValue.value += num
        }
    }
    currentValue.value = parseFloat(displayValue.value.replace(/,/g, '')) || 0
}

const handleDecimal = () => {
    if (shouldResetDisplay.value) {
        displayValue.value = '0.'
        shouldResetDisplay.value = false
    } else if (!displayValue.value.includes('.')) {
        displayValue.value += '.'
    }
}

const handleOperation = (op) => {
    if (operation.value && !shouldResetDisplay.value) {
        handleEquals()
    }
    previousValue.value = currentValue.value
    operation.value = op
    shouldResetDisplay.value = true
    expression.value = `${formatNumber(previousValue.value)} ${op}`
}

const handleEquals = () => {
    if (!operation.value || previousValue.value === null) return
    
    try {
        let result
        const prev = previousValue.value
        const curr = currentValue.value
        
        switch (operation.value) {
            case '+':
                result = add(prev, curr)
                break
            case '-':
                result = subtract(prev, curr)
                break
            case '×':
                result = multiply(prev, curr)
                break
            case '÷':
                result = divide(prev, curr)
                break
            default:
                return
        }
        
        expression.value = `${formatNumber(prev)} ${operation.value} ${formatNumber(curr)} =`
        updateDisplay(result)
        
        // Lưu vào lịch sử
        addToHistory(expression.value, result)
        
        operation.value = null
        previousValue.value = null
        shouldResetDisplay.value = true
    } catch (error) {
        hasError.value = true
        displayValue.value = 'Lỗi'
    }
}

const handleFunction = (func) => {
    try {
        let result
        const value = currentValue.value
        
        switch (func) {
            case 'sqrt':
                result = sqrt(value)
                break
            case 'power':
                result = power(value, 2)
                break
            case 'log':
                result = log(value)
                break
            case 'ln':
                result = ln(value)
                break
            case 'sin':
                result = sin(value)
                break
            case 'cos':
                result = cos(value)
                break
            case 'tan':
                result = tan(value)
                break
            case 'factorial':
                result = factorial(value)
                break
            default:
                return
        }
        
        expression.value = `${func}(${formatNumber(value)}) =`
        updateDisplay(result)
        addToHistory(expression.value, result)
        shouldResetDisplay.value = true
    } catch (error) {
        hasError.value = true
        displayValue.value = error.message || 'Lỗi'
    }
}

const handleClear = () => {
    displayValue.value = '0'
    currentValue.value = 0
    previousValue.value = null
    operation.value = null
    expression.value = ''
    shouldResetDisplay.value = false
    hasError.value = false
}

const handleClearEntry = () => {
    displayValue.value = '0'
    currentValue.value = 0
    shouldResetDisplay.value = false
}

const handleBackspace = () => {
    if (shouldResetDisplay.value) return
    const str = displayValue.value.replace(/,/g, '')
    if (str.length > 1) {
        displayValue.value = formatNumber(str.slice(0, -1))
        currentValue.value = parseFloat(displayValue.value.replace(/,/g, '')) || 0
    } else {
        displayValue.value = '0'
        currentValue.value = 0
    }
}

const handleToggleSign = () => {
    try {
        const result = toggleSign(currentValue.value)
        updateDisplay(result)
    } catch (error) {
        hasError.value = true
    }
}

const handlePercent = () => {
    try {
        const result = percent(currentValue.value)
        updateDisplay(result)
    } catch (error) {
        hasError.value = true
    }
}

const handleRoundTo100 = () => {
    try {
        const result = roundTo100(currentValue.value)
        updateDisplay(result)
    } catch (error) {
        hasError.value = true
    }
}

const handleRoundTo1000 = () => {
    try {
        const result = roundTo1000(currentValue.value)
        updateDisplay(result)
    } catch (error) {
        hasError.value = true
    }
}

const handleMemory = (op) => {
    switch (op) {
        case 'M+':
            memory.value = add(memory.value, currentValue.value)
            break
        case 'M-':
            memory.value = subtract(memory.value, currentValue.value)
            break
        case 'MR':
            updateDisplay(memory.value)
            shouldResetDisplay.value = true
            break
        case 'MC':
            memory.value = 0
            break
    }
}

const addToHistory = (expr, result) => {
    history.value.unshift({ expression: expr, result })
    if (history.value.length > MAX_HISTORY) {
        history.value = history.value.slice(0, MAX_HISTORY)
    }
}

const clearHistory = () => {
    history.value = []
}

const loadFromHistory = (item) => {
    updateDisplay(item.result)
    shouldResetDisplay.value = true
}

const calculateQuickPay = () => {
    try {
        const result = calcQuickPay(
            quickPay.value.quantity,
            quickPay.value.unitPrice,
            quickPay.value.discount,
            quickPay.value.discountType,
            quickPay.value.vatPercent,
            quickPay.value.tipPercent
        )
        quickPayResult.value = result
    } catch (error) {
        console.error('Quick pay calculation error:', error)
        quickPayResult.value = null
    }
}

const getCurrencySymbol = (code) => {
    const curr = currencies.find(c => c.code === code)
    return curr ? curr.symbol : code
}

const getCurrencyRate = (fromCode, toCode) => {
    if (fromCode === toCode) return 1
    
    const fromCurr = currencies.find(c => c.code === fromCode)
    const toCurr = currencies.find(c => c.code === toCode)
    
    if (!fromCurr || !toCurr) return 1
    
    // Convert through VND as base
    // If converting from VND to other: use other's rate
    // If converting from other to VND: use 1/other's rate
    // If converting between two non-VND: convert through VND
    
    if (fromCode === 'VND') {
        return toCurr.rate
    } else if (toCode === 'VND') {
        return 1 / fromCurr.rate
    } else {
        // Convert from -> VND -> to
        return toCurr.rate / fromCurr.rate
    }
}

const useDefaultRate = () => {
    currency.value.exchangeRate = getCurrencyRate(currency.value.fromCurrency, currency.value.toCurrency)
    calculateCurrency()
}

const swapCurrencies = () => {
    const temp = currency.value.fromCurrency
    currency.value.fromCurrency = currency.value.toCurrency
    currency.value.toCurrency = temp
    currency.value.exchangeRate = getCurrencyRate(currency.value.fromCurrency, currency.value.toCurrency)
    calculateCurrency()
}

const calculateCurrency = () => {
    try {
        if (currency.value.fromAmount <= 0) {
            currencyResult.value = null
            currency.value.toAmount = 0
            return
        }
        
        const rate = currency.value.exchangeRate > 0 
            ? currency.value.exchangeRate 
            : getCurrencyRate(currency.value.fromCurrency, currency.value.toCurrency)
        
        currency.value.exchangeRate = rate
        currencyResult.value = convertCurrency(currency.value.fromAmount, rate)
        currency.value.toAmount = currencyResult.value
    } catch (error) {
        console.error('Currency calculation error:', error)
        currencyResult.value = null
        currency.value.toAmount = 0
    }
}

const calculateCurrencyReverse = () => {
    // This is readonly, but we can use it for reverse calculation if needed
    // For now, we only calculate from -> to
}

const formatCurrencyAmount = (amount, code) => {
    const curr = currencies.find(c => c.code === code)
    if (!curr) return formatNumber(amount) + ' ' + code
    
    if (code === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    } else {
        return curr.symbol + ' ' + formatNumber(amount)
    }
}

const handleConfirmQuickPay = () => {
    if (quickPayResult.value) {
        emit('calculate:completed', {
            type: 'quickpay',
            ...quickPayResult.value
        })
        // Reset form
        quickPay.value = {
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            discountType: 'nominal',
            vatPercent: 0,
            tipPercent: 0
        }
        quickPayResult.value = null
    }
}

const handleCopyTotal = async () => {
    if (quickPayResult.value) {
        try {
            await navigator.clipboard.writeText(quickPayResult.value.total.toString())
            // Có thể thêm toast notification ở đây
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }
}

const togglePin = () => {
    isPinned.value = !isPinned.value
}

const closePanel = () => {
    if (!isPinned.value) {
        isOpen.value = false
        emit('update:modelValue', false)
    }
}

const handleOverlayClick = () => {
    if (!isPinned.value) {
        closePanel()
    }
}

const handleEscape = (e) => {
    if (e.key === 'Escape' && !isPinned.value) {
        closePanel()
    }
}

const handleResize = () => {
    isMobile.value = window.innerWidth < 768
}

const setupKeyboardShortcuts = (e) => {
    const key = e.key

    // Ctrl+M: toggle open/close
    if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'm') {
        e.preventDefault()
        isOpen.value = !isOpen.value
        emit('update:modelValue', isOpen.value)
        return
    }

    // Chỉ xử lý phím khi panel đang mở và đang ở tab standard
    if (!isOpen.value || activeTab.value !== 'standard') return

    // Nếu focus đang ở input trong quickpay/currency thì bỏ qua
    const target = e.target
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

    // Map phím bàn phím sang key của calculator
    const keyMap = {
        '/': '÷',
        '*': '×',
        '+': '+',
        '-': '-',
        Enter: '=',
        '=': '=',
        Backspace: '⌫',
        Escape: 'C',
        Delete: 'CE',
        '%': '%',
    }

    // Số và dấu chấm
    if (/^[0-9]$/.test(key)) {
        e.preventDefault()
        handleKey(key)
        return
    }

    if (key === '.' || key === ',') {
        e.preventDefault()
        handleKey('.')
        return
    }

    // Các phím chức năng + toán tử
    const mapped = keyMap[key] || keyMap[e.key]
    if (mapped) {
        e.preventDefault()
        handleKey(mapped)
    }
}

// Watch
watch(() => props.modelValue, (newVal) => {
    isOpen.value = newVal
    if (newVal) {
        nextTick(() => {
            // Focus trap
            if (panelRef.value) {
                const firstInput = panelRef.value.querySelector('input, button')
                if (firstInput) firstInput.focus()
            }
            // Set default exchange rate when opening currency tab
            if (activeTab.value === 'currency' && currency.value.exchangeRate === 0) {
                useDefaultRate()
            }
        })
    }
})

watch(() => activeTab.value, (newTab) => {
    if (newTab === 'currency' && currency.value.exchangeRate === 0) {
        useDefaultRate()
    }
})

watch(isOpen, (newVal) => {
    emit('update:modelValue', newVal)
})

// Lifecycle
onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', setupKeyboardShortcuts)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', setupKeyboardShortcuts)
})
</script>

<style scoped>
/* Calculator Panel Styles */
.calculator-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 1rem;
}

.calculator-overlay-enter-active,
.calculator-overlay-leave-active {
    transition: opacity 0.3s ease;
}

.calculator-overlay-enter-from,
.calculator-overlay-leave-to {
    opacity: 0;
}

.calculator-panel {
    width: 100%;
    max-width: 420px;
    height: calc(100vh - 2rem);
    max-height: 90vh;
    background: var(--color-elevated, #ffffff);
    border-radius: 20px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.calculator-panel.is-mobile {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.calculator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-card, #ffffff);
}

.calculator-header__title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.calculator-header__title h3 {
    margin: 0;
    font-size: 1.25rem;
}

.calculator-header__actions {
    display: flex;
    gap: 0.5rem;
}

.calculator-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.calculator-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--color-border, #e5e7eb);
}

.calculator-tab {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s ease;
}

.calculator-tab:hover {
    color: var(--color-primary, #4f46e5);
    background: rgba(79, 70, 229, 0.05);
}

.calculator-tab.is-active {
    color: var(--color-primary, #4f46e5);
    border-bottom-color: var(--color-primary, #4f46e5);
    font-weight: 600;
}

/* Standard Calculator */
.calculator-standard {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.calculator-display {
    background: var(--color-surface-muted, #f9fafb);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    min-height: 90px;
    max-height: 90px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border: 1px solid var(--color-border, #e5e7eb);
    flex-shrink: 0;
}

.calculator-display__expression {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-bottom: 0.5rem;
    min-height: 1.25rem;
    word-break: break-all;
}

.calculator-display__result {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-heading, #1f2937);
    word-break: break-all;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
}

.calculator-display__result.is-error {
    color: var(--color-danger, #ef4444);
}

.calculator-history {
    margin-bottom: 1rem;
    flex-shrink: 0;
}

.calculator-history__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
}

.calculator-history__list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    max-height: 120px;
    overflow-y: auto;
    flex-shrink: 0;
}

.calculator-history__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--color-surface-muted, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
}

.calculator-history__item:hover {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
}

.calculator-history__expr {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    flex: 1;
}

.calculator-history__item:hover .calculator-history__expr {
    color: white;
}

.calculator-history__result {
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.calculator-history__item:hover .calculator-history__result {
    color: white;
}

.calculator-keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.calculator-key {
    aspect-ratio: 1;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 10px;
    background: var(--color-card, #ffffff);
    color: var(--color-heading, #1f2937);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    max-height: 56px;
}

.calculator-key:hover {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.calculator-key:active {
    transform: translateY(0);
}

.calculator-key--operator {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
}

.calculator-key--operator:hover {
    background: var(--color-primary-dark, #4338ca);
}

.calculator-key--clear {
    background: var(--color-warning, #f59e0b);
    color: white;
    border-color: var(--color-warning, #f59e0b);
}

.calculator-key--clear:hover {
    background: #d97706;
}

.calculator-key--function {
    background: var(--color-surface-muted, #f9fafb);
    font-size: 0.875rem;
}

.calculator-key--memory {
    background: var(--color-secondary, #8b5cf6);
    color: white;
    border-color: var(--color-secondary, #8b5cf6);
    font-size: 0.875rem;
}

.calculator-key--zero {
    grid-column: span 2;
    aspect-ratio: 2 / 1;
}

/* Quick Pay */
.calculator-quickpay {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.quickpay-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
}

.quickpay-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.quickpay-field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.quickpay-discount {
    display: flex;
    gap: 0.5rem;
}

.quickpay-discount .calculator-input {
    flex: 1;
}

.quickpay-discount .calculator-select {
    width: 100px;
}

.calculator-input,
.calculator-select {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-card, #ffffff);
    color: var(--color-heading, #1f2937);
    transition: all 0.2s ease;
}

.calculator-input:focus,
.calculator-select:focus {
    outline: none;
    border-color: var(--color-primary, #4f46e5);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.quickpay-results {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-surface-muted, #f9fafb);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.quickpay-step {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.quickpay-step:last-of-type {
    border-bottom: none;
}

.quickpay-step__label {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.quickpay-step__value {
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.quickpay-total {
    display: flex;
    justify-content: space-between;
    padding: 1rem 0 0;
    margin-top: 1rem;
    border-top: 2px solid var(--color-primary, #4f46e5);
}

.quickpay-total__label {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-heading, #1f2937);
}

.quickpay-total__value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary, #4f46e5);
}

/* Currency Converter */
.calculator-currency {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
}

.currency-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
}

.currency-input-group {
    display: flex;
    gap: 0.5rem;
}

.currency-input-group .calculator-input {
    flex: 1;
}

.calculator-select--currency {
    width: 140px;
    flex-shrink: 0;
}

.currency-swap {
    display: flex;
    justify-content: center;
    margin: 0.25rem 0;
}

.currency-swap-btn {
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    background: var(--color-card, #ffffff);
    color: var(--color-primary, #4f46e5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.currency-swap-btn:hover {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
}

.currency-rate {
    display: flex;
    gap: 0.5rem;
}

.currency-rate .calculator-input {
    flex: 1;
}

.currency-rate-info {
    margin-top: 0.25rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.75rem;
}

.currency-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.currency-field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.currency-result {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-surface-muted, #f9fafb);
    border-radius: 12px;
    border: 1px solid var(--color-border, #e5e7eb);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-shrink: 0;
}

.currency-result__from,
.currency-result__to {
    flex: 1;
    text-align: center;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-heading, #1f2937);
}

.currency-result__to {
    color: var(--color-primary, #4f46e5);
    font-size: 1.25rem;
}

.currency-result__arrow {
    color: var(--color-text-muted, #6b7280);
    font-size: 1.25rem;
    flex-shrink: 0;
}

/* Footer */
.calculator-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-card, #ffffff);
    gap: 0.75rem;
}

.calculator-footer__info {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
}

.calculator-footer__info kbd {
    background: var(--color-surface-muted, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.calculator-btn {
    padding: 0.625rem 1rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    background: var(--color-card, #ffffff);
    color: var(--color-heading, #1f2937);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.calculator-btn:hover {
    background: var(--color-surface-muted, #f9fafb);
    border-color: var(--color-primary, #4f46e5);
    color: var(--color-primary, #4f46e5);
}

.calculator-btn--icon {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 8px;
}

.calculator-btn--icon.is-active {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
}

.calculator-btn--primary {
    background: var(--color-primary, #4f46e5);
    color: white;
    border-color: var(--color-primary, #4f46e5);
}

.calculator-btn--primary:hover {
    background: var(--color-primary-dark, #4338ca);
}

.calculator-btn--secondary {
    background: var(--color-surface-muted, #f9fafb);
}

.calculator-btn--text {
    background: transparent;
    border: none;
    color: var(--color-primary, #4f46e5);
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

.calculator-btn--text:hover {
    background: rgba(79, 70, 229, 0.1);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Mobile */
@media (max-width: 768px) {
    .calculator-overlay {
        padding: 0;
    }

    .calculator-panel {
        border-radius: 0;
        height: 100vh;
        max-height: 100vh;
    }

    .calculator-keypad {
        gap: 0.5rem;
    }

    .calculator-key {
        min-height: 64px;
        font-size: 1.25rem;
    }
}
</style>

