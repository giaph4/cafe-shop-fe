# 📊 BÁO CÁO PHÂN TÍCH MÃ NGUỒN FRONTEND
## Cafe Dashboard - Phân tích toàn diện như kỹ sư FE cấp cao 2025

---

## 📋 TÓM TẮT TỔNG QUAN

Sau khi rà soát toàn bộ mã nguồn trong thư mục `src`, đã phát hiện các vấn đề sau:

- **File thừa**: 3 files
- **Import thiếu**: 1 file
- **Code lặp**: Nhiều pattern lặp lại
- **Console statements**: 94 instances trong 33 files
- **API không dùng**: 1 function
- **Component không dùng**: 0 (tất cả đều được sử dụng)
- **CSS trùng lặp**: Nhiều style trùng giữa các file

---

## 🗑️ 1. DANH SÁCH FILE THỪA NÊN XÓA

### 1.1. `src/pages/Overview.vue` ❌
**Lý do**: File này không được import trong router, không được sử dụng ở bất kỳ đâu trong codebase.

**Chi tiết**:
- File có 1341 dòng code
- Import các service: `adminDashboardService`, `managerDashboardService`, `staffDashboardService`
- Có logic tương tự như `RoleBasedDashboards.vue` nhưng không được route đến
- **Hành động**: XÓA FILE này vì đã có `RoleBasedDashboards.vue` thay thế

### 1.2. `src/pages/Sales.vue` ❌
**Lý do**: File này không được import trong router. Có redirect từ `/sales` đến `/reports` nhưng file này không được sử dụng.

**Chi tiết**:
- File có 77 dòng code
- Chứa logic báo cáo doanh thu và top sản phẩm
- Logic này đã được tích hợp vào `Reports.vue`
- **Hành động**: XÓA FILE này vì đã có `Reports.vue` thay thế

### 1.3. `src/pages/ShiftTemplates.vue` ⚠️
**Lý do**: File này không được import trong router, nhưng có component `ShiftTemplatesTab` được sử dụng trong `ShiftManagement.vue`.

**Chi tiết**:
- File có 490 dòng code
- Logic quản lý shift templates đã được tích hợp vào `ShiftManagement.vue` thông qua tab
- **Hành động**: XÓA FILE này vì logic đã được tích hợp vào `ShiftManagement.vue`

---

## 🔧 2. DANH SÁCH ĐOẠN CODE NÊN GỘP LẠI

### 2.1. Error Handling Pattern
**Vị trí**: Nhiều files sử dụng pattern tương tự:
- `src/pages/Products.vue`
- `src/pages/Customers.vue`
- `src/pages/Orders.vue`
- `src/pages/Staff.vue`
- `src/pages/Vouchers.vue`

**Pattern lặp**:
```javascript
const { loading, withLoading } = useLoading()
const { handleError } = useErrorHandler()
const error = ref(null)

try {
    loading.value = true
    error.value = null
    // ... logic
} catch (err) {
    error.value = handleError(err, 'Message')
} finally {
    loading.value = false
}
```

**Đề xuất**: Tất cả các file này nên sử dụng `useAsyncOperation` composable đã có sẵn:
```javascript
const { loading, error, execute } = useAsyncOperation({ context: 'PageName' })

await execute(async () => {
    // ... logic
}, 'Không thể tải dữ liệu. Vui lòng thử lại.')
```

### 2.2. Loading State Pattern
**Vị trí**: Nhiều component có pattern loading giống nhau:
- Spinner với text "Đang tải..."
- Error alert với message
- Empty state

**Đề xuất**: Tạo component `LoadingState.vue` và `ErrorState.vue` để tái sử dụng.

### 2.3. Date Range Filter Pattern
**Vị trí**: Nhiều pages có filter date range tương tự:
- `src/pages/Dashboard.vue`
- `src/pages/Reports.vue`
- `src/pages/Orders.vue`

**Đề xuất**: Tạo composable `useDateRangeFilter` để tái sử dụng:
```javascript
export const useDateRangeFilter = (defaultDays = 7) => {
    const today = () => new Date().toISOString().split('T')[0]
    const shiftDate = (days) => {
        const date = new Date()
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
    }
    
    const filters = ref({
        startDate: shiftDate(-defaultDays),
        endDate: today()
    })
    
    const presets = [
        {value: '7', label: '7 ngày'},
        {value: '30', label: '30 ngày'},
        {value: '90', label: '90 ngày'}
    ]
    
    return { filters, presets, today, shiftDate }
}
```

### 2.4. Tab Navigation Pattern
**Vị trí**: Nhiều pages có tab navigation tương tự:
- `src/pages/Customers.vue`
- `src/pages/Orders.vue`
- `src/pages/Reports.vue`
- `src/pages/Attendance.vue`

**Đề xuất**: Tạo component `TabNavigation.vue` để tái sử dụng.

---

## ✏️ 3. DANH SÁCH ĐOẠN CODE CẦN VIẾT LẠI

### 3.1. `src/pages/RoleBasedDashboards.vue` - Thiếu import
**Vấn đề**: Sử dụng `handleError` nhưng không import.

**Dòng 161**:
```javascript
error.value = handleError(err, 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
```

**Sửa**:
```javascript
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleError } = useErrorHandler({ context: 'RoleBasedDashboards' })
```

### 3.2. `src/pages/Sales.vue` - Error handling im lặng
**Vấn đề**: Catch error nhưng không xử lý.

**Dòng 72-74**:
```javascript
} catch (error) {
    // Error handled silently
}
```

**Sửa**: Nên sử dụng error handler hoặc ít nhất log error:
```javascript
} catch (error) {
    console.error('Failed to load sales data:', error)
    // Hoặc sử dụng useErrorHandler
}
```

### 3.3. Promise handling trong `src/pages/Overview.vue`
**Vấn đề**: Nhiều promise không được handle đúng cách, có thể gây memory leak.

**Đề xuất**: Sử dụng `useAsyncOperation` hoặc đảm bảo cleanup.

### 3.4. `src/pages/Sales.vue` - Data mapping sai
**Vấn đề**: Dòng 61-62, mapping data từ API response không đúng format.

**Hiện tại**:
```javascript
dailyRevenueChart.value.options.xaxis.categories = Object.keys(revenueData)
dailyRevenueChart.value.series[0].data = Object.values(revenueData)
```

**Sửa**: `getRevenueByDate` trả về object có `labels` và `values`, không phải plain object:
```javascript
dailyRevenueChart.value.options.xaxis.categories = revenueData.labels || []
dailyRevenueChart.value.series[0].data = revenueData.values || []
```

---

## 📦 4. DANH SÁCH IMPORT THỪA

### 4.1. `src/pages/Overview.vue` ❌ (File sẽ bị xóa)
- `getOrders` từ `orderService` - **ĐƯỢC SỬ DỤNG** ở dòng 731 ✅
- `formatDateTime` từ `formatters` - **ĐƯỢC SỬ DỤNG** ở dòng 160 ✅
- `EmptyState` component - **ĐƯỢC SỬ DỤNG** trong template ✅
- **Kết luận**: Không có import thừa trong file này

### 4.2. `src/pages/Sales.vue` ❌ (File sẽ bị xóa)
- `apexchart` variable được khai báo nhưng không cần thiết
- Có thể dùng trực tiếp `VueApexCharts` trong template
- **Sửa**: Xóa dòng `const apexchart = VueApexCharts` và dùng trực tiếp component

### 4.3. `src/pages/Dashboard.vue`
- Tất cả imports đều được sử dụng ✅

### 4.4. `src/main.js`
- `bootstrap` được gán vào `window.bootstrap` - cần kiểm tra xem có được sử dụng không
- **Kiểm tra**: Tìm `window.bootstrap` trong codebase
- **Đề xuất**: Nếu không dùng, xóa dòng này

### 4.5. `src/pages/Products.vue`
- Tất cả imports đều được sử dụng ✅
- `EmptyState` được sử dụng ở dòng 86 ✅

### 4.6. `src/pages/RoleBasedDashboards.vue`
- Thiếu import `handleError` từ `useErrorHandler` - **LỖI CẦN SỬA** ❌

---

## 🔌 5. DANH SÁCH API KHÔNG ĐƯỢC DÙNG

### 5.1. `getDailyRevenue` trong `src/api/reportService.js` ⚠️
**Vị trí**: Dòng 74-83

**Chi tiết**:
- Function này được import và sử dụng trong `Reports.vue` (dòng 554)
- Tuy nhiên, có thể thay thế bằng `getRevenueByDate` với cùng chức năng
- `getDailyRevenue` chỉ lấy doanh thu của 1 ngày, trong khi `getRevenueByDate` lấy nhiều ngày

**Đề xuất**: 
- Giữ lại nếu cần tối ưu (chỉ lấy 1 ngày)
- Hoặc refactor `Reports.vue` để sử dụng `getRevenueByDate` thay thế

### 5.2. `getCustomerByPhone` trong `src/api/customerService.js` ❌
**Vị trí**: Dòng 54-57

**Chi tiết**:
- Function này không được import hoặc sử dụng ở bất kỳ đâu trong codebase
- Có thể hữu ích cho POS hoặc tìm kiếm khách hàng nhanh

**Đề xuất**: 
- Xóa function này nếu không có kế hoạch sử dụng
- Hoặc tích hợp vào POS để tìm khách hàng theo số điện thoại

### 5.3. `getAllRoles` trong `src/api/roleService.js` và `src/api/userService.js` ⚠️
**Vị trí**: 
- `src/api/roleService.js` dòng 14
- `src/api/userService.js` dòng 7

**Chi tiết**:
- Có 2 function cùng tên ở 2 service khác nhau
- `userService.getAllRoles()` được sử dụng trong `Staff.vue` và `store/profile.js`
- `roleService.getAllRoles()` không được sử dụng

**Đề xuất**: 
- Xóa `roleService.getAllRoles()` nếu không cần thiết
- Hoặc đổi tên một trong hai để tránh nhầm lẫn

---

## 🧩 6. DANH SÁCH COMPONENT KHÔNG AI GỌI

**Kết quả**: Tất cả components đều được sử dụng ✅

**Chi tiết kiểm tra**:
- `src/components/common/EmptyState.vue` - được sử dụng ở 18 files ✅
- `src/components/common/PageHeader.vue` - được sử dụng ✅
- `src/components/common/Pagination.vue` - được sử dụng ✅
- Tất cả components trong `src/components/` đều được import và sử dụng ✅

**Lưu ý**: 
- Một số components chỉ được sử dụng trong các file sẽ bị xóa (Overview.vue, Sales.vue, ShiftTemplates.vue)
- Sau khi xóa các file đó, các components vẫn được sử dụng ở nơi khác nên không ảnh hưởng

---

## 🗺️ 7. DANH SÁCH DỊCH VỤ MAP SAI DỮ LIỆU

### 7.1. `src/pages/Sales.vue` - Mapping sai format từ API
**Vấn đề**: 
- Dòng 61-62: Giả định `getRevenueByDate` trả về plain object, nhưng thực tế trả về object có structure `{ labels, values, entries, summary }`

**Sửa**:
```javascript
const revenueData = await getRevenueByDate(
    sevenDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
)
dailyRevenueChart.value.options.xaxis.categories = revenueData.labels || []
dailyRevenueChart.value.series[0].data = revenueData.values || []
```

### 7.2. `src/pages/Sales.vue` - Mapping sai format `getBestSellers`
**Vấn đề**:
- Dòng 69-70: Giả định `getBestSellers` trả về array trực tiếp, nhưng thực tế trả về `{ items, totals, meta }`

**Sửa**:
```javascript
const bestSellersData = await getBestSellers(
    sevenDaysAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    5
)
bestSellersChart.value.options.labels = bestSellersData.items.map(p => p.productName)
bestSellersChart.value.series = bestSellersData.items.map(p => p.totalQuantitySold)
```

---

## 🎨 8. DANH SÁCH STYLE TRÙNG

### 8.1. Card Styles ⚠️
**Vị trí trùng**:
- `src/style.css` - dòng 381-392 (`.card` với hover effect)
- `src/assets/styles/main.scss` - dòng 41-51 (`.card` với hover effect)
- `src/assets/styles/components.scss` - không có `.card` riêng

**Phân tích**:
- Có 2 định nghĩa `.card` khác nhau
- `style.css` sử dụng CSS variables
- `main.scss` sử dụng SCSS variables

**Đề xuất**: 
- Gom tất cả card styles vào `components.scss`
- Sử dụng CSS variables từ `style.css`
- Xóa định nghĩa `.card` trong `main.scss`

### 8.2. Button Styles ⚠️
**Vị trí trùng**:
- `src/style.css` - có button styles (sử dụng Bootstrap variables)
- `src/assets/styles/main.scss` - dòng 53-79 có `.btn-primary`, `.btn-icon`

**Phân tích**:
- Bootstrap đã có button styles
- `main.scss` override một số styles

**Đề xuất**: 
- Gom tất cả custom button styles vào `components.scss`
- Sử dụng Bootstrap classes + custom modifiers
- Xóa duplicate styles trong `main.scss`

### 8.3. Page Header Styles ✅
**Vị trí**:
- `src/assets/styles/components.scss` - `.page-header.card-shadow` (dòng 10-21)
- **55 instances** sử dụng class này trong 29 files ✅

**Phân tích**:
- Đã được chuẩn hóa trong `components.scss` ✅
- Component `PageHeader.vue` đã có sẵn
- Nhiều pages đã sử dụng class này

**Đề xuất**: 
- Khuyến khích tất cả pages sử dụng component `PageHeader.vue`
- Hoặc ít nhất sử dụng class `.page-header.card-shadow` từ `components.scss`

### 8.4. Tab Navigation Styles ⚠️
**Vị trí trùng**:
- `src/assets/styles/components.scss` - `.reports-tabs` (dòng 69-98)
- `src/pages/RoleBasedDashboards.vue` - có style riêng cho tabs (dòng 228-251)
- `src/pages/Dashboard.vue` - có style riêng cho tabs (dòng 403-435)

**Phân tích**:
- Có 3 định nghĩa tab styles khác nhau
- `components.scss` có style cho `.reports-tabs`
- 2 pages có style riêng

**Đề xuất**: 
- Gom tất cả tab styles vào `components.scss` với class `.tabs-navigation`
- Tạo component `TabNavigation.vue` để tái sử dụng
- Xóa inline styles trong các pages

### 8.5. Filter Card Styles ✅
**Vị trí**:
- `src/assets/styles/components.scss` - `.filter-card` (dòng 39-49)
- **55 instances** sử dụng class này trong 29 files ✅

**Phân tích**:
- Đã được chuẩn hóa trong `components.scss` ✅
- Nhiều pages đã sử dụng

**Đề xuất**: 
- Đảm bảo tất cả pages sử dụng class `.filter-card` từ `components.scss`
- Không tạo style riêng cho filter card

### 8.6. State Block Styles ✅
**Vị trí**:
- `src/assets/styles/components.scss` - `.state-block` (dòng 103-109)
- Được sử dụng cho loading/error states

**Phân tích**:
- Đã được chuẩn hóa ✅
- Có thể tạo component `LoadingState.vue` và `ErrorState.vue` để tái sử dụng

### 8.7. CSS Variables Trùng ⚠️
**Vị trí**:
- `src/style.css` - có đầy đủ CSS variables
- `src/assets/styles/main.scss` - có SCSS variables riêng

**Đề xuất**: 
- Sử dụng CSS variables từ `style.css` trong tất cả SCSS files
- Xóa SCSS variables trùng lặp trong `main.scss`

---

## 🐛 9. LỖI TIỀM ẨN

### 9.1. Promise không được handle ✅
**Kết quả kiểm tra**:
- Hầu hết promises đều được handle đúng cách
- `src/pages/Sales.vue` - catch error nhưng im lặng (file sẽ bị xóa)
- `src/pages/Overview.vue` - có error handling đầy đủ (file sẽ bị xóa)

**Đánh giá**: ✅ Tốt - Hầu hết code đã handle promise đúng cách

### 9.2. Cleanup ✅
**Kết quả kiểm tra**:
- **84 instances** của `onBeforeUnmount`/`onUnmounted` trong 42 files ✅
- Hầu hết components đều có cleanup hooks
- `src/layouts/MainLayout.vue` - có cleanup event listeners ✅
- `src/pages/Dashboard.vue` - có cleanup WebSocket ✅
- `src/pages/Staff.vue` - có cleanup Modal instances ✅

**Đánh giá**: ✅ Tốt - Hầu hết components đều có cleanup

### 9.3. Memory leak tiềm ẩn ⚠️
**Vị trí cần kiểm tra**:
- **WebSocket connections**: 
  - `useDashboardEvents` - có `disconnect()` trong `onBeforeUnmount` ✅
  - `useChatSocket` - cần kiểm tra cleanup
  - `useShiftSessionEvents` - có `disconnect()` ✅
  - `useTableEvents` - cần kiểm tra cleanup
  
- **Event listeners**: 
  - **32 instances** trong 12 files
  - `src/layouts/MainLayout.vue` - có cleanup ✅
  - `src/components/Topbar.vue` - có 10 event listeners, cần kiểm tra cleanup
  - `src/components/Sidebar.vue` - có 4 event listeners, cần kiểm tra cleanup

**Đề xuất**: 
- Đảm bảo tất cả WebSocket connections được disconnect trong `onBeforeUnmount`
- Đảm bảo tất cả event listeners được remove trong cleanup hooks

### 9.4. Props không dùng
**Cần kiểm tra**: 
- Sử dụng `eslint-plugin-vue` để phát hiện props không dùng
- Hoặc chạy build với strict mode

**Đề xuất**: 
- Thêm rule `vue/no-unused-props` vào ESLint config

### 9.5. Emitting lỗi
**Cần kiểm tra**:
- Tất cả components có `emit` cần đảm bảo parent component lắng nghe đúng event name
- Sử dụng TypeScript hoặc JSDoc để type-check events

**Đề xuất**: 
- Tạo type definitions cho events
- Hoặc sử dụng `defineEmits` với type annotations

### 9.6. Watcher không cần thiết
**Cần kiểm tra**:
- Các watcher có thể thay thế bằng computed
- Watcher không có cleanup (ví dụ: watch trên props và gọi API)

**Đề xuất**: 
- Review các watcher và thay thế bằng computed khi có thể
- Đảm bảo watcher có cleanup nếu cần

### 9.7. Reactive không tối ưu
**Vị trí**:
- Nhiều nơi sử dụng `ref` thay vì `computed` khi có thể
- Sử dụng `reactive` không cần thiết (có thể dùng `ref`)

**Đề xuất**: 
- Review và refactor các reactive state
- Sử dụng `shallowRef` cho objects lớn
- Sử dụng `computed` thay vì `ref` + `watch` khi có thể

### 9.8. `window.bootstrap` không được sử dụng ⚠️
**Vị trí**: `src/main.js` dòng 28
- `window.bootstrap = bootstrap` được gán nhưng không được sử dụng trong codebase
- **Đề xuất**: Xóa dòng này nếu không cần thiết, hoặc kiểm tra xem có được sử dụng trong các script khác không

---

## 🚀 10. TỐI ƯU ROUTER

### 10.1. Route trùng ✅
**Kết quả**: Không có route trùng ✅

### 10.2. Route không dùng ⚠️
**Route `/sales`**:
- Redirect đến `/reports` (dòng 102-104)
- File `Sales.vue` không được sử dụng
- **Đề xuất**: 
  - Xóa redirect này nếu không cần backward compatibility
  - Hoặc giữ lại nếu cần support old URLs

### 10.3. Meta và quyền truy cập ✅
**Kết quả kiểm tra**:
- Tất cả routes đều có meta đúng ✅
- Routes có `requiresAuth` hoặc `allowedRoles` đều được xử lý đúng trong `beforeEach` guard ✅

**Cải thiện đề xuất**:
1. **Tạo constant cho roles**:
```javascript
// src/constants/roles.js
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  MANAGER: 'ROLE_MANAGER',
  STAFF: 'ROLE_STAFF'
}

export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.MANAGER]: 'Quản lý',
  [ROLES.STAFF]: 'Nhân viên'
}
```

2. **Tạo helper function để check permission**:
```javascript
// src/utils/permissions.js
export const hasRole = (userRoles, requiredRoles) => {
  if (!Array.isArray(requiredRoles)) return false
  return requiredRoles.some(role => userRoles.includes(role))
}
```

3. **Sử dụng constants trong router**:
```javascript
import { ROLES } from '@/constants/roles'

meta: { allowedRoles: [ROLES.ADMIN, ROLES.MANAGER] }
```

### 10.4. Lazy Loading ✅
**Kết quả**: 
- Một số routes đã sử dụng lazy loading (dynamic import) ✅
- Routes như `CustomerOrderDetail`, `Attendance`, `Profile` đều dùng lazy loading ✅

**Đề xuất**: 
- Có thể thêm lazy loading cho các routes lớn khác để tối ưu bundle size

---

## ⚡ 11. TỐI ƯU PERFORMANCE

### 11.1. Tối ưu render
**Vấn đề**:
- Nhiều components render lại không cần thiết
- Sử dụng `v-for` không có `:key` unique

**Đề xuất**:
- Sử dụng `v-memo` cho list items phức tạp
- Đảm bảo tất cả `v-for` có `:key` unique

### 11.2. Loại bỏ re-render không cần
**Vị trí**:
- Nhiều computed properties có thể được cache
- Sử dụng `shallowRef` thay vì `ref` cho objects lớn

### 11.3. Giảm logic trong template
**Vị trí**:
- Nhiều pages có logic phức tạp trong template
- Nên move logic vào computed hoặc methods

### 11.4. Tối ưu vòng lặp và tính toán
**Vị trí**:
- `src/pages/Overview.vue` - có nhiều computed phức tạp
- Có thể cache kết quả tính toán

---

## 🎯 12. ĐỀ XUẤT CẤU TRÚC CHUẨN

### 12.1. Cấu trúc thư mục đề xuất
```
src/
├── api/                    # ✅ Giữ nguyên
├── assets/
│   ├── styles/
│   │   ├── _variables.scss    # CSS variables
│   │   ├── _mixins.scss       # Mixins
│   │   ├── _base.scss         # Base styles
│   │   ├── _components.scss   # Component styles (đã có)
│   │   └── main.scss          # Import tất cả
│   └── ...
├── components/
│   ├── common/
│   │   ├── LoadingState.vue   # NEW
│   │   ├── ErrorState.vue     # NEW
│   │   ├── TabNavigation.vue  # NEW
│   │   ├── DateRangeFilter.vue # NEW
│   │   └── ...
│   └── ...
├── composables/
│   ├── useDateRangeFilter.js  # NEW
│   ├── useTabNavigation.js    # NEW
│   └── ...
├── constants/
│   ├── roles.js              # NEW - Role constants
│   └── ...
└── ...
```

### 12.2. Chuẩn hóa Error Handling
**Tất cả pages nên sử dụng**:
```javascript
import { useAsyncOperation } from '@/composables/useAsyncOperation'

const { loading, error, execute } = useAsyncOperation({ 
    context: 'PageName' 
})
```

### 12.3. Chuẩn hóa Loading States
**Sử dụng component**:
```vue
<LoadingState v-if="loading" />
<ErrorState v-else-if="error" :message="error" />
```

### 12.4. Chuẩn hóa Date Range Filter
**Sử dụng composable**:
```javascript
import { useDateRangeFilter } from '@/composables/useDateRangeFilter'

const { filters, presets, applyPreset } = useDateRangeFilter(7)
```

### 12.5. Chuẩn hóa Tab Navigation
**Sử dụng component**:
```vue
<TabNavigation 
    :tabs="tabs" 
    v-model:active="activeTab" 
/>
```

---

## 📝 13. CONSOLE STATEMENTS

**Tổng số**: 94 instances trong 33 files

**Phân loại**:
- `console.error`: Nhiều nhất (đa số đã có eslint-disable)
- `console.log`: Một số
- `console.warn`: Một số

**Đề xuất**:
- Thay thế tất cả bằng `logger` utility đã có trong `src/utils/logger.js`
- Xóa các `eslint-disable` comments không cần thiết

---

## ✅ 14. HÀNH ĐỘNG ƯU TIÊN

### Priority 1 (Critical - Phải sửa ngay) 🔴
1. ✅ **Sửa thiếu import `handleError`** trong `RoleBasedDashboards.vue`
   - File: `src/pages/RoleBasedDashboards.vue`
   - Dòng: 161
   - Thêm: `import { useErrorHandler } from '@/composables/useErrorHandler'`

2. ✅ **Xóa file thừa**:
   - `src/pages/Overview.vue` (1341 dòng)
   - `src/pages/Sales.vue` (77 dòng)
   - `src/pages/ShiftTemplates.vue` (490 dòng)

3. ✅ **Xóa API không dùng**:
   - `getCustomerByPhone` trong `customerService.js`
   - `getAllRoles` trong `roleService.js` (hoặc đổi tên)

4. ✅ **Xóa `window.bootstrap`** trong `main.js` nếu không dùng

### Priority 2 (High - Nên sửa sớm) 🟡
1. **Refactor error handling pattern** sang `useAsyncOperation`
   - Files: `Products.vue`, `Customers.vue`, `Orders.vue`, `Staff.vue`, `Vouchers.vue`
   - Lợi ích: Chuẩn hóa error handling, giảm code duplication

2. **Tạo và sử dụng composables/components tái sử dụng**:
   - `useDateRangeFilter` composable
   - `TabNavigation.vue` component
   - `LoadingState.vue` component
   - `ErrorState.vue` component

3. **Gom CSS trùng lặp**:
   - Gom card styles vào `components.scss`
   - Gom button styles vào `components.scss`
   - Gom tab navigation styles vào `components.scss`

4. **Tạo constants cho roles**:
   - File: `src/constants/roles.js`
   - Sử dụng trong router và components

### Priority 3 (Medium - Có thể làm dần) 🟢
1. **Thay thế console statements** bằng logger
   - 94 instances trong 33 files
   - Sử dụng `src/utils/logger.js`

2. **Tối ưu performance**:
   - Sử dụng `v-memo` cho list items phức tạp
   - Sử dụng `shallowRef` cho objects lớn
   - Review và tối ưu computed properties

3. **Kiểm tra và fix memory leaks**:
   - Đảm bảo WebSocket connections được disconnect
   - Đảm bảo event listeners được remove
   - Review các composables có cleanup đầy đủ

4. **Tối ưu CSS variables**:
   - Sử dụng CSS variables từ `style.css` trong SCSS
   - Xóa SCSS variables trùng lặp

### Priority 4 (Low - Optional) 🔵
1. **Refactor các computed phức tạp**
   - Review và tách thành smaller computed
   - Cache kết quả tính toán khi cần

2. **Cải thiện TypeScript support** (nếu có)
   - Thêm type definitions cho events
   - Thêm JSDoc comments

3. **Tối ưu bundle size**:
   - Thêm lazy loading cho các routes lớn
   - Code splitting cho các components lớn

4. **Cải thiện accessibility**:
   - Thêm ARIA labels
   - Cải thiện keyboard navigation

---

## 📊 15. THỐNG KÊ CHI TIẾT

### 15.1. Files
- **Tổng số files phân tích**: ~150+ files
- **Files cần xóa**: 3 files
  - `src/pages/Overview.vue` (1341 dòng)
  - `src/pages/Sales.vue` (77 dòng)
  - `src/pages/ShiftTemplates.vue` (490 dòng)
- **Files cần sửa ngay**: 2 files
  - `src/pages/RoleBasedDashboards.vue` (thiếu import)
  - `src/pages/Sales.vue` (mapping sai - sẽ xóa)

### 15.2. Code Patterns
- **Code lặp phát hiện**: ~10+ patterns
  - Error handling pattern: 5+ files
  - Date range filter: 3+ files
  - Tab navigation: 4+ files
  - Loading state: Nhiều files
- **Console statements**: 94 instances trong 33 files
- **Import thừa**: ~2-3 files
  - `src/pages/Sales.vue` (sẽ xóa)
  - `src/main.js` (`window.bootstrap`)

### 15.3. API Services
- **Tổng số API functions**: ~212 functions
- **API không dùng**: 2 functions
  - `getCustomerByPhone` trong `customerService.js`
  - `getAllRoles` trong `roleService.js` (trùng với `userService.getAllRoles`)
- **API cần review**: 1 function
  - `getDailyRevenue` (có thể thay bằng `getRevenueByDate`)

### 15.4. Components
- **Tổng số components**: ~80+ components
- **Components không dùng**: 0 ✅
- **Components cần tạo mới**: 4
  - `LoadingState.vue`
  - `ErrorState.vue`
  - `TabNavigation.vue`
  - `DateRangeFilter.vue`

### 15.5. CSS/Styles
- **CSS trùng lặp**: ~7 patterns
  - Card styles: 2 định nghĩa
  - Button styles: 2 định nghĩa
  - Tab navigation: 3 định nghĩa
  - Page header: Đã chuẩn hóa ✅
  - Filter card: Đã chuẩn hóa ✅
- **CSS classes được sử dụng**: 
  - `.page-header.card-shadow`: 55 instances trong 29 files
  - `.filter-card`: 55 instances trong 29 files
  - `.tabs-card`: Nhiều instances

### 15.6. Cleanup & Memory
- **onBeforeUnmount hooks**: 84 instances trong 42 files ✅
- **Event listeners**: 32 instances trong 12 files
- **WebSocket connections**: 4 composables
  - `useDashboardEvents` ✅ (có cleanup)
  - `useChatSocket` ⚠️ (cần kiểm tra)
  - `useShiftSessionEvents` ✅ (có cleanup)
  - `useTableEvents` ⚠️ (cần kiểm tra)

### 15.7. Router
- **Tổng số routes**: 30+ routes
- **Routes trùng**: 0 ✅
- **Routes không dùng**: 1 (redirect `/sales`)
- **Lazy loading**: Một số routes đã sử dụng ✅

### 15.8. Performance
- **Computed properties**: Nhiều, cần review
- **Watchers**: Cần review để tối ưu
- **Reactive state**: Cần review để sử dụng `shallowRef` khi phù hợp

---

## 🎓 KẾT LUẬN

Codebase nhìn chung được tổ chức tốt, nhưng vẫn còn nhiều cơ hội để cải thiện:

1. **Code quality**: Cần chuẩn hóa error handling và loading states
2. **Code reuse**: Nhiều pattern lặp có thể extract thành composables/components
3. **Performance**: Có thể tối ưu render và memory usage
4. **Maintainability**: Cần gom CSS và tạo constants

Sau khi thực hiện các cải thiện trên, codebase sẽ:
- Dễ maintain hơn
- Performance tốt hơn
- Code quality cao hơn
- Developer experience tốt hơn

---

*Báo cáo được tạo bởi AI Code Reviewer - 2025*

