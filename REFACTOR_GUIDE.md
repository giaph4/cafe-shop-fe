# HƯỚNG DẪN REFACTOR FRONTEND

## CÁC BƯỚC ĐÃ HOÀN THÀNH

### ✅ 1. Tạo Global CSS Components
- **File**: `src/assets/styles/components.scss`
- **Import**: Đã thêm vào `src/assets/styles/main.scss`
- **Classes có sẵn**:
  - `.page-header.card-shadow`
  - `.page-title`
  - `.page-subtitle`
  - `.filter-card`
  - `.tabs-card`
  - `.reports-tabs`
  - `.state-block`
  - `.page-container`

### ✅ 2. Tạo Composables
- **`src/composables/useErrorHandler.js`**: Chuẩn hóa error handling
- **`src/composables/useLoading.js`**: Chuẩn hóa loading state
- **`src/composables/useApiCall.js`**: Chuẩn hóa API calls với auto loading/error handling

## HƯỚNG DẪN REFACTOR TỪNG FILE

### BƯỚC 1: Update Template (HTML)

#### 1.1. Thêm Page Container
```vue
<template>
    <div class="page-container container-fluid" data-aos="fade-up">
        <!-- Content -->
    </div>
</template>
```

#### 1.2. Thêm Page Header (nếu chưa có)
```vue
<div class="page-header card-shadow">
    <div>
        <h2 class="page-title">Tiêu đề trang</h2>
        <p class="page-subtitle">Mô tả trang</p>
    </div>
    <div class="d-flex flex-wrap gap-2 align-items-center">
        <!-- Actions -->
    </div>
</div>
```

#### 1.3. Thêm Filter Card (nếu có filters)
```vue
<div class="card filter-card mb-4">
    <div class="card-body">
        <!-- Filters -->
    </div>
</div>
```

#### 1.4. Thêm Tabs Card (nếu có tabs)
```vue
<div class="card tabs-card mb-4">
    <div class="card-body">
        <ul class="nav nav-pills reports-tabs mb-3" role="tablist">
            <li class="nav-item" v-for="tab in tabs" :key="tab.key">
                <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key"
                >
                    <i :class="[tab.icon, 'me-2']"></i>{{ tab.label }}
                </button>
            </li>
        </ul>
        <!-- Tab content -->
    </div>
</div>
```

#### 1.5. Thêm State Block (loading/error)
```vue
<div v-if="loading" class="state-block py-5">
    <div class="spinner-border text-primary" role="status"></div>
</div>
<div v-else-if="error" class="state-block py-5">
    <div class="alert alert-danger mb-0">{{ error }}</div>
</div>
<div v-else>
    <!-- Content -->
</div>
```

### BƯỚC 2: Update Script (JavaScript)

#### 2.1. Import Composables
```javascript
import { useLoading } from '@/composables/useLoading'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useApiCall } from '@/composables/useApiCall'
```

#### 2.2. Replace Loading State
**Trước:**
```javascript
const loading = ref(false)

const fetchData = async () => {
    loading.value = true
    try {
        // API call
    } finally {
        loading.value = false
    }
}
```

**Sau:**
```javascript
const { loading, withLoading } = useLoading()

const fetchData = async () => {
    await withLoading(async () => {
        // API call
    })
}
```

#### 2.3. Replace Error Handling
**Trước:**
```javascript
const error = ref(null)

try {
    // API call
} catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Lỗi không xác định'
    toast.error(error.value)
}
```

**Sau:**
```javascript
const { handleError } = useErrorHandler({ context: 'PageName' })
const error = ref(null)

try {
    // API call
} catch (err) {
    error.value = handleError(err)
}
```

#### 2.4. Sử dụng useApiCall (Recommended)
```javascript
const { loading, error, execute } = useApiCall({
    errorContext: 'PageName',
    showErrorToast: true
})

const fetchData = async () => {
    try {
        const result = await execute(apiService.getData, param1, param2)
        // Handle result
    } catch (err) {
        // Error already handled by useApiCall
    }
}
```

### BƯỚC 3: Remove Duplicate CSS

#### 3.1. Xóa CSS đã có trong global
Xóa các styles sau khỏi `<style scoped>`:
- `.card-shadow`
- `.page-title`
- `.page-subtitle`
- `.filter-card`
- `.tabs-card`
- `.reports-tabs`
- `.state-block`

#### 3.2. Giữ lại chỉ CSS specific cho page
Chỉ giữ lại:
- Page-specific classes
- Component-specific styles
- Custom animations

### BƯỚC 4: Clean Code

#### 4.1. Remove Console.log
**Tìm và xóa:**
- `console.log(...)`
- `console.error(...)` (trừ development mode)
- `console.warn(...)`

**Thay thế bằng:**
```javascript
if (import.meta.env.DEV) {
    console.error('[Context]', error)
}
```

#### 4.2. Remove Debug Code
- Xóa `debugger` statements
- Xóa TODO/FIXME comments (hoặc move vào issue tracker)
- Xóa commented code

#### 4.3. Standardize Naming
- `fmtCurrency` → `formatCurrency` (import từ utils)
- `fmtNumber` → `formatNumber` (import từ utils)
- `isActive` → `isComponentActive` (more specific)

### BƯỚC 5: Optimize Performance

#### 5.1. Review Computed Properties
- Đảm bảo không có side effects
- Memoize nếu cần

#### 5.2. Review Watches
- Xóa watches không cần thiết
- Combine multiple watches nếu có thể
- Sử dụng `immediate: false` nếu không cần chạy ngay

#### 5.3. Lazy Load Heavy Components
```javascript
const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

## CHECKLIST REFACTOR MỖI FILE

- [ ] Template sử dụng global CSS classes
- [ ] Script sử dụng composables (useLoading, useErrorHandler, useApiCall)
- [ ] Removed duplicate CSS
- [ ] Removed console.log/debug code
- [ ] Standardized naming
- [ ] Optimized reactive state
- [ ] Tested functionality
- [ ] No linter errors

## VÍ DỤ: REFACTOR PRODUCTS.VUE

Xem file `REFACTORED_PRODUCTS_EXAMPLE.md` để tham khảo cách refactor hoàn chỉnh.

## LƯU Ý

1. **Backward Compatibility**: Đảm bảo tất cả changes không break existing functionality
2. **Testing**: Test kỹ từng file sau khi refactor
3. **Incremental**: Refactor từng file một, không làm tất cả cùng lúc
4. **Documentation**: Update comments nếu cần

