# 🔧 HƯỚNG DẪN REFACTOR STAFF.VUE VÀ VOUCHERS.VUE
## Cafe Dashboard - Refactor Guide

---

## ✅ ĐÃ HOÀN THÀNH TRONG STAFF.VUE

1. ✅ Thay imports: `useLoading` → `useAsyncOperation`
2. ✅ Thay khởi tạo: `loading, error, execute` từ `useAsyncOperation`
3. ✅ Refactor `fetchUsers` function
4. ✅ Refactor `loadRoles` function
5. ✅ Refactor `handleExport` function
6. ✅ Thay loading/error states → `LoadingState`/`ErrorState` components

---

## ⏳ CẦN HOÀN THÀNH TRONG STAFF.VUE

### Các functions còn lại cần refactor:

1. **`handleCreate`** (dòng ~1048):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể tạo nhân viên mới.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể tạo nhân viên mới.')
```

2. **`loadDashboard`** (dòng ~1076):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể tải dữ liệu hiệu suất.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể tải dữ liệu hiệu suất.', {
    showToast: false // Nếu không cần toast
})
```

3. **`handleUpdate`** (dòng ~1230):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể cập nhật thông tin nhân viên.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể cập nhật thông tin nhân viên.')
```

4. **`handleBulkActivate`** (dòng ~1286):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể kích hoạt một số nhân viên.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể kích hoạt một số nhân viên.')
```

5. **`handleBulkDeactivate`** (dòng ~1312):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể vô hiệu hóa một số nhân viên.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể vô hiệu hóa một số nhân viên.')
```

6. **`handleResetPassword`** (dòng ~1435):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể đặt lại mật khẩu.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể đặt lại mật khẩu.')
```

7. **`loadActivityLogs`** (dòng ~1463):
```javascript
// Trước
try {
    // ... logic
} catch (err) {
    handleError(err, 'Không thể tải lịch sử hoạt động.')
}

// Sau
await execute(async () => {
    // ... logic
}, 'Không thể tải lịch sử hoạt động.', {
    showToast: false // Nếu không cần toast
})
```

---

## 📝 REFACTOR VOUCHERS.VUE

### Bước 1: Thay imports
```javascript
// Xóa
import { useLoading } from '@/composables/useLoading'
import { useErrorHandler } from '@/composables/useErrorHandler'

// Thêm
import { useAsyncOperation } from '@/composables/useAsyncOperation'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
```

### Bước 2: Thay khởi tạo
```javascript
// Xóa
const { loading, withLoading } = useLoading(false)
const { handleError } = useErrorHandler({ context: 'Vouchers' })
const error = ref(null)

// Thêm
const { loading, error, execute } = useAsyncOperation({ context: 'Vouchers' })
```

### Bước 3: Refactor từng function

**Pattern chung**:
```javascript
// Trước
const functionName = async () => {
    error.value = null
    await withLoading(async () => {
        try {
            // ... logic
        } catch (err) {
            error.value = handleError(err, 'Message')
        }
    })
}

// Sau
const functionName = async () => {
    await execute(async () => {
        // ... logic
    }, 'Message')
}
```

### Bước 4: Thay loading/error states trong template
```vue
<!-- Trước -->
<div v-if="loading" class="state-block py-5">
    <div class="spinner-border text-primary"></div>
</div>
<div v-else-if="error" class="alert alert-danger">{{ error }}</div>

<!-- Sau -->
<LoadingState v-if="loading" />
<ErrorState v-else-if="error" :message="error" @retry="fetchData" />
```

---

## 🔍 TÌM CÁC FUNCTIONS CẦN REFACTOR

### Trong Staff.vue:
```bash
grep -n "handleError\|withLoading" src/pages/Staff.vue
```

### Trong Vouchers.vue:
```bash
grep -n "handleError\|withLoading" src/pages/Vouchers.vue
```

---

## ✅ CHECKLIST

### Staff.vue:
- [x] Thay imports
- [x] Thay khởi tạo
- [x] Refactor `fetchUsers`
- [x] Refactor `loadRoles`
- [x] Refactor `handleExport`
- [x] Thay loading/error states
- [ ] Refactor `handleCreate`
- [ ] Refactor `loadDashboard`
- [ ] Refactor `handleUpdate`
- [ ] Refactor `handleBulkActivate`
- [ ] Refactor `handleBulkDeactivate`
- [ ] Refactor `handleResetPassword`
- [ ] Refactor `loadActivityLogs`

### Vouchers.vue:
- [ ] Thay imports
- [ ] Thay khởi tạo
- [ ] Refactor tất cả functions
- [ ] Thay loading/error states

---

*Hướng dẫn này giúp hoàn thành refactor Staff.vue và Vouchers.vue*

