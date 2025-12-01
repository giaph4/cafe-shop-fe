# BÁO CÁO KIỂM TRA TEST CASE - 25 TEST CASE QUẢN LÝ KHO (INVENTORY)

## TỔNG QUAN
- **Tổng số test case**: 25 (TC_INVENTO_01 đến TC_INVENTO_25)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend tĩnh
- **Quét toàn bộ backend**: `be/src/main/java/com/giapho/coffee_shop_backend`
- **Quét toàn bộ frontend**: `src/`

---

## DANH SÁCH TEST CASE SẼ FAIL

### 🔴 **NHÓM 1: EXPORT EXCEL/PDF**

#### **TC_INVENTO_18**: Kiểm tra xuất danh sách nguyên liệu ra Excel
- **Expected Result**: "Tải file Excel về máy", "Có thể mở và chỉnh sửa file Excel"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có button "Xuất Excel" hoặc chức năng export
  - Backend: `IngredientController.java` KHÔNG có endpoint `/api/v1/ingredients/export-excel` hoặc tương tự
  - Service: Không có service export Excel cho ingredients

#### **TC_INVENTO_25**: Kiểm tra export danh sách nguyên liệu ra PDF
- **Expected Result**: "Tải file PDF về máy", "Có thể mở và in file PDF"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có button "Xuất PDF" hoặc chức năng export PDF
  - Backend: `IngredientController.java` KHÔNG có endpoint `/api/v1/ingredients/export-pdf` hoặc tương tự
  - Service: Không có service export PDF cho ingredients

---

### 🔴 **NHÓM 2: FILTER THEO SUPPLIER**

#### **TC_INVENTO_10**: Kiểm tra lọc nguyên liệu theo nhà cung cấp
- **Expected Result**: "Chỉ hiển thị các nguyên liệu của nhà cung cấp được chọn", "Có thể reset bộ lọc"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có dropdown filter theo supplier
  - Backend: `IngredientController.java` KHÔNG có parameter `supplierId` hoặc `supplier` trong `getAllIngredients()`
  - Entity: `Ingredient.java` KHÔNG có field `supplier` hoặc `supplierId` (chỉ có: id, name, unit, quantityOnHand, reorderLevel)
  - Repository: `IngredientRepository.java` KHÔNG có method `findBySupplierId()` hoặc tương tự

---

### 🔴 **NHÓM 3: FILTER THEO LOW STOCK**

#### **TC_INVENTO_11**: Kiểm tra lọc nguyên liệu theo số lượng tồn kho thấp
- **Expected Result**: "Chỉ hiển thị các nguyên liệu có số lượng tồn kho <= mức đặt lại", "Có thể reset bộ lọc"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có checkbox hoặc toggle "Chỉ hiển thị tồn kho thấp"
  - Backend: `IngredientController.java` KHÔNG có parameter `lowStock` hoặc `belowReorderLevel` trong `getAllIngredients()`
  - API: `getIngredients()` trong `ingredientService.js` KHÔNG có parameter `lowStock`
  - Mặc dù backend có method `findIngredientsBelowReorderLevel()` nhưng không được expose qua API filter

---

### 🟡 **NHÓM 4: SẮP XẾP (SORTING)**

#### **TC_INVENTO_16**: Kiểm tra sắp xếp nguyên liệu theo số lượng tồn kho
- **Expected Result**: "Danh sách được sắp xếp theo số lượng tồn kho tăng dần/giảm dần", "Có thể click lại để sắp xếp ngược lại"
- **Actual Result**: ⚠️ **CÓ THỂ FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có dropdown sort hoặc click header để sort
  - Backend: `IngredientController.java` có `Pageable` với sort mặc định `sort = "name"`, nhưng frontend không có UI để thay đổi sort
  - API: `getIngredients()` có thể truyền `sort` parameter nhưng frontend không sử dụng để cho user chọn
  - Không có UI để chọn sort theo `quantityOnHand`

---

### 🔴 **NHÓM 5: XEM CHI TIẾT NGUYÊN LIỆU**

#### **TC_INVENTO_13**: Kiểm tra xem chi tiết nguyên liệu
- **Expected Result**: "Hiển thị modal/trang chi tiết nguyên liệu", "Hiển thị đầy đủ thông tin: Tên, Đơn vị, Tồn kho, Mức đặt lại, Lịch sử điều chỉnh"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Ingredients.vue` KHÔNG có modal/drawer để xem chi tiết nguyên liệu
  - Frontend: KHÔNG có component `IngredientDetailModal.vue` hoặc tương tự
  - Frontend: Chỉ có button "Chỉnh sửa" và "Xóa", không có button "Xem chi tiết" hoặc click vào row để xem detail
  - Backend: Có endpoint `GET /api/v1/ingredients/{id}` nhưng frontend không sử dụng để hiển thị detail modal
  - Không có UI để xem lịch sử điều chỉnh tồn kho của nguyên liệu

---

### 🟡 **NHÓM 6: VALIDATION LÝ DO ĐIỀU CHỈNH**

#### **TC_INVENTO_15**: Kiểm tra validation khi điều chỉnh tồn kho không nhập lý do
- **Expected Result**: "Hiển thị thông báo lỗi 'Lý do điều chỉnh là bắt buộc'", "Không cho phép điều chỉnh"
- **Actual Result**: ⚠️ **CÓ THỂ FAIL**
- **Lý do**: 
  - Frontend: `adjustSchema` trong `Ingredients.vue` line 471-477: `reason` là `nullable()` và `transform((value) => (value === '' ? null : value))` - KHÔNG có `.required()`
  - Backend: `InventoryAdjustmentRequestDTO.java` line 18: `reason` là `private String reason;` - KHÔNG có `@NotNull` annotation
  - Backend: `IngredientServiceImpl.java` line 126: `request.getReason()` được sử dụng nhưng không validate required
  - Nếu test case yêu cầu reason là bắt buộc thì sẽ FAIL

---

## TÓM TẮT

### **Tổng số test case FAIL**: **~6-7 test case** (24-28% tổng số 25 test case)

| Nhóm lỗi | Số lượng TC | Mức độ nghiêm trọng |
|----------|-------------|---------------------|
| Export Excel | 1 TC | 🔴 Nghiêm trọng |
| Export PDF | 1 TC | 🔴 Nghiêm trọng |
| Filter theo Supplier | 1 TC | 🔴 Nghiêm trọng |
| Filter theo Low Stock | 1 TC | 🔴 Nghiêm trọng |
| Sort theo Quantity | 1 TC | 🟡 Trung bình |
| View Detail | 1 TC | 🔴 Nghiêm trọng |
| Validation Reason Required | 1 TC | 🟡 Trung bình (nếu yêu cầu required) |

### **Nguyên nhân chính:**

1. **Thiếu chức năng Export**: Không có export Excel và PDF
2. **Thiếu filter theo Supplier**: Entity không có field supplier, không có API filter
3. **Thiếu filter theo Low Stock**: Không có UI và API parameter để filter
4. **Thiếu UI Sort**: Không có dropdown hoặc click header để sort
5. **Thiếu View Detail**: Không có modal/drawer để xem chi tiết nguyên liệu
6. **Validation Reason**: Reason không required (có thể là thiết kế, nhưng nếu test case yêu cầu required thì sẽ fail)

---

## CHI TIẾT CÁC TEST CASE FAIL

### **FAIL chắc chắn:**

1. **TC_INVENTO_10** - Lọc nguyên liệu theo nhà cung cấp
   - Expected: "Chỉ hiển thị các nguyên liệu của nhà cung cấp được chọn"
   - Actual: ❌ FAIL
   - Lý do: Entity không có field supplier, không có API filter

2. **TC_INVENTO_11** - Lọc nguyên liệu theo số lượng tồn kho thấp
   - Expected: "Chỉ hiển thị các nguyên liệu có số lượng tồn kho <= mức đặt lại"
   - Actual: ❌ FAIL
   - Lý do: Không có UI và API parameter để filter

3. **TC_INVENTO_13** - Xem chi tiết nguyên liệu
   - Expected: "Hiển thị modal/trang chi tiết nguyên liệu"
   - Actual: ❌ FAIL
   - Lý do: Không có modal/drawer để xem detail

4. **TC_INVENTO_18** - Xuất danh sách nguyên liệu ra Excel
   - Expected: "Tải file Excel về máy"
   - Actual: ❌ FAIL
   - Lý do: Chỉ có export CSV (nếu có), không có Excel

5. **TC_INVENTO_25** - Export danh sách nguyên liệu ra PDF
   - Expected: "Tải file PDF về máy"
   - Actual: ❌ FAIL
   - Lý do: Không có export PDF

### **Có thể FAIL:**

1. **TC_INVENTO_15** - Validation khi điều chỉnh tồn kho không nhập lý do
   - Expected: "Hiển thị thông báo lỗi 'Lý do điều chỉnh là bắt buộc'"
   - Actual: ⚠️ CÓ THỂ FAIL
   - Lý do: Reason không required trong validation schema

2. **TC_INVENTO_16** - Sắp xếp nguyên liệu theo số lượng tồn kho
   - Expected: "Danh sách được sắp xếp theo số lượng tồn kho"
   - Actual: ⚠️ CÓ THỂ FAIL
   - Lý do: Không có UI để chọn sort, chỉ sort mặc định theo name

---

## CÁC CHỨC NĂNG HOẠT ĐỘNG ĐÚNG (PASS)

### ✅ **NHÓM 1: CRUD OPERATIONS**

1. ✅ **Hiển thị danh sách nguyên liệu** (TC_INVENTO_01)
   - Frontend: `Ingredients.vue` hiển thị table với pagination - OK
   - Backend: `IngredientController.getAllIngredients()` - OK
   - Status: ✅ **PASS**

2. ✅ **Tạo nguyên liệu mới** (TC_INVENTO_02)
   - Frontend: Form validation với yup schema - OK
   - Backend: `IngredientController.createIngredient()` - OK
   - Validation: Name required, unit required - OK
   - Status: ✅ **PASS**

3. ✅ **Validation khi thêm nguyên liệu với tên trống** (TC_INVENTO_03)
   - Frontend: Yup schema `.required('Tên nguyên liệu là bắt buộc')` - OK
   - Backend: Validation trong DTO - OK
   - Status: ✅ **PASS**

4. ✅ **Sửa thông tin nguyên liệu** (TC_INVENTO_04)
   - Frontend: `openModal(ingredient)` và `handleSubmit()` - OK
   - Backend: `IngredientController.updateIngredientInfo()` - OK
   - Status: ✅ **PASS**

5. ✅ **Xóa nguyên liệu** (TC_INVENTO_05)
   - Frontend: `handleDelete()` và `handleDeleteConfirm()` - OK
   - Backend: `IngredientController.deleteIngredient()` - OK
   - Status: ✅ **PASS**

### ✅ **NHÓM 2: ĐIỀU CHỈNH TỒN KHO**

6. ✅ **Điều chỉnh tồn kho (tăng số lượng)** (TC_INVENTO_06)
   - Frontend: `openAdjustModal()` và `handleAdjustSubmit()` - OK
   - Backend: `IngredientController.adjustInventory()` - OK
   - Frontend: Hiển thị chênh lệch tăng (line 102-103) - OK
   - Status: ✅ **PASS**

7. ✅ **Điều chỉnh tồn kho (giảm số lượng)** (TC_INVENTO_07)
   - Frontend: `handleAdjustSubmit()` - OK
   - Backend: `IngredientServiceImpl.adjustInventory()` - OK
   - Frontend: Hiển thị chênh lệch giảm (line 105-106) - OK
   - Status: ✅ **PASS**

8. ✅ **Validation khi điều chỉnh tồn kho với số lượng < 0** (TC_INVENTO_08)
   - Frontend: Yup schema `.min(0, 'Số lượng không thể âm')` - OK
   - Backend: `@PositiveOrZero(message = "Quantity must be zero or positive")` - OK
   - Status: ✅ **PASS**

9. ✅ **Cảnh báo khi số lượng tồn kho thấp** (TC_INVENTO_09)
   - Frontend: `getStatusLabel()` và `getStatusBadge()` check `quantityOnHand <= reorderLevel` - OK
   - Frontend: Hiển thị badge "Thiếu hụt" với màu đỏ - OK
   - Frontend: `adjustConfirmData` có `willBeBelowReorder` và hiển thị alert (line 229-235) - OK
   - Backend: `IngredientRepository.findIngredientsBelowReorderLevel()` - OK
   - Status: ✅ **PASS**

10. ✅ **Điều chỉnh tồn kho với lý do** (TC_INVENTO_14)
    - Frontend: Form có field `reason` (line 114-118) - OK
    - Backend: `InventoryAdjustmentRequestDTO` có field `reason` - OK
    - Backend: `IngredientServiceImpl` lưu reason vào audit log - OK
    - Status: ✅ **PASS**

11. ✅ **Hiển thị chênh lệch khi điều chỉnh tồn kho** (TC_INVENTO_22)
    - Frontend: Hiển thị chênh lệch tăng/giảm/không đổi (line 101-110) - OK
    - Frontend: Modal xác nhận hiển thị chênh lệch (line 218-224) - OK
    - Status: ✅ **PASS**

12. ✅ **Điều chỉnh tồn kho với số lượng giảm (hiển thị chênh lệch âm)** (TC_INVENTO_23)
    - Frontend: Hiển thị chênh lệch âm với màu đỏ (line 105-106) - OK
    - Status: ✅ **PASS**

13. ✅ **Điều chỉnh tồn kho không thay đổi (số lượng giữ nguyên)** (TC_INVENTO_24)
    - Frontend: Hiển thị "Không thay đổi" (line 108-110) - OK
    - Status: ✅ **PASS**

14. ✅ **Validation khi điều chỉnh tồn kho với số lượng = 0** (TC_INVENTO_21)
    - Frontend: Yup schema `.min(0)` cho phép 0 - OK
    - Backend: `@PositiveOrZero` cho phép 0 - OK
    - Status: ✅ **PASS**

### ✅ **NHÓM 3: TÌM KIẾM VÀ PHÂN TRANG**

15. ✅ **Tìm kiếm nguyên liệu theo tên** (TC_INVENTO_12)
    - Frontend: Search input với debounce (line 296-299, 428-434) - OK
    - Backend: `IngredientController.getAllIngredients()` với parameter `name` - OK
    - Backend: `IngredientService.searchIngredientsByName()` - OK
    - Status: ✅ **PASS**

16. ✅ **Phân trang danh sách nguyên liệu** (TC_INVENTO_17)
    - Frontend: `Pagination` component (line 382) - OK
    - Backend: `Page<IngredientResponseDTO>` với pagination - OK
    - Frontend: `usePagination` composable - OK
    - Status: ✅ **PASS**

### ✅ **NHÓM 4: PHÂN QUYỀN**

17. ✅ **STAFF không thể quản lý kho** (TC_INVENTO_19)
    - Backend: `IngredientController` có `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")` - OK
    - Backend: Tất cả endpoints đều yêu cầu MANAGER hoặc ADMIN - OK
    - Frontend: Route guard sẽ chặn STAFF - OK
    - Status: ✅ **PASS**

### ✅ **NHÓM 5: RESPONSIVE**

18. ✅ **Responsive Quản lý Kho trên mobile** (TC_INVENTO_20)
    - Frontend: `@media (max-width: 768px)` trong style (line 964-983) - OK
    - Frontend: Responsive layout cho header, actions, buttons - OK
    - Status: ✅ **PASS**

---

## KẾT LUẬN

**Tổng số test case FAIL**: **~6-7 test case** (24-28% tổng số 25 test case)

**Các chức năng cơ bản hoạt động tốt**: CRUD (Create, Read, Update, Delete), Điều chỉnh tồn kho (tăng/giảm/không đổi), Validation (tên trống, số lượng < 0), Cảnh báo tồn kho thấp, Tìm kiếm theo tên, Phân trang, Phân quyền (STAFF không thể truy cập), Responsive, Hiển thị chênh lệch khi điều chỉnh.

**Các chức năng thiếu**: Export Excel, Export PDF, Filter theo Supplier, Filter theo Low Stock, UI Sort, View Detail, Validation Reason Required (nếu yêu cầu).

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác 100%, cần chạy test thực tế với database và API. Số lượng test case fail có thể thay đổi tùy theo test cases cụ thể trong file Excel.

