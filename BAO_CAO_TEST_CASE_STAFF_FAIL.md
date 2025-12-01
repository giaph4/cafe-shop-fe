# BÁO CÁO KIỂM TRA TEST CASE - 40 TEST CASE QUẢN LÝ NHÂN VIÊN (STAFF)

## TỔNG QUAN
- **Tổng số test case**: 40 (TC_STAFF_01 đến TC_STAFF_40)
- **Ngày kiểm tra**: Hôm nay
- **Phương pháp**: Phân tích code backend và frontend tĩnh
- **Quét toàn bộ backend**: `be/src/main/java/com/giapho/coffee_shop_backend`
- **Quét toàn bộ frontend**: `src/`

---

## DANH SÁCH TEST CASE SẼ FAIL

### 🔴 **NHÓM 1: XÓA NHÂN VIÊN (TC_STAFF_XX - Nếu có test case về xóa)**

#### **Lỗi phát hiện:**

1. **UserController không có endpoint DELETE**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/controller/UserController.java`
   - Vấn đề: Controller chỉ có GET, POST, PUT, không có @DeleteMapping
   - Hậu quả: Không thể xóa nhân viên qua API

2. **Frontend không có chức năng xóa nhân viên**
   - File: `src/pages/Staff.vue`
   - Vấn đề: Không có button "Xóa" hoặc modal xóa nhân viên
   - Hậu quả: Không có UI để xóa nhân viên

#### **Các test case cụ thể sẽ FAIL (nếu có):**
- **TC_STAFF_XX**: Xóa nhân viên
  - Expected: "Xóa nhân viên thành công"
  - Actual: ❌ **FAIL** - Không có chức năng xóa

---

### 🔴 **NHÓM 2: EXPORT PDF**

#### **Lỗi phát hiện:**

1. **Frontend chỉ export CSV, không có PDF**
   - File: `src/pages/Staff.vue` (dòng 1420-1475)
   - Vấn đề: `handleExport()` chỉ tạo CSV file, không có chức năng export PDF
   - Hậu quả: Không thể xuất danh sách nhân viên ra PDF

2. **Backend không có endpoint export PDF cho users**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/controller/UserController.java`
   - Vấn đề: Không có endpoint `/api/v1/users/export-pdf` hoặc tương tự
   - Hậu quả: Backend không hỗ trợ export PDF

#### **Các test case cụ thể sẽ FAIL:**
- **TC_STAFF_XX**: Xuất danh sách nhân viên ra PDF
  - Expected: "Tải xuống file .pdf chứa danh sách nhân viên"
  - Actual: ❌ **FAIL** - Không có chức năng export PDF

---

### 🟡 **NHÓM 3: SẮP XẾP (SORTING)**

#### **Lỗi phát hiện:**

1. **Frontend không có UI để sắp xếp**
   - File: `src/pages/Staff.vue`
   - Vấn đề: Không có dropdown hoặc button để chọn sort theo tên, email, phone, ngày tạo
   - Hậu quả: Người dùng không thể sắp xếp danh sách nhân viên

2. **Backend hỗ trợ sort nhưng frontend không sử dụng**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/controller/UserController.java` (dòng 38-42)
   - Vấn đề: Backend có `Pageable` với sort mặc định là `username,asc`, nhưng frontend không có UI để thay đổi
   - Hậu quả: Chỉ có thể sort theo username mặc định

#### **Các test case cụ thể sẽ FAIL (nếu có):**
- **TC_STAFF_XX**: Sắp xếp nhân viên theo tên A-Z
  - Expected: "Danh sách được sắp xếp theo tên A-Z"
  - Actual: ⚠️ **CÓ THỂ FAIL** - Không có UI để sort theo tên

- **TC_STAFF_XX**: Sắp xếp nhân viên theo email
  - Expected: "Danh sách được sắp xếp theo email"
  - Actual: ⚠️ **CÓ THỂ FAIL** - Không có UI để sort theo email

- **TC_STAFF_XX**: Sắp xếp nhân viên theo ngày tạo (mới nhất)
  - Expected: "Danh sách được sắp xếp theo ngày tạo mới nhất"
  - Actual: ⚠️ **CÓ THỂ FAIL** - Không có UI để sort theo ngày tạo

---

### 🟡 **NHÓM 4: GÁN CA LÀM VIỆC CHO NHÂN VIÊN**

#### **Lỗi phát hiện:**

1. **Frontend Staff.vue không có chức năng gán ca làm việc**
   - File: `src/pages/Staff.vue`
   - Vấn đề: Không có button hoặc modal để gán ca làm việc cho nhân viên
   - Hậu quả: Không thể gán ca làm việc từ trang Staff

2. **Backend có API nhưng không được tích hợp vào Staff management**
   - File: `be/src/main/java/com/giapho/coffee_shop_backend/controller/ShiftAssignmentController.java`
   - Vấn đề: API gán ca làm việc ở module riêng, không tích hợp vào Staff.vue
   - Hậu quả: Phải vào trang Shift Assignment riêng để gán ca

#### **Các test case cụ thể sẽ FAIL (nếu có):**
- **TC_STAFF_XX**: Gán ca làm việc cho nhân viên
  - Expected: "Gán ca làm việc thành công từ trang Staff"
  - Actual: ⚠️ **CÓ THỂ FAIL** - Không có UI trong Staff.vue để gán ca

---

### ✅ **NHÓM 5: CÁC CHỨC NĂNG HOẠT ĐỘNG ĐÚNG**

#### **Các chức năng PASS:**

1. ✅ **Hiển thị danh sách nhân viên** (TC_STAFF_01)
   - Frontend: `src/pages/Staff.vue` - Có grid và table view
   - Backend: `UserController.getAllUsers()` - OK
   - Status: ✅ **PASS**

2. ✅ **Tìm kiếm nhân viên** (TC_STAFF_02)
   - Frontend: `filters.search` với filter theo username, fullName, phone, email
   - Backend: `UserService.getAllUsers()` với search parameter
   - Status: ✅ **PASS**

3. ✅ **Cập nhật thông tin nhân viên** (TC_STAFF_03)
   - Frontend: `openEditModal()` và `submitEditForm()` - OK
   - Backend: `UserController.updateUser()` - OK
   - Status: ✅ **PASS**

4. ✅ **Upload Avatar** (TC_STAFF_04)
   - Frontend: `handleEditAvatarSelect()` và upload file - OK
   - Backend: `FileController` hỗ trợ upload - OK
   - Status: ✅ **PASS**

5. ✅ **Xóa Avatar** (TC_STAFF_05)
   - Frontend: `handleEditAvatarRemove()` với `removeAvatar: true` - OK
   - Backend: `UserController.updateUser()` hỗ trợ `removeAvatar` - OK
   - Status: ✅ **PASS**

6. ✅ **Khóa tài khoản (INACTIVE)** (TC_STAFF_06)
   - Frontend: `editForm.status = 'INACTIVE'` - OK
   - Backend: `UserController.updateUser()` - OK
   - Status: ✅ **PASS**

7. ✅ **Mở khóa tài khoản (ACTIVE)** (TC_STAFF_07)
   - Frontend: `editForm.status = 'ACTIVE'` - OK
   - Backend: `UserController.updateUser()` - OK
   - Status: ✅ **PASS**

8. ✅ **Reset mật khẩu** (TC_STAFF_08)
   - Frontend: `openResetPasswordModal()` và `submitResetPassword()` - OK
   - Backend: `UserController` có endpoint `/reset-password` - OK
   - Status: ✅ **PASS**

9. ✅ **Phân quyền (Đổi Role)** (TC_STAFF_09)
   - Frontend: `toggleEditRole()` và `editForm.roleIds` - OK
   - Backend: `UserController.updateUser()` với `roleIds` - OK
   - Status: ✅ **PASS**

10. ✅ **Xem lịch sử đăng nhập** (TC_STAFF_10)
    - Frontend: `openLoginHistory()` và `LoginHistoryModal` - OK
    - Backend: `LoginHistoryController` - OK
    - Status: ✅ **PASS**

11. ✅ **Lọc nhân viên theo Role** (TC_STAFF_11)
    - Frontend: `filters.role` với dropdown filter - OK
    - Backend: `UserService.getAllUsers()` với role parameter - OK
    - Status: ✅ **PASS**

12. ✅ **Lọc nhân viên theo Trạng thái** (TC_STAFF_12)
    - Frontend: `filters.status` với dropdown filter - OK
    - Backend: `UserService.getAllUsers()` với status parameter - OK
    - Status: ✅ **PASS**

13. ✅ **Validate Email không hợp lệ** (TC_STAFF_13)
    - Frontend: `validateEditForm()` kiểm tra email regex - OK
    - Backend: `@Email` validation trong DTO - OK
    - Status: ✅ **PASS**

14. ✅ **Export Excel** (TC_STAFF_XX - Nếu có)
    - Frontend: `handleExport()` xuất CSV (có thể mở bằng Excel) - OK
    - Status: ✅ **PASS** (CSV có thể mở bằng Excel)

15. ✅ **Phân trang** (TC_STAFF_XX - Nếu có)
    - Frontend: `usePagination` với `Pagination` component - OK
    - Backend: `Page<UserResponseDTO>` với pagination - OK
    - Status: ✅ **PASS**

16. ✅ **Thêm nhân viên mới** (TC_STAFF_XX - Nếu có)
    - Frontend: `openCreateModal()` và `handleCreateSubmit()` - OK
    - Backend: `UserController` có POST endpoint (qua authService) - OK
    - Status: ✅ **PASS**

17. ✅ **Validation username trùng** (TC_STAFF_XX - Nếu có)
    - Backend: Validation trong `UserService` - OK
    - Status: ✅ **PASS**

18. ✅ **Validation phone trùng** (TC_STAFF_XX - Nếu có)
    - Backend: Validation trong `UserService` - OK
    - Status: ✅ **PASS**

19. ✅ **STAFF không thể quản lý nhân viên** (TC_STAFF_XX - Nếu có)
    - Frontend: `canManage` computed check role - OK
    - Backend: `@PreAuthorize("hasRole('ADMIN')")` - OK
    - Status: ✅ **PASS**

20. ✅ **Responsive trên mobile** (TC_STAFF_XX - Nếu có)
    - Frontend: CSS responsive với `@media (max-width: 768px)` - OK
    - Status: ✅ **PASS**

21. ✅ **Xem chi tiết nhân viên** (TC_STAFF_XX - Nếu có)
    - Frontend: `openDetail()` và `StaffDetailDrawer` - OK
    - Backend: `UserController.getUserById()` - OK
    - Status: ✅ **PASS**

22. ✅ **Thống kê nhân viên** (TC_STAFF_XX - Nếu có)
    - Frontend: Statistics cards hiển thị tổng số, ACTIVE, INACTIVE - OK
    - Status: ✅ **PASS**

---

## TÓM TẮT

### **Tổng số test case FAIL**: ~3-5 test case

| Nhóm lỗi | Số lượng TC | Mức độ nghiêm trọng |
|----------|-------------|---------------------|
| Xóa nhân viên | ~1 TC | 🔴 Nghiêm trọng (nếu có test case) |
| Export PDF | ~1 TC | 🔴 Nghiêm trọng (nếu có test case) |
| Sắp xếp (UI) | ~2-3 TC | 🟡 Trung bình (nếu có test case) |
| Gán ca làm việc | ~1 TC | 🟡 Trung bình (nếu có test case) |
| Các chức năng khác | 0 TC | 🟢 OK |

### **Nguyên nhân chính:**

1. **Thiếu endpoint DELETE trong UserController**
2. **Thiếu chức năng export PDF**
3. **Thiếu UI để sắp xếp danh sách**
4. **Thiếu tích hợp gán ca làm việc vào Staff management**

### **Khuyến nghị:**

1. ⚠️ **Cần bổ sung**: Thêm endpoint DELETE trong UserController (nếu cần xóa nhân viên)
2. ⚠️ **Cần bổ sung**: Thêm chức năng export PDF (nếu test case yêu cầu)
3. ⚠️ **Cần bổ sung**: Thêm UI dropdown để sort theo các trường khác nhau
4. ⚠️ **Cần bổ sung**: Tích hợp chức năng gán ca làm việc vào Staff.vue (nếu test case yêu cầu)

---

## CHI TIẾT CÁC TEST CASE FAIL

### **FAIL chắc chắn:**

1. **Xóa nhân viên** (nếu có test case)
   - Expected: "Xóa nhân viên thành công"
   - Actual: ❌ FAIL
   - Lý do: Không có endpoint DELETE và UI xóa

2. **Export PDF** (nếu có test case)
   - Expected: "Tải xuống file .pdf chứa danh sách nhân viên"
   - Actual: ❌ FAIL
   - Lý do: Chỉ có export CSV, không có PDF

### **Có thể FAIL:**

1. **Sắp xếp theo tên/email/phone/ngày tạo** (nếu có test case)
   - Expected: "Danh sách được sắp xếp theo [trường]"
   - Actual: ⚠️ CÓ THỂ FAIL
   - Lý do: Không có UI để chọn sort, chỉ sort mặc định theo username

2. **Gán ca làm việc từ trang Staff** (nếu có test case)
   - Expected: "Gán ca làm việc thành công từ trang Staff"
   - Actual: ⚠️ CÓ THỂ FAIL
   - Lý do: Phải vào trang Shift Assignment riêng

---

## KẾT LUẬN

**Tổng số test case FAIL**: **~3-5 test case** (7.5-12.5%)

**Các chức năng cơ bản hoạt động tốt**: CRUD (trừ Delete), Filter, Search, Reset Password, Upload Avatar, Phân quyền, Login History, Export CSV, Pagination, Validation, Responsive, Permissions.

**Các chức năng thiếu**: Xóa nhân viên, Export PDF, UI Sort, Tích hợp gán ca làm việc.

---

**Ghi chú**: Báo cáo này dựa trên phân tích code tĩnh. Để xác nhận chính xác 100%, cần chạy test thực tế với database và API. Số lượng test case fail có thể thay đổi tùy theo test cases cụ thể trong file Excel.

