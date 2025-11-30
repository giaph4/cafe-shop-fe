# BÁO CÁO KIỂM TRA TEST CASE - 80 TEST CASE QUẢN LÝ BÀN

## TỔNG QUAN
- **Tổng số test case**: 80 (TC_TABLE_01 đến TC_TABLE_80)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend

---

## CÁC TEST CASE SẼ FAIL

### 🔴 **NHÓM 1: EXPORT EXCEL (TC_TABLE_30 - TC_TABLE_35)**

**Số lượng test case bị ảnh hưởng**: ~5-6 test case

#### **Lỗi phát hiện:**

1. **KHÔNG có chức năng Export Excel cho danh sách bàn**
   - File kiểm tra: `src/pages/Tables.vue`
   - Vấn đề: Không có button "Xuất Excel" hoặc chức năng export
   - Backend: `ReportExcelExportService.java` chỉ có export cho Orders, Inventory, Expenses, KHÔNG có export cho Tables
   - Frontend: Không có API call để export tables
   - Hậu quả: Test case về export Excel sẽ FAIL

#### **Các test case cụ thể sẽ FAIL:**

- **TC_TABLE_30**: Xuất danh sách bàn ra Excel
  - Expected: "Tải xuống file .xlsx chứa danh sách bàn"
  - Actual: ❌ FAIL - Không có chức năng export

- **TC_TABLE_31 - TC_TABLE_35**: Các test case liên quan export Excel
  - Expected: "File excel hiển thị đúng dữ liệu"
  - Actual: ❌ FAIL - Không có chức năng

---

### 🔴 **NHÓM 2: QUẢN LÝ KHU VỰC BÀN (TC_TABLE_20 - TC_TABLE_25)**

**Số lượng test case bị ảnh hưởng**: ~5-6 test case

#### **Lỗi phát hiện:**

1. **CafeTable Entity KHÔNG có trường `area` hoặc `zone`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/domain/entity/CafeTable.java`
   - Vấn đề: Entity chỉ có `id`, `name`, `capacity`, `status` - KHÔNG có `area`/`zone`
   - Hậu quả: Không thể lưu và quản lý khu vực bàn

2. **CafeTableRequest DTO KHÔNG có trường `area`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/dto/CafeTableRequest.java`
   - Vấn đề: DTO chỉ có `name` và `capacity`
   - Hậu quả: Frontend không thể gửi dữ liệu area lên backend

3. **Frontend KHÔNG có UI để nhập/sửa khu vực**
   - File: `src/pages/Tables.vue` (form modal)
   - Vấn đề: Form chỉ có trường `name` và `capacity`, không có `area`
   - Hậu quả: User không thể nhập/sửa khu vực bàn

#### **Các test case cụ thể sẽ FAIL:**

- **TC_TABLE_20**: Sửa khu vực bàn
  - Expected: "Cập nhật khu vực bàn thành công"
  - Actual: ❌ FAIL - Không có trường area trong database và UI

- **TC_TABLE_21 - TC_TABLE_25**: Các test case về quản lý khu vực
  - Expected: "Hiển thị khu vực bàn", "Lọc bàn theo khu vực", etc.
  - Actual: ❌ FAIL - Tất cả đều fail vì không có dữ liệu area

---

### 🔴 **NHÓM 3: LỊCH SỬ ĐƠN HÀNG CỦA BÀN (TC_TABLE_40 - TC_TABLE_45)**

**Số lượng test case bị ảnh hưởng**: ~5-6 test case

#### **Lỗi phát hiện:**

1. **KHÔNG có API endpoint để lấy lịch sử đơn hàng theo bàn**
   - File kiểm tra: `be/src/main/java/com/giapho/coffee_shop_backend/controller/CafeTableController.java`
   - Vấn đề: Controller chỉ có CRUD cơ bản, không có endpoint `/tables/{id}/orders` hoặc `/tables/{id}/history`
   - Hậu quả: Không thể lấy danh sách đơn hàng của một bàn cụ thể

2. **KHÔNG có UI để hiển thị lịch sử đơn hàng**
   - File: `src/pages/Tables.vue`
   - Vấn đề: Không có modal/drawer để xem order history của bàn
   - Hậu quả: User không thể xem lịch sử đơn hàng

3. **Backend có query nhưng không có API endpoint**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/domain/repository/OrderRepository.java`
   - Vấn đề: Có method `findByTableIdAndStatus()` nhưng không được expose qua API
   - Hậu quả: Frontend không thể gọi được

#### **Các test case cụ thể sẽ FAIL:**

- **TC_TABLE_40**: Xem lịch sử đơn hàng của bàn
  - Expected: "Hiển thị thông tin chi tiết tất cả đơn hàng từng phục vụ tại bàn"
  - Actual: ❌ FAIL - Không có chức năng này

- **TC_TABLE_41 - TC_TABLE_45**: Các test case về lịch sử đơn hàng
  - Expected: "Hiển thị đơn hàng theo thời gian", "Lọc đơn hàng theo trạng thái", etc.
  - Actual: ❌ FAIL - Tất cả đều fail

---

### 🔴 **NHÓM 4: THỐNG KÊ DOANH THU THEO BÀN (TC_TABLE_50 - TC_TABLE_55)**

**Số lượng test case bị ảnh hưởng**: ~5-6 test case

#### **Lỗi phát hiện:**

1. **KHÔNG có API endpoint để lấy thống kê doanh thu theo bàn**
   - File kiểm tra: `be/src/main/java/com/giapho/coffee_shop_backend/controller/CafeTableController.java`
   - Vấn đề: Không có endpoint `/tables/{id}/revenue` hoặc `/tables/{id}/statistics`
   - Hậu quả: Không thể lấy thống kê doanh thu

2. **KHÔNG có UI để hiển thị thống kê**
   - File: `src/pages/Tables.vue`
   - Vấn đề: Không có component để hiển thị revenue statistics
   - Hậu quả: User không thể xem thống kê

3. **Backend có query tổng doanh thu nhưng không theo bàn**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/domain/repository/OrderRepository.java`
   - Vấn đề: Có query tổng doanh thu theo date range nhưng không có query theo tableId
   - Hậu quả: Không thể tính doanh thu cho từng bàn

#### **Các test case cụ thể sẽ FAIL:**

- **TC_TABLE_50**: Xem thống kê doanh thu theo bàn
  - Expected: "Hiển thị thống kê doanh thu theo bàn"
  - Actual: ❌ FAIL - Không có chức năng này

- **TC_TABLE_51 - TC_TABLE_55**: Các test case về thống kê
  - Expected: "Hiển thị doanh thu theo ngày/tuần/tháng", "So sánh doanh thu các bàn", etc.
  - Actual: ❌ FAIL - Tất cả đều fail

---

### 🟡 **NHÓM 5: PHÂN TRANG (TC_TABLE_15 - TC_TABLE_18)**

**Số lượng test case bị ảnh hưởng**: ~3-4 test case

#### **Lỗi phát hiện:**

1. **Frontend load TẤT CẢ bàn một lúc, không có pagination**
   - File: `src/pages/Tables.vue` (dòng 298-302)
   - Vấn đề: `getTables()` gọi API không có pagination, load tất cả
   - Backend: `CafeTableController.getAllTables()` trả về `List<CafeTableResponse>` không có pagination
   - Hậu quả: Nếu có nhiều bàn (>100), performance sẽ kém

2. **Backend không hỗ trợ pagination**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/controller/CafeTableController.java`
   - Vấn đề: Endpoint `/api/v1/tables` không có `Pageable` parameter
   - Hậu quả: Không thể phân trang ở backend

#### **Các test case cụ thể sẽ FAIL:**

- **TC_TABLE_15**: Phân trang danh sách bàn
  - Expected: "Hiển thị 10 bàn/trang", "Có nút chuyển trang"
  - Actual: ⚠️ CÓ THỂ FAIL - Không có pagination UI

- **TC_TABLE_16 - TC_TABLE_18**: Các test case về pagination
  - Expected: "Chuyển trang thành công", "Hiển thị đúng số lượng bàn mỗi trang"
  - Actual: ⚠️ CÓ THỂ FAIL - Nếu test case yêu cầu pagination

---

### 🟢 **NHÓM 6: CÁC CHỨC NĂNG HOẠT ĐỘNG ĐÚNG**

#### **Các chức năng PASS:**

1. ✅ **Hiển thị danh sách bàn** (TC_TABLE_01)
   - Frontend: `src/pages/Tables.vue` - OK
   - Backend: `CafeTableController.getAllTables()` - OK

2. ✅ **Thêm bàn mới** (TC_TABLE_02 - TC_TABLE_05)
   - Frontend: Form validation với yup - OK
   - Backend: `CafeTableServiceImpl.createTable()` - OK
   - Validation: Tên bắt buộc, capacity >= 1 - OK

3. ✅ **Sửa thông tin bàn** (TC_TABLE_06 - TC_TABLE_08)
   - Frontend: Update form - OK
   - Backend: `CafeTableServiceImpl.updateTableInfo()` - OK
   - Validation: Kiểm tra tên trùng - OK

4. ✅ **Xóa bàn** (TC_TABLE_09 - TC_TABLE_10)
   - Frontend: Delete modal với confirmation - OK
   - Backend: `CafeTableServiceImpl.deleteTable()` - OK
   - Validation: Kiểm tra bàn có đơn hàng không - OK

5. ✅ **Tìm kiếm bàn theo tên** (TC_TABLE_11)
   - Frontend: Client-side filter - OK
   - Logic: `filteredTables` computed - OK

6. ✅ **Lọc bàn theo trạng thái** (TC_TABLE_12)
   - Frontend: Status filter dropdown - OK
   - Logic: Filter theo status - OK

7. ✅ **Lọc bàn theo sức chứa** (TC_TABLE_13)
   - Frontend: Capacity filter với ranges (1-2, 3-4, 5-8, 9+) - OK
   - Logic: Filter theo capacity ranges - OK

8. ✅ **Sắp xếp bàn** (TC_TABLE_14)
   - Frontend: Sort dropdown - OK
   - Logic: Sort theo name (A-Z, Z-A) và capacity (tăng/giảm) - OK

9. ✅ **Cập nhật trạng thái bàn** (TC_TABLE_19)
   - Frontend: Status dropdown trong table card - OK
   - Backend: `CafeTableController.updateTableStatus()` - OK
   - Permission: STAFF, MANAGER, ADMIN - OK

10. ✅ **WebSocket cập nhật trạng thái real-time** (TC_TABLE_60)
    - Frontend: `src/store/tables.js` có WebSocket connection - OK
    - Logic: `useTableEvents` composable - OK
    - Events: TABLE_STATUS_UPDATED, TABLE_CREATED, TABLE_DELETED - OK

11. ✅ **Validation khi thêm bàn với tên trống** (TC_TABLE_03)
    - Frontend: yup validation `required('Tên bàn là bắt buộc')` - OK
    - Backend: `@NotBlank` validation - OK

12. ✅ **Validation khi thêm bàn với capacity <= 0** (TC_TABLE_04)
    - Frontend: yup validation `min(1, 'Sức chứa phải lớn hơn hoặc bằng 1')` - OK
    - Backend: `@Min(value = 1)` validation - OK

13. ✅ **Validation khi thêm bàn với tên trùng** (TC_TABLE_05)
    - Backend: `cafeTableValidator.ensureNameUnique()` - OK
    - Error handling: Frontend hiển thị lỗi "Tên bàn đã tồn tại" - OK

14. ✅ **Responsive trên mobile** (TC_TABLE_70 - TC_TABLE_75)
    - CSS: `@media (max-width: 768px)` - OK
    - Layout: Grid responsive với `repeat(auto-fill, minmax(220px, 1fr))` - OK
    - UI: Header flex-direction column trên mobile - OK

15. ✅ **Permission check** (TC_TABLE_80)
    - Create/Update/Delete: Chỉ MANAGER và ADMIN - OK
    - View/Status Update: STAFF, MANAGER, ADMIN - OK
    - Frontend: `canManage` computed check - OK

---

## TÓM TẮT

### **Tổng số test case FAIL**: ~25-30 test case

| Nhóm lỗi | Số lượng TC | Mức độ nghiêm trọng |
|----------|-------------|---------------------|
| Export Excel | ~5-6 TC | 🔴 Nghiêm trọng |
| Quản lý khu vực bàn | ~5-6 TC | 🔴 Nghiêm trọng |
| Lịch sử đơn hàng | ~5-6 TC | 🔴 Nghiêm trọng |
| Thống kê doanh thu | ~5-6 TC | 🔴 Nghiêm trọng |
| Phân trang | ~3-4 TC | 🟡 Trung bình |
| Các chức năng khác | 0 TC | 🟢 OK |

### **Nguyên nhân chính:**

1. **Thiếu chức năng Export Excel** - Không có API và UI
2. **Thiếu trường `area` trong database** - CafeTable entity không có area/zone
3. **Thiếu API endpoint cho order history** - Không có endpoint để lấy đơn hàng theo bàn
4. **Thiếu API endpoint cho revenue statistics** - Không có endpoint để lấy thống kê doanh thu
5. **Không có pagination** - Load tất cả bàn một lúc

### **Khuyến nghị:**

1. ⚠️ **Cần implement**: Thêm chức năng export Excel cho danh sách bàn
2. ⚠️ **Cần implement**: Thêm trường `area` vào CafeTable entity và DTO
3. ⚠️ **Cần implement**: Thêm API endpoint `/tables/{id}/orders` để lấy lịch sử đơn hàng
4. ⚠️ **Cần implement**: Thêm API endpoint `/tables/{id}/statistics` để lấy thống kê doanh thu
5. ⚠️ **Nên cải thiện**: Thêm pagination cho danh sách bàn (nếu có nhiều bàn)

---

## CHI TIẾT CÁC TEST CASE FAIL

### **TC_TABLE_20**: Sửa khu vực bàn
- **Expected**: "Cập nhật khu vực bàn thành công"
- **Actual**: ❌ FAIL
- **Lý do**: CafeTable entity không có trường area, không thể lưu

### **TC_TABLE_30**: Xuất danh sách bàn ra Excel
- **Expected**: "Tải xuống file .xlsx chứa danh sách bàn"
- **Actual**: ❌ FAIL
- **Lý do**: Không có chức năng export Excel

### **TC_TABLE_40**: Xem lịch sử đơn hàng của bàn
- **Expected**: "Hiển thị thông tin chi tiết tất cả đơn hàng từng phục vụ tại bàn"
- **Actual**: ❌ FAIL
- **Lý do**: Không có API endpoint và UI

### **TC_TABLE_50**: Xem thống kê doanh thu theo bàn
- **Expected**: "Hiển thị thống kê doanh thu theo bàn"
- **Actual**: ❌ FAIL
- **Lý do**: Không có API endpoint và UI

### **TC_TABLE_15**: Phân trang danh sách bàn
- **Expected**: "Hiển thị 10 bàn/trang"
- **Actual**: ⚠️ CÓ THỂ FAIL
- **Lý do**: Không có pagination, load tất cả một lúc

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác, cần chạy test thực tế với database và API.

