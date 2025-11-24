# 🚀 NEXT STEPS - HƯỚNG DẪN TIẾP TỤC
## Cafe Dashboard - Next Steps Guide

---

## ✅ ĐÃ HOÀN THÀNH

### Priority 1 (Critical) - 100% ✅
- Tất cả tasks đã hoàn thành

### Priority 2 (High) - 100% ✅
- Tất cả tasks đã hoàn thành
- 4 pages đã refactor sang `useAsyncOperation`
- Components và composables đã tạo

---

## ⏳ CẦN LÀM TIẾP

### 1. Hoàn thành Staff.vue (Optional)

**Các functions còn lại** (không bắt buộc, nhưng nên làm):
- `handleCreate` - dòng ~1043
- `loadDashboard` - dòng ~1071  
- `handleUpdate` - dòng ~1225
- `handleBulkActivate` - dòng ~1281
- `handleBulkDeactivate` - dòng ~1307
- `handleResetPassword` - dòng ~1430
- `loadActivityLogs` - dòng ~1458

**Xem hướng dẫn**: `STAFF_VOUCHERS_REFACTOR_GUIDE.md`

### 2. Priority 3: Thay thế console statements

**Số lượng**: 94 instances trong 33 files

**Cách làm**:
```bash
# 1. Tìm tất cả console statements
grep -rn "console\." src/ --include="*.vue" --include="*.js" > console_statements.txt

# 2. Thay thế từng file
# console.error → logger.error
# console.log → logger.debug  
# console.warn → logger.warn

# 3. Thêm import
import { logger } from '@/utils/logger'
```

**Files có nhiều console statements**:
- `src/components/shifts/ShiftInstanceDetailModal.vue` - 8 console.error
- `src/pages/AdminAnalyticsDetail.vue` - 1 console.error
- `src/pages/ShiftReportDetail.vue` - 1 console.error
- Và 30 files khác

### 3. Priority 3: Fix memory leaks

#### WebSocket
**Files cần kiểm tra**:
- `src/composables/useChatSocket.js`
- `src/composables/useTableEvents.js`

**Pattern cần đảm bảo**:
```javascript
onBeforeUnmount(() => {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect()
    }
    subscriptions.forEach(sub => sub.unsubscribe())
})
```

#### Event Listeners
**Files cần kiểm tra**:
- `src/components/Topbar.vue` - 10 listeners
- `src/components/Sidebar.vue` - 4 listeners

**Pattern cần đảm bảo**:
```javascript
onMounted(() => {
    const handler = () => { /* ... */ }
    window.addEventListener('resize', handler)
    
    onBeforeUnmount(() => {
        window.removeEventListener('resize', handler)
    })
})
```

### 4. Priority 3: Tối ưu CSS variables

**Cần làm**:
1. Đọc `src/style.css` để xem CSS variables
2. Sửa `src/assets/styles/main.scss`:
   - Thay SCSS variables bằng CSS variables
   - Xóa SCSS variables trùng lặp

**Pattern**:
```scss
// Trước
$primary-color: #A36B4A;
.card {
    background-color: $primary-color;
}

// Sau
.card {
    background-color: var(--color-primary);
}
```

### 5. API Alignment: Tìm Backend Spec

**Các cách tìm**:
1. **Trong backend code**:
   ```bash
   # Tìm controllers
   find be/src -name "*Controller.java" -type f
   
   # Đọc annotations @RequestMapping, @GetMapping, etc.
   ```

2. **Swagger UI**:
   - Mở: `http://localhost:8080/swagger-ui.html`
   - Hoặc: `http://localhost:8080/swagger-ui/index.html`

3. **OpenAPI JSON**:
   - `http://localhost:8080/v3/api-docs`
   - `http://localhost:8080/api-docs`

4. **Yêu cầu backend team**:
   - File OpenAPI/Swagger JSON hoặc YAML
   - Hoặc danh sách endpoints với schema

### 6. API Alignment: Đối chiếu và sửa

**Sau khi có spec**:

1. **Tạo bảng đối chiếu** (xem `API_ALIGNMENT_GUIDE.md`)

2. **Sửa các lỗi phát hiện**:
   - URL path
   - HTTP method
   - Request params/body
   - Response mapping
   - Error handling

3. **Test lại**:
   - Test từng API endpoint
   - Kiểm tra response mapping
   - Kiểm tra error handling

---

## 📊 PROGRESS SUMMARY

### Completed ✅
- **Priority 1**: 7/7 tasks (100%)
- **Priority 2**: 13/13 tasks (100%)
- **Total**: 20/20 tasks completed

### Remaining ⏳
- **Priority 3**: 0/4 tasks (0%)
- **API Alignment**: 0/5 tasks (0%)
- **Total**: 9 tasks remaining

---

## 🎯 RECOMMENDED ORDER

1. **Hoàn thành Staff.vue** (nếu có thời gian)
2. **Tìm backend API spec** (quan trọng)
3. **Đối chiếu và sửa API** (quan trọng)
4. **Thay console statements** (có thể làm dần)
5. **Fix memory leaks** (quan trọng cho performance)
6. **Tối ưu CSS variables** (có thể làm dần)

---

*Hướng dẫn này giúp tiếp tục công việc còn lại*

