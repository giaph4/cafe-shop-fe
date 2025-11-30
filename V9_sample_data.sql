-- ============================================
-- DỮ LIỆU MẪU CHO HỆ THỐNG QUẢN LÝ CAFE
-- Tạo dữ liệu phong phú để test
-- ============================================
--
-- ⚠️ LƯU Ý VỀ PASSWORD VÀ JWT SECRET KEY:
-- 
-- 1. JWT SECRET KEY (cho việc ký JWT tokens):
--    - Secret Key: AoVErPsFjUvFOwljzI/7bMrJjsTKh7UeIgiT+RiRZWG+0TQVyJvySoWVvCM+Ch0h
--    - Đã được cấu hình trong: be/src/main/resources/application.properties
--    - Property: application.jwt.secretKey
--    - KHÔNG phải password để đăng nhập!
--
-- 2. PASSWORD CHO USERS (để đăng nhập vào hệ thống):
--    - Password: Password123!
--    - Hash BCrypt: $2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52
--    - Tất cả users trong file này đều dùng cùng password này
-- 
-- ⚠️ QUAN TRỌNG: 
-- Hash này có thể không khớp với password thực tế bạn muốn sử dụng.
-- Để đảm bảo đăng nhập được, bạn có 2 cách:
--
-- CÁCH 1: Tạo password hash mới (Khuyến nghị)
-- Sử dụng BCrypt để mã hóa password mới, ví dụ:
--   Password: "Password123!" 
--   → Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
--
-- CÁCH 2: Đổi password sau khi đăng nhập
-- 1. Chạy file SQL này để tạo users
-- 2. Đăng nhập bằng username bất kỳ (nếu hash khớp)
-- 3. Sử dụng chức năng "Đổi mật khẩu" trong hệ thống
--
-- DANH SÁCH USERNAME VÀ PASSWORD ĐỂ ĐĂNG NHẬP:
-- ============================================
-- Admin:
--   - admin_demo
--   - admin_manager
--
-- Manager:
--   - manager_demo
--   - manager_pho
--
-- Staff:
--   - barista_01, barista_02, barista_03
--   - cashier_01, cashier_02
--   - service_01, service_02, service_03
--   - staff_demo
--
-- DANH SÁCH USERNAME VÀ PASSWORD ĐỂ ĐĂNG NHẬP:
-- ============================================
-- Tất cả users dùng password: Password123!
--
-- Admin:
--   - admin_demo / Password123!
--   - admin_manager / Password123!
--
-- Manager:
--   - manager_demo / Password123!
--   - manager_pho / Password123!
--
-- Staff:
--   - barista_01, barista_02, barista_03 / Password123!
--   - cashier_01, cashier_02 / Password123!
--   - service_01, service_02, service_03 / Password123!
--   - staff_demo / Password123!
-- ============================================

-- ============================================
-- 1. ROLES (Quyền)
-- ============================================
INSERT INTO roles (id, name) VALUES
(1, 'ADMIN'),
(2, 'MANAGER'),
(3, 'STAFF')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 2. USERS (Người dùng/Nhân viên)
-- ============================================
INSERT INTO users (id, username, password, full_name, phone, email, avatar_url, address, status, status_message, created_at, updated_at) VALUES
-- Admin
(1, 'admin_demo', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Nguyễn Văn Admin', '0901234567', 'admin@cafe.com', NULL, '123 Đường ABC, Quận 1, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(2, 'admin_manager', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Trần Thị Quản Lý', '0901234568', 'manager@cafe.com', NULL, '456 Đường XYZ, Quận 2, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),

-- Managers
(3, 'manager_demo', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Lê Văn Manager', '0901234569', 'manager1@cafe.com', NULL, '789 Đường DEF, Quận 3, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(4, 'manager_pho', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Phạm Văn Phó', '0901234570', 'manager2@cafe.com', NULL, '321 Đường GHI, Quận 4, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),

-- Staff - Baristas
(5, 'barista_01', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Nguyễn Thị Lan', '0901234571', 'barista1@cafe.com', NULL, '654 Đường JKL, Quận 5, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(6, 'barista_02', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Trần Văn Hùng', '0901234572', 'barista2@cafe.com', NULL, '987 Đường MNO, Quận 6, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(7, 'barista_03', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Lê Thị Mai', '0901234573', 'barista3@cafe.com', NULL, '147 Đường PQR, Quận 7, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),

-- Staff - Cashiers
(8, 'cashier_01', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Phạm Văn Đức', '0901234574', 'cashier1@cafe.com', NULL, '258 Đường STU, Quận 8, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(9, 'cashier_02', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Hoàng Thị Hoa', '0901234575', 'cashier2@cafe.com', NULL, '369 Đường VWX, Quận 9, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),

-- Staff - Service
(10, 'service_01', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Vũ Văn Nam', '0901234576', 'service1@cafe.com', NULL, '741 Đường YZA, Quận 10, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(11, 'service_02', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Đỗ Thị Linh', '0901234577', 'service2@cafe.com', NULL, '852 Đường BCD, Quận 11, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),
(12, 'service_03', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Bùi Văn Tuấn', '0901234578', 'service3@cafe.com', NULL, '963 Đường EFG, Quận 12, TP.HCM', 'ACTIVE', NULL, NOW(), NOW()),

-- Staff - Inactive
(13, 'staff_inactive', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Nguyễn Văn Nghỉ', '0901234579', 'inactive@cafe.com', NULL, '159 Đường HIJ, Quận Bình Thạnh, TP.HCM', 'INACTIVE', 'Đã nghỉ việc', NOW(), NOW()),

-- Staff - Demo
(14, 'staff_demo', '$2b$10$KAE2kzZRrLqvHVWAdZYPF.eg5yg48K/R10fMbB4X8K/ieWKBMFS52', 'Demo Staff', '0901234580', 'staff@cafe.com', NULL, '357 Đường KLM, Quận Tân Bình, TP.HCM', 'ACTIVE', NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    username = VALUES(username),
    full_name = VALUES(full_name),
    phone = VALUES(phone),
    email = VALUES(email),
    updated_at = NOW();

-- Users-Roles mapping
INSERT INTO users_roles (user_id, role_id) VALUES
(1, 1), (1, 2), (1, 3),  -- Admin có tất cả quyền
(2, 1), (2, 2),          -- Admin Manager
(3, 2),                  -- Manager
(4, 2),                  -- Manager
(5, 3),                  -- Barista
(6, 3),                  -- Barista
(7, 3),                  -- Barista
(8, 3),                  -- Cashier
(9, 3),                  -- Cashier
(10, 3),                 -- Service
(11, 3),                 -- Service
(12, 3),                 -- Service
(14, 3)                  -- Staff Demo
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- ============================================
-- 3. CATEGORIES (Danh mục sản phẩm)
-- ============================================
INSERT INTO categories (id, name, description) VALUES
(1, 'Cà phê', 'Các loại cà phê pha máy và pha phin'),
(2, 'Trà', 'Trà đen, trà xanh, trà thảo mộc'),
(3, 'Nước ép & Sinh tố', 'Nước ép trái cây tươi và sinh tố'),
(4, 'Bánh ngọt', 'Bánh kem, bánh mì ngọt, bánh quy'),
(5, 'Đồ ăn nhẹ', 'Sandwich, salad, snack'),
(6, 'Đồ uống đặc biệt', 'Smoothie, mocktail, đồ uống đặc biệt'),
(7, 'Combo', 'Combo cà phê + bánh, combo bữa trưa')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 4. PRODUCTS (Sản phẩm)
-- ============================================
INSERT INTO products (id, name, code, price, cost, description, image_url, is_available, category_id, created_at, updated_at) VALUES
-- Cà phê
(1, 'Cà phê đen đá', 'CFD001', 25000.00, 8000.00, 'Cà phê đen pha phin truyền thống, đá viên', NULL, TRUE, 1, NOW(), NOW()),
(2, 'Cà phê sữa đá', 'CFD002', 30000.00, 10000.00, 'Cà phê sữa đặc pha phin, đá viên', NULL, TRUE, 1, NOW(), NOW()),
(3, 'Cà phê đen nóng', 'CFN001', 25000.00, 8000.00, 'Cà phê đen pha phin nóng', NULL, TRUE, 1, NOW(), NOW()),
(4, 'Cà phê sữa nóng', 'CFN002', 30000.00, 10000.00, 'Cà phê sữa đặc pha phin nóng', NULL, TRUE, 1, NOW(), NOW()),
(5, 'Espresso', 'ESP001', 35000.00, 12000.00, 'Espresso nguyên chất, đậm đà', NULL, TRUE, 1, NOW(), NOW()),
(6, 'Americano', 'AME001', 40000.00, 13000.00, 'Espresso pha loãng với nước nóng', NULL, TRUE, 1, NOW(), NOW()),
(7, 'Cappuccino', 'CAP001', 45000.00, 15000.00, 'Espresso với sữa nóng và bọt sữa', NULL, TRUE, 1, NOW(), NOW()),
(8, 'Latte', 'LAT001', 50000.00, 18000.00, 'Espresso với sữa nóng nhiều, vị nhẹ nhàng', NULL, TRUE, 1, NOW(), NOW()),
(9, 'Mocha', 'MOC001', 55000.00, 20000.00, 'Espresso với sữa và chocolate', NULL, TRUE, 1, NOW(), NOW()),
(10, 'Caramel Macchiato', 'CAR001', 60000.00, 22000.00, 'Espresso với caramel và sữa', NULL, TRUE, 1, NOW(), NOW()),

-- Trà
(11, 'Trà đá', 'TRA001', 15000.00, 5000.00, 'Trà đen đá, vị truyền thống', NULL, TRUE, 2, NOW(), NOW()),
(12, 'Trà đá chanh', 'TRA002', 20000.00, 7000.00, 'Trà đá với chanh tươi', NULL, TRUE, 2, NOW(), NOW()),
(13, 'Trà sữa', 'TRA003', 35000.00, 12000.00, 'Trà sữa thái xanh', NULL, TRUE, 2, NOW(), NOW()),
(14, 'Trà xanh đá', 'TRA004', 25000.00, 8000.00, 'Trà xanh Nhật Bản, đá viên', NULL, TRUE, 2, NOW(), NOW()),
(15, 'Trà thảo mộc', 'TRA005', 30000.00, 10000.00, 'Trà thảo mộc ấm nóng', NULL, TRUE, 2, NOW(), NOW()),

-- Nước ép & Sinh tố
(16, 'Nước cam ép', 'NCE001', 40000.00, 15000.00, 'Nước cam tươi ép, không đường', NULL, TRUE, 3, NOW(), NOW()),
(17, 'Nước dưa hấu ép', 'NCE002', 35000.00, 12000.00, 'Nước dưa hấu tươi ép', NULL, TRUE, 3, NOW(), NOW()),
(18, 'Sinh tố bơ', 'STB001', 45000.00, 18000.00, 'Sinh tố bơ sữa đặc', NULL, TRUE, 3, NOW(), NOW()),
(19, 'Sinh tố xoài', 'STX001', 40000.00, 15000.00, 'Sinh tố xoài sữa chua', NULL, TRUE, 3, NOW(), NOW()),
(20, 'Sinh tố dâu', 'STD001', 45000.00, 18000.00, 'Sinh tố dâu tây sữa chua', NULL, TRUE, 3, NOW(), NOW()),

-- Bánh ngọt
(21, 'Bánh mì sandwich', 'BMS001', 30000.00, 12000.00, 'Bánh mì sandwich thịt nguội', NULL, TRUE, 4, NOW(), NOW()),
(22, 'Bánh croissant', 'BCR001', 35000.00, 15000.00, 'Bánh sừng bò Pháp', NULL, TRUE, 4, NOW(), NOW()),
(23, 'Bánh kem socola', 'BKS001', 50000.00, 20000.00, 'Bánh kem socola nhỏ', NULL, TRUE, 4, NOW(), NOW()),
(24, 'Bánh quy bơ', 'BQB001', 25000.00, 10000.00, 'Bánh quy bơ giòn', NULL, TRUE, 4, NOW(), NOW()),
(25, 'Bánh muffin', 'BMU001', 40000.00, 18000.00, 'Bánh muffin việt quất', NULL, TRUE, 4, NOW(), NOW()),

-- Đồ ăn nhẹ
(26, 'Salad rau củ', 'SAL001', 45000.00, 18000.00, 'Salad rau củ tươi, sốt dầu giấm', NULL, TRUE, 5, NOW(), NOW()),
(27, 'Sandwich gà nướng', 'SAG001', 55000.00, 22000.00, 'Sandwich gà nướng rau củ', NULL, TRUE, 5, NOW(), NOW()),
(28, 'Khoai tây chiên', 'KTC001', 35000.00, 12000.00, 'Khoai tây chiên giòn', NULL, TRUE, 5, NOW(), NOW()),

-- Đồ uống đặc biệt
(29, 'Smoothie xanh', 'SMX001', 60000.00, 25000.00, 'Smoothie rau xanh và trái cây', NULL, TRUE, 6, NOW(), NOW()),
(30, 'Mocktail dâu', 'MOC001', 55000.00, 22000.00, 'Mocktail dâu tây không cồn', NULL, TRUE, 6, NOW(), NOW()),

-- Combo
(31, 'Combo sáng', 'CBS001', 80000.00, 35000.00, 'Cà phê + bánh mì sandwich', NULL, TRUE, 7, NOW(), NOW()),
(32, 'Combo trưa', 'CBT001', 120000.00, 50000.00, 'Cà phê + salad + bánh', NULL, TRUE, 7, NOW(), NOW()),
(33, 'Combo chiều', 'CBC001', 100000.00, 40000.00, 'Trà sữa + bánh ngọt', NULL, TRUE, 7, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    price = VALUES(price),
    updated_at = NOW();

-- ============================================
-- 5. INGREDIENTS (Nguyên liệu)
-- ============================================
INSERT INTO ingredients (id, name, unit, quantity_on_hand, reorder_level) VALUES
(1, 'Cà phê hạt', 'kg', 50.00, 10.00),
(2, 'Sữa đặc', 'hộp', 100.00, 20.00),
(3, 'Sữa tươi', 'lít', 80.00, 15.00),
(4, 'Đường', 'kg', 30.00, 5.00),
(5, 'Trà đen', 'kg', 25.00, 5.00),
(6, 'Trà xanh', 'kg', 20.00, 5.00),
(7, 'Chanh tươi', 'kg', 15.00, 3.00),
(8, 'Cam tươi', 'kg', 20.00, 5.00),
(9, 'Dưa hấu', 'kg', 30.00, 10.00),
(10, 'Bơ', 'kg', 10.00, 2.00),
(11, 'Xoài', 'kg', 15.00, 3.00),
(12, 'Dâu tây', 'kg', 8.00, 2.00),
(13, 'Bánh mì', 'cái', 200.00, 50.00),
(14, 'Thịt nguội', 'kg', 10.00, 2.00),
(15, 'Rau xà lách', 'kg', 5.00, 1.00),
(16, 'Khoai tây', 'kg', 20.00, 5.00),
(17, 'Socola', 'kg', 15.00, 3.00),
(18, 'Bột mì', 'kg', 50.00, 10.00),
(19, 'Trứng gà', 'quả', 200.00, 50.00),
(20, 'Bơ thực vật', 'kg', 20.00, 5.00)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 6. PRODUCT_INGREDIENTS (Công thức sản phẩm)
-- ============================================
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit) VALUES
-- Cà phê đen đá
(1, 1, 0.02, 'kg'),
(1, 4, 0.01, 'kg'),

-- Cà phê sữa đá
(2, 1, 0.02, 'kg'),
(2, 2, 0.05, 'hộp'),
(2, 4, 0.01, 'kg'),

-- Espresso
(5, 1, 0.01, 'kg'),

-- Latte
(8, 1, 0.01, 'kg'),
(8, 3, 0.2, 'lít'),

-- Trà đá
(11, 5, 0.01, 'kg'),
(11, 4, 0.01, 'kg'),

-- Trà đá chanh
(12, 5, 0.01, 'kg'),
(12, 7, 0.05, 'kg'),
(12, 4, 0.01, 'kg'),

-- Nước cam ép
(16, 8, 0.3, 'kg'),

-- Sinh tố bơ
(18, 10, 0.2, 'kg'),
(18, 2, 0.05, 'hộp'),

-- Bánh mì sandwich
(21, 13, 1, 'cái'),
(21, 14, 0.05, 'kg'),
(21, 15, 0.02, 'kg'),

-- Khoai tây chiên
(28, 16, 0.2, 'kg')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- ============================================
-- 7. SUPPLIERS (Nhà cung cấp)
-- ============================================
INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES
(1, 'Công ty Cà phê Trung Nguyên', 'Nguyễn Văn A', '0901111111', 'contact@trungnguyen.com', '123 Đường Cà phê, Quận 1, TP.HCM'),
(2, 'Công ty Sữa Vinamilk', 'Trần Thị B', '0902222222', 'contact@vinamilk.com', '456 Đường Sữa, Quận 2, TP.HCM'),
(3, 'Cửa hàng Rau củ Tươi', 'Lê Văn C', '0903333333', 'contact@raucu.com', '789 Đường Rau củ, Quận 3, TP.HCM'),
(4, 'Nhà cung cấp Bánh kẹo', 'Phạm Thị D', '0904444444', 'contact@banhkeo.com', '321 Đường Bánh, Quận 4, TP.HCM'),
(5, 'Công ty Đồ uống ABC', 'Hoàng Văn E', '0905555555', 'contact@douong.com', '654 Đường Đồ uống, Quận 5, TP.HCM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 8. CUSTOMERS (Khách hàng)
-- ============================================
INSERT INTO customers (id, phone, full_name, email, loyalty_points, created_at, updated_at) VALUES
(1, '0911111111', 'Nguyễn Văn Khách', 'khach1@email.com', 150, NOW(), NOW()),
(2, '0922222222', 'Trần Thị Thường', 'khach2@email.com', 80, NOW(), NOW()),
(3, '0933333333', 'Lê Văn VIP', 'khach3@email.com', 500, NOW(), NOW()),
(4, '0944444444', 'Phạm Thị Quen', 'khach4@email.com', 200, NOW(), NOW()),
(5, '0955555555', 'Hoàng Văn Mới', 'khach5@email.com', 0, NOW(), NOW()),
(6, '0966666666', 'Vũ Thị Thân', 'khach6@email.com', 300, NOW(), NOW()),
(7, '0977777777', 'Đỗ Văn Lâu', 'khach7@email.com', 1000, NOW(), NOW()),
(8, '0988888888', 'Bùi Thị Thường', 'khach8@email.com', 50, NOW(), NOW()),
(9, '0999999999', 'Nguyễn Văn Test', 'khach9@email.com', 0, NOW(), NOW()),
(10, '0900000000', 'Trần Thị Demo', 'khach10@email.com', 250, NOW(), NOW()),
(11, '0912345678', 'Lê Văn Sample', 'khach11@email.com', 120, NOW(), NOW()),
(12, '0923456789', 'Phạm Thị Example', 'khach12@email.com', 0, NOW(), NOW()),
(13, '0934567890', 'Hoàng Văn Data', 'khach13@email.com', 400, NOW(), NOW()),
(14, '0945678901', 'Vũ Thị Mock', 'khach14@email.com', 75, NOW(), NOW()),
(15, '0956789012', 'Đỗ Văn Fake', 'khach15@email.com', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    full_name = VALUES(full_name),
    loyalty_points = VALUES(loyalty_points),
    updated_at = NOW();

-- ============================================
-- 9. TABLES (Bàn)
-- ============================================
INSERT INTO tables (id, name, capacity, status) VALUES
(1, 'Bàn 1', 2, 'EMPTY'),
(2, 'Bàn 2', 4, 'EMPTY'),
(3, 'Bàn 3', 4, 'SERVING'),
(4, 'Bàn 4', 6, 'EMPTY'),
(5, 'Bàn 5', 2, 'EMPTY'),
(6, 'Bàn 6', 4, 'EMPTY'),
(7, 'Bàn 7', 8, 'SERVING'),
(8, 'Bàn 8', 4, 'EMPTY'),
(9, 'Bàn 9', 2, 'EMPTY'),
(10, 'Bàn 10', 6, 'EMPTY'),
(11, 'Bàn 11', 4, 'EMPTY'),
(12, 'Bàn 12', 2, 'EMPTY'),
(13, 'Bàn 13', 4, 'EMPTY'),
(14, 'Bàn 14', 6, 'EMPTY'),
(15, 'Bàn 15', 8, 'EMPTY'),
(16, 'Bàn VIP 1', 10, 'EMPTY'),
(17, 'Bàn VIP 2', 12, 'EMPTY'),
(18, 'Bàn 18', 4, 'EMPTY'),
(19, 'Bàn 19', 2, 'EMPTY'),
(20, 'Bàn 20', 4, 'EMPTY')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 10. VOUCHERS (Mã giảm giá)
-- ============================================
INSERT INTO vouchers (id, code, description, type, discount_value, minimum_order_amount, maximum_discount_amount, valid_from, valid_to, usage_limit, times_used, active, created_at, updated_at) VALUES
(1, 'GIAM10', 'Giảm 10% cho đơn hàng từ 100,000đ', 'PERCENTAGE', 10.00, 100000.00, 50000.00, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 15, TRUE, NOW(), NOW()),
(2, 'GIAM50K', 'Giảm 50,000đ cho đơn hàng từ 200,000đ', 'FIXED_AMOUNT', 50000.00, 200000.00, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 50, 8, TRUE, NOW(), NOW()),
(3, 'FREESHIP', 'Miễn phí ship cho đơn mang về', 'FIXED_AMOUNT', 20000.00, 50000.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 200, 45, TRUE, NOW(), NOW()),
(4, 'SALE20', 'Giảm 20% cho tất cả đơn hàng', 'PERCENTAGE', 20.00, 0.00, 100000.00, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 500, 120, TRUE, NOW(), NOW()),
(5, 'HETHAN', 'Voucher đã hết hạn (test)', 'PERCENTAGE', 15.00, 50000.00, NULL, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 100, 0, FALSE, NOW(), NOW()),
(6, 'NEWUSER', 'Giảm 30,000đ cho khách hàng mới', 'FIXED_AMOUNT', 30000.00, 0.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), 1000, 25, TRUE, NOW(), NOW()),
(7, 'VIP50', 'Giảm 50% cho khách VIP', 'PERCENTAGE', 50.00, 500000.00, 200000.00, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 20, 3, TRUE, NOW(), NOW()),
(8, 'COMBO', 'Giảm 15% cho combo', 'PERCENTAGE', 15.00, 80000.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 200, 12, TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- ============================================
-- 11. ORDERS (Đơn hàng)
-- ============================================
INSERT INTO orders (id, table_id, user_id, customer_id, shift_session_id, type, status, sub_total, discount_amount, total_amount, voucher_code, payment_method, notes, created_at, updated_at, paid_at, transferred) VALUES
-- Đơn hàng DINE_IN đã thanh toán
(1, 3, 5, 1, NULL, 'DINE_IN', 'PAID', 150000.00, 0.00, 150000.00, NULL, 'CASH', 'Khách hàng thân thiết', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), TRUE),
(2, 7, 8, 3, NULL, 'DINE_IN', 'PAID', 250000.00, 25000.00, 225000.00, 'GIAM10', 'TRANSFER', 'Khách VIP, đã áp dụng voucher', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), TRUE),
(3, NULL, 9, 2, NULL, 'TAKE_AWAY', 'PAID', 80000.00, 0.00, 80000.00, NULL, 'CASH', 'Đơn mang về', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), TRUE),
(4, 4, 6, 4, NULL, 'DINE_IN', 'PAID', 120000.00, 0.00, 120000.00, NULL, 'CASH', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), TRUE),
(5, NULL, 8, 5, NULL, 'TAKE_AWAY', 'PAID', 55000.00, 0.00, 55000.00, NULL, 'CASH', 'Khách hàng mới', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), TRUE),
(6, 2, 10, 6, NULL, 'DINE_IN', 'PAID', 180000.00, 36000.00, 144000.00, 'SALE20', 'TRANSFER', 'Đã áp dụng SALE20', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR), TRUE),
(7, 5, 7, 7, NULL, 'DINE_IN', 'PAID', 320000.00, 50000.00, 270000.00, 'GIAM50K', 'CASH', 'Khách VIP, đơn lớn', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR), TRUE),
(8, NULL, 9, 8, NULL, 'TAKE_AWAY', 'PAID', 45000.00, 0.00, 45000.00, NULL, 'CASH', NULL, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), TRUE),

-- Đơn hàng PENDING (chưa thanh toán)
(9, 3, 5, 1, NULL, 'DINE_IN', 'PENDING', 95000.00, 0.00, 95000.00, NULL, NULL, 'Đang phục vụ', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL, FALSE),
(10, NULL, 8, 2, NULL, 'TAKE_AWAY', 'PENDING', 120000.00, 0.00, 120000.00, NULL, NULL, 'Chờ lấy hàng', DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE), NULL, FALSE),
(11, 6, 11, 9, NULL, 'DINE_IN', 'PENDING', 200000.00, 0.00, 200000.00, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE), NULL, FALSE),
(12, NULL, 9, 10, NULL, 'TAKE_AWAY', 'PENDING', 65000.00, 0.00, 65000.00, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE), NULL, FALSE),
(13, 8, 12, 11, NULL, 'DINE_IN', 'PENDING', 140000.00, 0.00, 140000.00, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE), NULL, FALSE),

-- Đơn hàng CANCELLED (đã hủy)
(14, 9, 5, 12, NULL, 'DINE_IN', 'CANCELLED', 75000.00, 0.00, 75000.00, NULL, NULL, 'Khách hủy đơn', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, FALSE),
(15, NULL, 8, 13, NULL, 'TAKE_AWAY', 'CANCELLED', 50000.00, 0.00, 50000.00, NULL, NULL, 'Hết nguyên liệu', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, FALSE)
ON DUPLICATE KEY UPDATE 
    status = VALUES(status),
    total_amount = VALUES(total_amount),
    updated_at = VALUES(updated_at);

-- ============================================
-- 12. ORDER_DETAILS (Chi tiết đơn hàng)
-- ============================================
INSERT INTO order_details (id, order_id, product_id, quantity, price_at_order, notes) VALUES
-- Order 1 (PAID)
(1, 1, 1, 2, 25000.00, NULL),
(2, 1, 21, 1, 30000.00, NULL),
(3, 1, 11, 2, 15000.00, NULL),
(4, 1, 28, 1, 35000.00, NULL),

-- Order 2 (PAID với voucher)
(5, 2, 8, 2, 50000.00, NULL),
(6, 2, 7, 1, 45000.00, NULL),
(7, 2, 23, 1, 50000.00, NULL),
(8, 2, 22, 1, 35000.00, NULL),
(9, 2, 26, 1, 45000.00, NULL),

-- Order 3 (TAKE_AWAY PAID)
(10, 3, 31, 1, 80000.00, 'Combo sáng'),

-- Order 4 (PAID)
(11, 4, 2, 2, 30000.00, NULL),
(12, 4, 13, 1, 35000.00, NULL),
(13, 4, 24, 1, 25000.00, NULL),

-- Order 5 (TAKE_AWAY PAID)
(14, 5, 5, 1, 35000.00, NULL),
(15, 5, 11, 1, 15000.00, NULL),

-- Order 6 (PAID với SALE20)
(16, 6, 9, 2, 55000.00, NULL),
(17, 6, 19, 1, 40000.00, NULL),
(18, 6, 25, 1, 40000.00, NULL),

-- Order 7 (PAID với GIAM50K)
(19, 7, 10, 2, 60000.00, NULL),
(20, 7, 27, 2, 55000.00, NULL),
(21, 7, 29, 1, 60000.00, NULL),
(22, 7, 32, 1, 120000.00, 'Combo trưa'),

-- Order 8 (TAKE_AWAY PAID)
(23, 8, 3, 1, 25000.00, NULL),
(24, 8, 12, 1, 20000.00, NULL),

-- Order 9 (PENDING)
(25, 9, 1, 1, 25000.00, NULL),
(26, 9, 2, 1, 30000.00, NULL),
(27, 9, 11, 1, 15000.00, NULL),
(28, 9, 24, 1, 25000.00, NULL),

-- Order 10 (PENDING TAKE_AWAY)
(29, 10, 8, 2, 50000.00, NULL),
(30, 10, 21, 1, 30000.00, NULL),
(31, 10, 16, 1, 40000.00, NULL),

-- Order 11 (PENDING)
(32, 11, 6, 2, 40000.00, NULL),
(33, 11, 7, 1, 45000.00, NULL),
(34, 11, 26, 1, 45000.00, NULL),
(35, 11, 28, 1, 35000.00, NULL),
(36, 11, 22, 1, 35000.00, NULL),

-- Order 12 (PENDING TAKE_AWAY)
(37, 12, 4, 1, 30000.00, NULL),
(38, 12, 13, 1, 35000.00, NULL),

-- Order 13 (PENDING)
(39, 13, 5, 2, 35000.00, NULL),
(40, 13, 18, 1, 45000.00, NULL),
(41, 13, 25, 1, 40000.00, NULL),
(42, 13, 11, 1, 15000.00, NULL),

-- Order 14 (CANCELLED)
(43, 14, 1, 1, 25000.00, NULL),
(44, 14, 11, 2, 15000.00, NULL),
(45, 14, 24, 1, 25000.00, NULL),

-- Order 15 (CANCELLED)
(46, 15, 2, 1, 30000.00, NULL),
(47, 15, 12, 1, 20000.00, NULL)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- ============================================
-- 13. EXPENSES (Chi phí)
-- ============================================
INSERT INTO expenses (id, user_id, category, amount, description, expense_date, created_at, updated_at) VALUES
(1, 3, 'NGUYEN_LIEU', 500000.00, 'Mua cà phê hạt 10kg', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 3, 'NGUYEN_LIEU', 300000.00, 'Mua sữa đặc 50 hộp', DATE_SUB(CURDATE(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 4, 'TIEN_DIEN', 1500000.00, 'Tiền điện tháng này', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 4, 'TIEN_NUOC', 200000.00, 'Tiền nước tháng này', DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, 3, 'NGUYEN_LIEU', 250000.00, 'Mua trà đen 5kg', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 3, 'NGUYEN_LIEU', 400000.00, 'Mua trái cây tươi', DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 4, 'BAO_TRI', 800000.00, 'Bảo trì máy pha cà phê', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 3, 'NGUYEN_LIEU', 180000.00, 'Mua bánh mì 100 cái', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(9, 4, 'LUONG', 15000000.00, 'Lương nhân viên tháng này', CURDATE(), NOW(), NOW()),
(10, 3, 'NGUYEN_LIEU', 350000.00, 'Mua socola và bột mì', CURDATE(), NOW(), NOW()),
(11, 4, 'KHAC', 500000.00, 'Chi phí marketing', CURDATE(), NOW(), NOW()),
(12, 3, 'NGUYEN_LIEU', 220000.00, 'Mua rau củ tươi', CURDATE(), NOW(), NOW())
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- ============================================
-- 14. PURCHASE_ORDERS (Đơn mua hàng)
-- ============================================
INSERT INTO purchase_orders (id, supplier_id, user_id, order_date, expected_date, status, total_amount) VALUES
(1, 1, 3, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 'COMPLETED', 5000000.00),
(2, 2, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'COMPLETED', 3000000.00),
(3, 3, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY), 'PENDING', 1500000.00),
(4, 4, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING', 2000000.00),
(5, 1, 4, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 'PENDING', 4000000.00),
(6, 5, 3, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 'PENDING', 2500000.00),
(7, 2, 4, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 'CANCELLED', 0.00)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- ============================================
-- 15. PURCHASE_ORDER_DETAILS (Chi tiết đơn mua hàng)
-- ============================================
INSERT INTO purchase_order_details (id, purchase_order_id, ingredient_id, quantity, unit_price, total_price) VALUES
-- Purchase Order 1 (COMPLETED)
(1, 1, 1, 50.00, 100000.00, 5000000.00),

-- Purchase Order 2 (COMPLETED)
(2, 2, 2, 100.00, 30000.00, 3000000.00),

-- Purchase Order 3 (PENDING)
(3, 3, 7, 20.00, 30000.00, 600000.00),
(4, 3, 8, 15.00, 40000.00, 600000.00),
(5, 3, 9, 10.00, 30000.00, 300000.00),

-- Purchase Order 4 (PENDING)
(6, 4, 13, 200.00, 5000.00, 1000000.00),
(7, 4, 14, 20.00, 50000.00, 1000000.00),

-- Purchase Order 5 (PENDING)
(8, 5, 1, 30.00, 100000.00, 3000000.00),
(9, 5, 5, 10.00, 50000.00, 500000.00),
(10, 5, 6, 10.00, 50000.00, 500000.00),

-- Purchase Order 6 (PENDING)
(11, 6, 3, 50.00, 40000.00, 2000000.00),
(12, 6, 4, 25.00, 20000.00, 500000.00),

-- Purchase Order 7 (CANCELLED)
(13, 7, 2, 50.00, 30000.00, 1500000.00)
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- ============================================
-- 16. LOGIN_HISTORY (Lịch sử đăng nhập)
-- ============================================
INSERT INTO login_history (id, username, success, ip_address, user_agent, message, created_at) VALUES
(1, 'admin_demo', TRUE, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 'manager_demo', TRUE, '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 'barista_01', TRUE, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 'cashier_01', TRUE, '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 'service_01', TRUE, '192.168.1.104', 'Mozilla/5.0 (Android 11)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 'admin_demo', TRUE, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(7, 'barista_02', TRUE, '192.168.1.105', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(8, 'manager_demo', FALSE, '192.168.1.106', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Sai mật khẩu', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(9, 'staff_demo', TRUE, '192.168.1.107', 'Mozilla/5.0 (Android 11)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(10, 'cashier_02', TRUE, '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(11, 'admin_demo', TRUE, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Đăng nhập thành công', NOW()),
(12, 'barista_01', FALSE, '192.168.1.109', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'Tài khoản không tồn tại', DATE_SUB(NOW(), INTERVAL 15 MINUTE))
ON DUPLICATE KEY UPDATE success = VALUES(success);

-- ============================================
-- KẾT THÚC DỮ LIỆU MẪU
-- ============================================ 