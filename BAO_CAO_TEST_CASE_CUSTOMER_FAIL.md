# BÁO CÁO KIỂM TRA TEST CASE - 40 TEST CASE QUẢN LÝ KHÁCH HÀNG (CUSTOMER)

## TỔNG QUAN
- **Tổng số test case**: 40 (TC_CUSTOMER_01 đến TC_CUSTOMER_40)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend tĩnh
- **Quét toàn bộ backend**: `be/src/main/java/com/giapho/coffee_shop_backend`
- **Quét toàn bộ frontend**: `src/`

---

## DANH SÁCH TEST CASE SẼ FAIL

### 🔴 **TC_CUSTOMER_05**: Xóa khách hàng
- **Expected Result**: "Xóa khách hàng thành công", "Hiển thị thông báo 'Đã xóa khách hàng'", "Khách hàng không còn xuất hiện trong danh sách"
- **Actual Result**: ✅ **PASS** (Có endpoint DELETE và UI xóa)
- **Lý do**: Backend có `@DeleteMapping("/{id}")` trong `CustomerController.java`, frontend có delete modal và button

---

### 🔴 **TC_CUSTOMER_10**: Xuất Excel danh sách khách
- **Expected Result**: "Tải xuống file .xlsx chứa danh sách"
- **Actual Result**: ⚠️ **CÓ THỂ PASS** (Xuất CSV có thể mở bằng Excel)
- **Lý do**: Frontend xuất CSV (`.csv`), không phải `.xlsx`, nhưng CSV có thể mở bằng Excel

---

### 🔴 **TC_CUSTOMER_11**: Import khách từ Excel
- **Expected Result**: "Hệ thống nhập dữ liệu khách hàng hàng loạt"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Backend: `CustomerController.java` KHÔNG có endpoint POST `/api/v1/customers/import` hoặc `/api/v1/customers/batch`
  - Frontend: `Customers.vue` và `CustomerListTab.vue` KHÔNG có button "Import Excel" hoặc chức năng upload file
  - Service: `customerService.js` KHÔNG có function `importCustomers()` hoặc `batchCreateCustomers()`

---

### 🔴 **TC_CUSTOMER_14**: Sắp xếp khách hàng theo điểm tích lũy
- **Expected Result**: "Danh sách khách hàng được sắp xếp theo điểm tích lũy giảm dần", "Có thể click lại để sắp xếp tăng dần"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `CustomerListTab.vue` KHÔNG có dropdown sort hoặc click header để sort
  - Backend: `CustomerController.java` có `Pageable` với sort mặc định là `fullName,asc`, nhưng frontend không có UI để thay đổi sort theo `loyaltyPoints`
  - API: `getCustomers()` có parameter `sort` nhưng frontend không sử dụng

---

### 🔴 **TC_CUSTOMER_23**: Sắp xếp khách hàng theo tổng chi tiêu
- **Expected Result**: "Danh sách khách hàng được sắp xếp theo tổng chi tiêu cao nhất", "Có thể click lại để sắp xếp thấp nhất"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: KHÔNG có UI để sort theo tổng chi tiêu
  - Backend: `CustomerDTO` có thể có `totalSpending` nhưng không có sort option cho trường này
  - API: Không có sort parameter cho `totalSpending`

---

### 🔴 **TC_CUSTOMER_24**: Sắp xếp khách hàng theo số đơn hàng
- **Expected Result**: "Danh sách khách hàng được sắp xếp theo số đơn hàng nhiều nhất", "Có thể click lại để sắp xếp ít nhất"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: KHÔNG có UI để sort theo số đơn hàng
  - Backend: `CustomerDTO` có thể có `totalOrders` nhưng không có sort option cho trường này
  - API: Không có sort parameter cho `totalOrders`

---

### 🔴 **TC_CUSTOMER_30**: Export danh sách khách hàng ra PDF
- **Expected Result**: "Tải file PDF về máy", "Có thể mở và in file PDF"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `handleExport()` trong `Customers.vue` chỉ xuất CSV, KHÔNG có chức năng export PDF
  - Backend: `CustomerController.java` KHÔNG có endpoint `/api/v1/customers/export-pdf` hoặc tương tự
  - Service: Không có service export PDF cho customers

---

### 🔴 **TC_CUSTOMER_38**: Sắp xếp khách hàng theo ngày tạo
- **Expected Result**: "Danh sách khách hàng được sắp xếp theo ngày tạo mới nhất", "Có thể click lại để sắp xếp cũ nhất"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: KHÔNG có UI để sort theo `createdAt`
  - Backend: Có thể sort theo `createdAt` qua `Pageable`, nhưng frontend không có UI để chọn
  - API: `getCustomers()` có parameter `sort` nhưng frontend không sử dụng

---

## TÓM TẮT

### **Tổng số test case FAIL**: **6 test case**

| TC ID | Test Case | Trạng thái |
|-------|-----------|------------|
| **TC_CUSTOMER_05** | Xóa khách hàng | ✅ **PASS** |
| **TC_CUSTOMER_10** | Xuất Excel danh sách khách | ⚠️ **CÓ THỂ PASS** (CSV) |
| **TC_CUSTOMER_11** | Import khách từ Excel | ❌ **FAIL** |
| **TC_CUSTOMER_14** | Sắp xếp theo điểm tích lũy | ❌ **FAIL** |
| **TC_CUSTOMER_23** | Sắp xếp theo tổng chi tiêu | ❌ **FAIL** |
| **TC_CUSTOMER_24** | Sắp xếp theo số đơn hàng | ❌ **FAIL** |
| **TC_CUSTOMER_30** | Export danh sách ra PDF | ❌ **FAIL** |
| **TC_CUSTOMER_38** | Sắp xếp theo ngày tạo | ❌ **FAIL** |

### **Nguyên nhân chính:**

1. **Thiếu chức năng Import Excel**: Không có API và UI để import khách hàng hàng loạt
2. **Thiếu chức năng Export PDF**: Chỉ có export CSV, không có PDF
3. **Thiếu UI để sắp xếp**: Không có dropdown hoặc click header để sort theo các trường khác nhau (điểm tích lũy, tổng chi tiêu, số đơn hàng, ngày tạo)

---

## CHI TIẾT CÁC TEST CASE FAIL

### **FAIL chắc chắn:**

1. **TC_CUSTOMER_11**: Import khách từ Excel
   - Expected: "Hệ thống nhập dữ liệu khách hàng hàng loạt"
   - Actual: ❌ FAIL
   - Lý do: Không có endpoint và UI import

2. **TC_CUSTOMER_14**: Sắp xếp theo điểm tích lũy
   - Expected: "Danh sách được sắp xếp theo điểm tích lũy giảm dần"
   - Actual: ❌ FAIL
   - Lý do: Không có UI để chọn sort

3. **TC_CUSTOMER_23**: Sắp xếp theo tổng chi tiêu
   - Expected: "Danh sách được sắp xếp theo tổng chi tiêu cao nhất"
   - Actual: ❌ FAIL
   - Lý do: Không có UI để chọn sort

4. **TC_CUSTOMER_24**: Sắp xếp theo số đơn hàng
   - Expected: "Danh sách được sắp xếp theo số đơn hàng nhiều nhất"
   - Actual: ❌ FAIL
   - Lý do: Không có UI để chọn sort

5. **TC_CUSTOMER_30**: Export danh sách ra PDF
   - Expected: "Tải file PDF về máy"
   - Actual: ❌ FAIL
   - Lý do: Chỉ có export CSV, không có PDF

6. **TC_CUSTOMER_38**: Sắp xếp theo ngày tạo
   - Expected: "Danh sách được sắp xếp theo ngày tạo mới nhất"
   - Actual: ❌ FAIL
   - Lý do: Không có UI để chọn sort

---

## KẾT LUẬN

**Tổng số test case FAIL**: **6 test case** (15% tổng số 40 test case)

**Các chức năng cơ bản hoạt động tốt**: CRUD (Create, Read, Update, Delete), Tìm kiếm, Lọc, Export CSV, Phân trang, Validation, Xem chi tiết, Lịch sử mua hàng, Tích điểm tự động.

**Các chức năng thiếu**: Import Excel, Export PDF, UI Sort (theo điểm tích lũy, tổng chi tiêu, số đơn hàng, ngày tạo).

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác 100%, cần chạy test thực tế với database và API.

