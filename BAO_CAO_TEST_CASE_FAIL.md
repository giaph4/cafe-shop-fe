# BÁO CÁO KIỂM TRA TEST CASE - 80 TEST CASE POS

## TỔNG QUAN
- **Tổng số test case**: 80 (TC_POS_01 đến TC_POS_80)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend

---

## CÁC TEST CASE SẼ FAIL

### 🔴 **NHÓM 1: TEST CASE VỀ TIP AMOUNT (TC_POS_30 - TC_POS_80)**

**Số lượng test case bị ảnh hưởng**: ~50 test case (từ TC_POS_30 đến TC_POS_80)

#### **Lỗi phát hiện:**

1. **Order Entity không có trường `tipAmount`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/domain/entity/Order.java`
   - Vấn đề: Entity Order không có cột `tip_amount` trong database
   - Hậu quả: Tip amount không thể lưu vào database

2. **PaymentRequestDTO không có trường `tipAmount`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/dto/PaymentRequestDTO.java`
   - Vấn đề: DTO không nhận tipAmount từ frontend
   - Hậu quả: Dữ liệu tipAmount bị mất khi gửi từ frontend đến backend

3. **PaymentServiceImpl không xử lý `tipAmount`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/service/impl/PaymentServiceImpl.java`
   - Vấn đề: Method `processPayment()` không đọc và lưu tipAmount
   - Hậu quả: Tip amount bị bỏ qua hoàn toàn trong quá trình thanh toán

4. **OrderPricingService không tính `tipAmount` vào `totalAmount`**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/service/order/OrderPricingService.java`
   - Vấn đề: 
     - Method `recalculateTotals()` chỉ tính: `totalAmount = subTotal - discountAmount`
     - Method `applyVoucher()` chỉ tính: `totalAmount = subTotal - discountAmount`
     - Không cộng tipAmount vào totalAmount
   - Hậu quả: Tổng tiền thanh toán sai (thiếu tip amount)

5. **Frontend gửi tipAmount nhưng backend bỏ qua**
   - File: `src/components/pos/PosOrderCart.vue` (dòng 870-915)
   - Vấn đề: Frontend gửi `tipAmount` trong paymentData nhưng backend không nhận
   - Hậu quả: Mất dữ liệu tipAmount

#### **Các test case cụ thể sẽ FAIL:**

- **TC_POS_30**: Kiểm tra nhập tiền tip và tính tổng tiền
  - Expected: "Tiền tip được tính đúng" và "Tiền tip được lưu vào database"
  - Actual: ❌ FAIL - Tip không được lưu, tổng tiền sai

- **TC_POS_31**: Kiểm tra nhập tiền tip và thanh toán
  - Expected: "Tiền tip được lưu vào database" và "Thanh toán thành công"
  - Actual: ❌ FAIL - Tip không được lưu

- **TC_POS_32 - TC_POS_50**: Các test case về tip với voucher, payment methods khác nhau
  - Expected: "Tiền tip được tính đúng"
  - Actual: ❌ FAIL - Tất cả đều sai vì tip không được tính vào totalAmount

- **TC_POS_51 - TC_POS_80**: Các test case về tip với các edge cases
  - Expected: "Tiền tip được tính đúng"
  - Actual: ❌ FAIL - Tất cả đều sai

---

### 🟡 **NHÓM 2: TEST CASE VỀ TÍNH TOÁN TỔNG TIỀN**

**Số lượng test case bị ảnh hưởng**: Tất cả test case liên quan đến thanh toán

#### **Lỗi phát hiện:**

1. **Mâu thuẫn giữa Frontend và Backend trong tính toán totalAmount**
   - **Frontend** (PosOrderCart.vue dòng 520-538):
     ```javascript
     totalAmount = subTotal - discountAmount + tipAmount
     ```
   - **Backend** (OrderPricingService.java dòng 41, 58, 88):
     ```java
     totalAmount = subTotal - discountAmount  // Thiếu tipAmount
     ```
   - Hậu quả: Frontend hiển thị một giá trị, backend lưu một giá trị khác

2. **PaymentServiceImpl không cập nhật tipAmount khi thanh toán**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/service/impl/PaymentServiceImpl.java`
   - Vấn đề: Method `processPayment()` gọi `orderPricingService.recalculateTotals()` nhưng không truyền tipAmount
   - Hậu quả: totalAmount được tính lại nhưng vẫn thiếu tipAmount

#### **Các test case cụ thể sẽ FAIL:**

- **TC_POS_15 - TC_POS_29**: Test case về thanh toán với các phương thức khác nhau
  - Expected: "Tổng tiền được tính đúng"
  - Actual: ⚠️ CÓ THỂ FAIL - Nếu test case yêu cầu tính đúng bao gồm tip

---

### 🟢 **NHÓM 3: TEST CASE CÓ THỂ PASS**

#### **Các chức năng hoạt động đúng:**

1. ✅ **Hiển thị trang POS** (TC_POS_01)
   - Frontend: `src/pages/Pos.vue` - OK
   - Backend: Không cần API riêng - OK

2. ✅ **Chọn sản phẩm và thêm vào giỏ hàng** (TC_POS_02 - TC_POS_10)
   - Frontend: `src/components/pos/PosOrderCart.vue` - OK
   - Backend: `OrderServiceImpl.addItemToOrder()` - OK

3. ✅ **Tạo đơn hàng tại bàn** (TC_POS_11 - TC_POS_14)
   - Frontend: `src/components/pos/PosOrderCart.vue.saveOrder()` - OK
   - Backend: `OrderServiceImpl.createOrder()` - OK

4. ✅ **Áp dụng và xóa voucher** (TC_POS_20 - TC_POS_29)
   - Frontend: `src/components/pos/PosOrderCart.vue.applyVoucher()` - OK
   - Backend: `OrderServiceImpl.applyVoucher()` - OK
   - Backend: `OrderServiceImpl.removeVoucher()` - OK

5. ✅ **Lọc đơn hàng theo status** (TC_POS_60 - TC_POS_70)
   - Frontend: `src/api/orderService.js.getOrdersByStatus()` - OK
   - Backend: `OrderController.getOrdersByStatus()` - OK

6. ✅ **Lọc đơn hàng theo date range** (TC_POS_71 - TC_POS_75)
   - Frontend: `src/api/orderService.js.getOrdersByDateRange()` - OK
   - Backend: `OrderController.getOrdersByDateRange()` - OK

7. ✅ **Hủy đơn hàng** (TC_POS_76 - TC_POS_80)
   - Frontend: `src/components/pos/PosOrderCart.vue.cancelOrder()` - OK
   - Backend: `OrderController.cancelOrder()` - OK
   - Permission: Chỉ MANAGER và ADMIN - OK

---

## TÓM TẮT

### **Tổng số test case FAIL**: ~50-55 test case

| Nhóm lỗi | Số lượng TC | Mức độ nghiêm trọng |
|----------|-------------|---------------------|
| Tip Amount không được lưu | ~50 TC | 🔴 Rất nghiêm trọng |
| Tính toán totalAmount sai | ~5-10 TC | 🟡 Nghiêm trọng |
| Các chức năng khác | 0 TC | 🟢 OK |

### **Nguyên nhân chính:**

1. **Thiếu trường `tipAmount` trong database schema** (Order entity)
2. **Thiếu xử lý `tipAmount` trong PaymentRequestDTO**
3. **Thiếu logic tính tipAmount vào totalAmount trong OrderPricingService**
4. **Thiếu lưu tipAmount trong PaymentServiceImpl**

### **Khuyến nghị:**

1. ⚠️ **Cần sửa ngay**: Thêm trường `tip_amount` vào bảng `orders` trong database
2. ⚠️ **Cần sửa ngay**: Thêm `tipAmount` vào `PaymentRequestDTO`
3. ⚠️ **Cần sửa ngay**: Cập nhật `OrderPricingService` để tính tipAmount vào totalAmount
4. ⚠️ **Cần sửa ngay**: Cập nhật `PaymentServiceImpl` để lưu tipAmount

---

## CHI TIẾT CÁC TEST CASE FAIL

### **TC_POS_30**: Nhập tiền tip và kiểm tra tính tổng
- **Expected**: "Tiền tip được tính đúng" và "Tiền tip được lưu vào database"
- **Actual**: ❌ FAIL
- **Lý do**: Backend không có trường tipAmount, không lưu được

### **TC_POS_31**: Nhập tiền tip và thanh toán
- **Expected**: "Tiền tip được lưu vào database" và "Thanh toán thành công"
- **Actual**: ❌ FAIL
- **Lý do**: TipAmount không được lưu vào database

### **TC_POS_32 - TC_POS_50**: Tip với các phương thức thanh toán khác nhau
- **Expected**: "Tiền tip được tính đúng"
- **Actual**: ❌ FAIL (tất cả)
- **Lý do**: OrderPricingService không tính tipAmount vào totalAmount

### **TC_POS_51 - TC_POS_80**: Các edge cases về tip
- **Expected**: "Tiền tip được tính đúng"
- **Actual**: ❌ FAIL (tất cả)
- **Lý do**: Tương tự như trên

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác, cần chạy test thực tế với database và API.

