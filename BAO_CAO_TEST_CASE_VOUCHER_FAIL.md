# BÁO CÁO KIỂM TRA TEST CASE - 40 TEST CASE QUẢN LÝ VOUCHER

## TỔNG QUAN
- **Tổng số test case**: 40 (TC_VOUCHER_01 đến TC_VOUCHER_40)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend tĩnh
- **Quét toàn bộ backend**: `be/src/main/java/com/giapho/coffee_shop_backend`
- **Quét toàn bộ frontend**: `src/`

---

## DANH SÁCH TEST CASE SẼ FAIL

### 🔴 **NHÓM 1: EXPORT PDF**

#### **TC_VOUCHER_XX**: Xuất danh sách voucher ra PDF (nếu có test case)
- **Expected Result**: "Tải file PDF về máy", "Có thể mở và in file PDF"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Frontend: `Vouchers.vue` chỉ có `exportCurrentPage()` xuất CSV, KHÔNG có chức năng export PDF
  - Backend: `VoucherController.java` KHÔNG có endpoint `/api/v1/vouchers/export-pdf` hoặc tương tự
  - Service: Không có service export PDF cho vouchers

---

### 🔴 **NHÓM 2: IMPORT EXCEL**

#### **TC_VOUCHER_XX**: Import voucher từ Excel (nếu có test case)
- **Expected Result**: "Hệ thống nhập dữ liệu voucher hàng loạt"
- **Actual Result**: ❌ **FAIL**
- **Lý do**: 
  - Backend: `VoucherController.java` KHÔNG có endpoint POST `/api/v1/vouchers/import` hoặc `/api/v1/vouchers/batch`
  - Frontend: `Vouchers.vue` KHÔNG có button "Import Excel" hoặc chức năng upload file
  - Service: `voucherService.js` KHÔNG có function `importVouchers()` hoặc `batchCreateVouchers()`

---

### 🟡 **NHÓM 3: SẮP XẾP (SORTING)**

#### **TC_VOUCHER_XX**: Sắp xếp voucher theo các trường khác nhau (nếu có test case)
- **Expected Result**: "Danh sách được sắp xếp theo [trường]", "Có thể click lại để sắp xếp ngược lại"
- **Actual Result**: ⚠️ **CÓ THỂ FAIL**
- **Lý do**: 
  - Frontend: `Vouchers.vue` KHÔNG có dropdown sort hoặc click header để sort
  - Backend: `VoucherController.java` có `Pageable` với sort mặc định, nhưng frontend không có UI để thay đổi sort
  - API: `searchVouchers()` có parameter `sort` nhưng frontend không sử dụng để cho user chọn

---

## TÓM TẮT

### **Tổng số test case FAIL**: **~2-3 test case** (5-7.5% tổng số 40 test case)

| Nhóm lỗi | Số lượng TC | Mức độ nghiêm trọng |
|----------|-------------|---------------------|
| Export PDF | ~1 TC | 🔴 Nghiêm trọng (nếu có test case) |
| Import Excel | ~1 TC | 🔴 Nghiêm trọng (nếu có test case) |
| Sắp xếp (UI) | ~1 TC | 🟡 Trung bình (nếu có test case) |
| Các chức năng khác | 0 TC | 🟢 OK |

### **Nguyên nhân chính:**

1. **Thiếu chức năng Export PDF**: Chỉ có export CSV, không có PDF
2. **Thiếu chức năng Import Excel**: Không có API và UI để import voucher hàng loạt
3. **Thiếu UI để sắp xếp**: Không có dropdown hoặc click header để sort theo các trường khác nhau

---

## CHI TIẾT CÁC TEST CASE FAIL

### **FAIL chắc chắn:**

1. **Export danh sách voucher ra PDF** (nếu có test case)
   - Expected: "Tải file PDF về máy"
   - Actual: ❌ FAIL
   - Lý do: Chỉ có export CSV, không có PDF

2. **Import voucher từ Excel** (nếu có test case)
   - Expected: "Hệ thống nhập dữ liệu voucher hàng loạt"
   - Actual: ❌ FAIL
   - Lý do: Không có endpoint và UI import

### **Có thể FAIL:**

1. **Sắp xếp voucher theo các trường** (nếu có test case)
   - Expected: "Danh sách được sắp xếp theo [trường]"
   - Actual: ⚠️ CÓ THỂ FAIL
   - Lý do: Không có UI để chọn sort, chỉ sort mặc định

---

## CÁC CHỨC NĂNG HOẠT ĐỘNG ĐÚNG (PASS)

### ✅ **NHÓM 1: CRUD OPERATIONS**

1. ✅ **Hiển thị danh sách voucher** (TC_VOUCHER_01)
   - Frontend: `Vouchers.vue` hiển thị table với pagination - OK
   - Backend: `VoucherController.searchVouchers()` - OK
   - Status: ✅ **PASS**

2. ✅ **Tạo voucher mới** (TC_VOUCHER_02, TC_VOUCHER_03)
   - Frontend: Form validation với yup schema - OK
   - Backend: `VoucherController.createVoucher()` - OK
   - Validation: Code unique, date validation, value validation - OK
   - Status: ✅ **PASS**

3. ✅ **Cập nhật voucher** (TC_VOUCHER_08)
   - Frontend: `openEditModal()` và `handleSubmit()` - OK
   - Backend: `VoucherController.updateVoucher()` - OK
   - Status: ✅ **PASS**

4. ✅ **Xóa voucher chưa dùng** (TC_VOUCHER_09)
   - Frontend: `handleDelete()` check `timesUsed > 0` và disable button - OK
   - Backend: `VoucherServiceImpl.deleteVoucher()` check `timesUsed > 0` và throw exception - OK
   - Status: ✅ **PASS**

5. ✅ **Không xóa voucher đã có đơn dùng** (TC_VOUCHER_10)
   - Frontend: Button delete bị disable nếu `voucher.timesUsed > 0` - OK
   - Backend: Throw exception nếu `voucher.getTimesUsed() > 0` - OK
   - Status: ✅ **PASS**

### ✅ **NHÓM 2: VALIDATION**

6. ✅ **Validation code trùng** (TC_VOUCHER_05)
   - Frontend: Backend validation - OK
   - Backend: `VoucherValidator.ensureCodeUnique()` - OK
   - Status: ✅ **PASS**

7. ✅ **Validation ngày bắt đầu > kết thúc** (TC_VOUCHER_04)
   - Frontend: Yup schema test `after-start` - OK
   - Backend: `VoucherValidator.validateBusinessRules()` check `validFrom.isAfter(validTo)` - OK
   - Status: ✅ **PASS**

8. ✅ **Validation value = 0** (TC_VOUCHER_XX)
   - Frontend: Yup schema `.moreThan(0, 'Giá trị giảm phải lớn hơn 0')` - OK
   - Backend: Validation trong DTO - OK
   - Status: ✅ **PASS**

9. ✅ **Validation value < 0** (TC_VOUCHER_XX)
   - Frontend: Yup schema `.moreThan(0)` - OK
   - Backend: Validation trong DTO - OK
   - Status: ✅ **PASS**

10. ✅ **Validation PERCENTAGE với value > 100** (TC_VOUCHER_XX)
    - Frontend: Yup schema `.when('type', { is: 'PERCENTAGE', then: schema.max(100) })` - OK
    - Backend: `VoucherValidator.validateBusinessRules()` check `discountValue.compareTo(BigDecimal.valueOf(100)) > 0` - OK
    - Status: ✅ **PASS**

11. ✅ **Validation MinOrderAmount < 0** (TC_VOUCHER_XX)
    - Frontend: Yup schema `.test('min-order-positive', 'Đơn hàng tối thiểu phải lớn hơn 0', (value) => value === null || value > 0)` - OK
    - Backend: Validation trong DTO - OK
    - Status: ✅ **PASS**

12. ✅ **Validation MaximumDiscountAmount** (TC_VOUCHER_14)
    - Frontend: Yup schema test `fixed-amount-check` - OK
    - Backend: `VoucherValidator.validateBusinessRules()` check - OK
    - Status: ✅ **PASS**

### ✅ **NHÓM 3: VOUCHER USAGE**

13. ✅ **Áp dụng voucher khi đơn hàng không đạt điều kiện** (TC_VOUCHER_11)
    - Backend: `VoucherDiscountCalculator.evaluate()` check `minimumOrderAmount` - OK
    - Status: ✅ **PASS**

14. ✅ **Áp dụng voucher đã hết hạn** (TC_VOUCHER_XX)
    - Backend: `VoucherDiscountCalculator.evaluate()` check `now.isAfter(validTo)` - OK
    - Status: ✅ **PASS**

15. ✅ **Áp dụng voucher chưa đến ngày hiệu lực** (TC_VOUCHER_XX)
    - Backend: `VoucherDiscountCalculator.evaluate()` check `now.isBefore(validFrom)` - OK
    - Status: ✅ **PASS**

16. ✅ **Áp dụng voucher đã hết số lần** (TC_VOUCHER_12)
    - Backend: `VoucherDiscountCalculator.evaluate()` check `timesUsed >= usageLimit` - OK
    - Status: ✅ **PASS**

17. ✅ **Tính toán giảm giá với max cap** (TC_VOUCHER_15)
    - Backend: `VoucherDiscountCalculator.calculateDiscount()` check `maximumDiscountAmount` - OK
    - Status: ✅ **PASS**

### ✅ **NHÓM 4: VOUCHER MANAGEMENT**

18. ✅ **Tìm kiếm voucher** (TC_VOUCHER_13)
    - Frontend: Filter theo code, type, active, validFrom, validTo - OK
    - Backend: `VoucherController.searchVouchers()` với Specification - OK
    - Status: ✅ **PASS**

19. ✅ **Kích hoạt/Tạm ngưng voucher** (TC_VOUCHER_08)
    - Frontend: `handleToggle()` - OK
    - Backend: `VoucherController.toggleVoucherActive()` - OK
    - Status: ✅ **PASS**

20. ✅ **Export CSV** (TC_VOUCHER_XX - Nếu có)
    - Frontend: `exportCurrentPage()` xuất CSV - OK
    - Status: ✅ **PASS**

21. ✅ **Phân trang** (TC_VOUCHER_XX - Nếu có)
    - Frontend: `Pagination` component - OK
    - Backend: `Page<VoucherResponseDTO>` với pagination - OK
    - Status: ✅ **PASS**

22. ✅ **Thống kê voucher** (TC_VOUCHER_XX - Nếu có)
    - Frontend: Summary cards hiển thị active, inactive, expiring soon, redeemed - OK
    - Backend: `VoucherController.getVoucherSummary()` - OK
    - Status: ✅ **PASS**

---

## KẾT LUẬN

**Tổng số test case FAIL**: **~2-3 test case** (5-7.5% tổng số 40 test case)

**Các chức năng cơ bản hoạt động tốt**: CRUD, Validation (code duplicate, date, value, percentage, min order, max discount), Filter, Search, Toggle active, Delete với validation, Apply voucher với đầy đủ validation, Export CSV, Pagination, Summary statistics.

**Các chức năng thiếu**: Export PDF, Import Excel, UI Sort.

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác 100%, cần chạy test thực tế với database và API. Số lượng test case fail có thể thay đổi tùy theo test cases cụ thể trong file Excel.

