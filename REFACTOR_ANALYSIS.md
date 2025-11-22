# PHÂN TÍCH VÀ KẾ HOẠCH REFACTOR FRONTEND

## PHẦN 1: DANH SÁCH LỖI VÀ ĐIỂM CẦN REFACTOR

### 1. CODE SMELL VÀ DUPLICATION

#### 1.1. CSS Duplication
- **Vấn đề**: CSS classes `.card-shadow`, `.filter-card`, `.tabs-card`, `.reports-tabs`, `.page-header`, `.page-title`, `.page-subtitle` được định nghĩa lại trong nhiều file (23+ files)
- **Vị trí**: Tất cả các file trong `src/pages/*.vue`
- **Ảnh hưởng**: Khó maintain, không nhất quán, tăng bundle size

#### 1.2. Error Handling Pattern Không Nhất Quán
- **Vấn đề**: 
  - Một số dùng `console.error(err)`
  - Một số dùng `toast.error()`
  - Một số dùng `showError()` từ utils
  - Một số không có error handling
- **Vị trí**: Tất cả các file có API calls
- **Ví dụ**: 
  - `Reports.vue`: `console.error(err)` + `error.value = ...`
  - `Products.vue`: `console.error(err)` + `toast.error()`
  - `Customers.vue`: `console.error()` + `error.value = ...`

#### 1.3. Loading State Pattern Không Nhất Quán
- **Vấn đề**: 
  - Một số dùng `loading.value = true/false`
  - Một số dùng `isLoading` ref
  - Một số không có loading state
- **Vị trí**: Tất cả các file có async operations

#### 1.4. API Call Pattern Không Nhất Quán
- **Vấn đề**:
  - Một số dùng try/catch trực tiếp
  - Một số dùng async/await với error handling khác nhau
  - Một số không handle 404/500 properly
- **Vị trí**: Tất cả các service files và pages

#### 1.5. Console.log và Debug Code
- **Vấn đề**: Tìm thấy 40+ files có `console.log`, `console.error`, `console.warn`
- **Vị trí**: 
  - `src/pages/*.vue`
  - `src/components/*.vue`
  - `src/store/*.js`
  - `src/utils/*.js`

#### 1.6. TODO/FIXME Comments
- **Vấn đề**: Tìm thấy TODO/FIXME trong 2 files
- **Vị trí**: `src/pages/Chat.vue`, `src/components/customers/CustomerFormModal.vue`

### 2. BAD NAMING

#### 2.1. Biến và Hàm
- **Vấn đề**: 
  - `fmtCurrency`, `fmtNumber` trong `Reports.vue` (nên dùng `formatCurrency`, `formatNumber` từ utils)
  - `isActive` trong `Reports.vue` (quá generic)
  - `suppressWatcherFetch` trong nhiều files (nên dùng pattern khác)
- **Vị trí**: Nhiều files

#### 2.2. File Naming
- **Vấn đề**: 
  - `src/components/Pagination.vue` và `src/components/common/Pagination.vue` (duplicate)
  - `src/MainLayout.vue` và `src/layouts/MainLayout.vue` (duplicate)

### 3. LOGIC NẶNG

#### 3.1. Functions Quá Dài
- **Vấn đề**: 
  - `fetchReports()` trong `Reports.vue` có 100+ lines
  - `computeInsights()` trong `Reports.vue` có 120+ lines
- **Giải pháp**: Tách thành nhiều functions nhỏ hơn

#### 3.2. Nested Callbacks
- **Vấn đề**: Một số nơi có nested if/else quá sâu
- **Vị trí**: `Reports.vue`, `Products.vue`, `Orders.vue`

#### 3.3. Reactive State Không Tối Ưu
- **Vấn đề**: 
  - Một số computed properties phức tạp không được memoize
  - Một số watch không cần thiết
- **Vị trí**: Nhiều files

### 4. UI/UX LỖI VÀ KHÔNG NHẤT QUÁN

#### 4.1. Layout Không Đồng Nhất
- **Vấn đề**: 
  - Một số pages không có `.card-shadow` header
  - Một số pages không có `.filter-card`
  - Một số pages không có `.tabs-card`
  - Spacing, padding không nhất quán
- **Vị trí**: Nhiều pages không follow `Reports.vue` standard

#### 4.2. Responsive Issues
- **Vấn đề**: Một số pages không responsive tốt
- **Vị trí**: `Products.vue`, `Pos.vue`, `Chat.vue`

#### 4.3. Typography Không Nhất Quán
- **Vấn đề**: Font sizes, weights không đồng nhất
- **Vị trí**: Tất cả pages

### 5. API SAI VÀ KHÔNG CHUẨN

#### 5.1. API Endpoints Không Nhất Quán
- **Vấn đề**: 
  - Một số dùng `/api/v1/...`
  - Một số dùng `/api/...`
  - Một số không có version
- **Vị trí**: Tất cả service files

#### 5.2. Error Response Handling
- **Vấn đề**: 
  - Một số check `err.response?.data?.message`
  - Một số check `err.message`
  - Một số không handle properly
- **Vị trí**: Tất cả service files và pages

#### 5.3. Request/Response Mapping
- **Vấn đề**: Một số API calls không map response đúng cách
- **Vị trí**: Service files

### 6. PERFORMANCE ISSUES

#### 6.1. Unnecessary Re-renders
- **Vấn đề**: Một số computed properties trigger re-render không cần thiết
- **Vị trí**: Nhiều files

#### 6.2. Large Bundle Size
- **Vấn đề**: CSS duplication, không tree-shake được
- **Giải pháp**: Extract common CSS vào global styles

#### 6.3. Watch Thừa
- **Vấn đề**: Một số watch không cần thiết hoặc trigger quá nhiều
- **Vị trí**: `Reports.vue`, `Products.vue`, `Orders.vue`

---

## PHẦN 2: DANH SÁCH GIẢI PHÁP REFACTOR

### 1. CHUẨN HÓA UI/UX THEO REPORTS.VUE STANDARD

#### 1.1. Tạo Global CSS Classes
- **File**: `src/assets/styles/components.scss`
- **Nội dung**: Extract tất cả common classes từ `Reports.vue`
- **Classes**: 
  - `.page-header.card-shadow`
  - `.page-title`
  - `.page-subtitle`
  - `.filter-card`
  - `.tabs-card`
  - `.reports-tabs`
  - `.state-block`

#### 1.2. Update Tất Cả Pages
- **Action**: Thêm classes vào tất cả pages
- **Files**: Tất cả files trong `src/pages/*.vue`
- **Standard**: Follow exact structure của `Reports.vue`

### 2. CHUẨN HÓA ERROR HANDLING

#### 2.1. Tạo Error Handler Composable
- **File**: `src/composables/useErrorHandler.js`
- **Function**: 
  - `handleApiError(err)`
  - `handleError(err, context)`
- **Usage**: Replace tất cả error handling patterns

#### 2.2. Update Tất Cả API Calls
- **Action**: Sử dụng `useErrorHandler` trong tất cả pages và services

### 3. CHUẨN HÓA LOADING STATE

#### 3.1. Tạo Loading Composable
- **File**: `src/composables/useLoading.js`
- **Function**: 
  - `useLoading(initialState = false)`
  - Returns: `{ loading, setLoading, withLoading }`

#### 3.2. Update Tất Cả Pages
- **Action**: Replace tất cả loading state patterns

### 4. CHUẨN HÓA API CALLS

#### 4.1. Tạo API Wrapper
- **File**: `src/api/wrapper.js`
- **Function**: 
  - `apiCall(fn, options)`
  - Handle loading, error, success automatically

#### 4.2. Update Tất Cả Services
- **Action**: Wrap tất cả API calls với wrapper

### 5. CLEAN CODE

#### 5.1. Xóa Console.log
- **Action**: Remove tất cả `console.log`, `console.error`, `console.warn`
- **Exception**: Chỉ giữ trong development mode với proper logging

#### 5.2. Xóa Debug Code
- **Action**: Remove tất cả debug code, TODO comments

#### 5.3. Xóa Duplicate Files
- **Action**: 
  - Remove `src/components/Pagination.vue` (keep `src/components/common/Pagination.vue`)
  - Remove `src/MainLayout.vue` (keep `src/layouts/MainLayout.vue`)

### 6. TỐI ƯU PERFORMANCE

#### 6.1. Optimize Reactive State
- **Action**: Review và optimize tất cả computed properties
- **Tool**: Vue DevTools

#### 6.2. Remove Unnecessary Watches
- **Action**: Review và remove watches không cần thiết

#### 6.3. Lazy Load Components
- **Action**: Lazy load heavy components

### 7. CHUẨN HÓA NAMING

#### 7.1. Rename Functions
- **Action**: 
  - `fmtCurrency` → `formatCurrency` (use from utils)
  - `fmtNumber` → `formatNumber` (use from utils)

#### 7.2. Standardize Variable Names
- **Action**: Follow consistent naming convention

---

## PHẦN 3: THỨ TỰ THỰC HIỆN

1. **Bước 1**: Tạo global CSS classes và utilities
2. **Bước 2**: Tạo composables (useErrorHandler, useLoading, useApiCall)
3. **Bước 3**: Update Reports.vue (chuẩn hóa hoàn toàn)
4. **Bước 4**: Update các pages quan trọng (Products, Orders, Customers, Staff)
5. **Bước 5**: Update các pages còn lại
6. **Bước 6**: Clean code (remove console.log, debug code)
7. **Bước 7**: Optimize performance
8. **Bước 8**: Testing và fix bugs

---

## LƯU Ý

- Tất cả changes phải backward compatible
- Test kỹ từng bước
- Commit từng phần nhỏ
- Document changes

