import XLSX from 'xlsx';
import fs from 'fs';

// Danh sách testers
const testers = ['Pho', 'Nhật', 'Mai', 'Thịnh', 'Quân'];

// Helper để lấy tester xoay vòng (chia đều công việc)
let testerIndex = 0;
const getTester = () => {
    const tester = testers[testerIndex % testers.length];
    testerIndex++;
    return tester;
};

// Helper tạo đối tượng Test Case chuẩn để tránh lặp code
const createTC = (id, summary, preCond, testData, steps, expResult, note = 'Test chính thức') => ({
    'TC ID': id,
    'Summary': summary,
    'Pre-condition': preCond,
    'Test Data': testData,
    'Steps': steps,
    'Expected Result': expResult,
    'Result': '',
    'Bug #': '',
    'Notes': note,
    'Test Date': '',
    'Tester': getTester()
});

// 1. Module Đăng ký/Đăng nhập (AUTH)
function createAuthTestCases() {
    const cases = [
        createTC('TC_AUTH_01', 'Kiểm tra hiển thị trang đăng nhập', 'Truy cập vào hệ thống, chưa đăng nhập', 'URL: http://localhost:5173/login', '1. Mở trình duyệt\n2. Truy cập URL đăng nhập\n3. Quan sát giao diện', '• Hiển thị form đăng nhập với 2 trường: Tên đăng nhập và Mật khẩu\n• Hiển thị nút "Đăng nhập"\n• Hiển thị checkbox "Ghi nhớ lần đăng nhập này"\n• Hiển thị thông tin tài khoản demo (admin_demo, manager_demo, staff_demo)'),
        createTC('TC_AUTH_02', 'Kiểm tra đăng nhập thành công với tài khoản admin', 'Có tài khoản admin hợp lệ (username: admin_demo, password: Admindemo1234.)', 'Username: admin_demo\nPassword: Admindemo1234.', '1. Nhập username: admin_demo\n2. Nhập password: Admindemo1234.\n3. Click nút "Đăng nhập"', '• Đăng nhập thành công\n• Chuyển hướng đến trang Dashboard\n• Hiển thị thông tin user admin ở header\n• Có quyền truy cập tất cả các module'),
        createTC('TC_AUTH_03', 'Kiểm tra đăng nhập thành công với tài khoản manager', 'Có tài khoản manager hợp lệ (username: manager_demo, password: Managerdemo1234.)', 'Username: manager_demo\nPassword: Managerdemo1234.', '1. Nhập username: manager_demo\n2. Nhập password: Managerdemo1234.\n3. Click nút "Đăng nhập"', '• Đăng nhập thành công\n• Chuyển hướng đến trang Dashboard\n• Hiển thị thông tin user manager ở header\n• Có quyền truy cập các module theo role MANAGER'),
        createTC('TC_AUTH_04', 'Kiểm tra đăng nhập thành công với tài khoản staff', 'Có tài khoản staff hợp lệ (username: staff_demo, password: Staffdemo1234.)', 'Username: staff_demo\nPassword: Staffdemo1234.', '1. Nhập username: staff_demo\n2. Nhập password: Staffdemo1234.\n3. Click nút "Đăng nhập"', '• Đăng nhập thành công\n• Chuyển hướng đến trang Dashboard\n• Hiển thị thông tin user staff ở header\n• Có quyền truy cập các module theo role STAFF'),
        createTC('TC_AUTH_05', 'Kiểm tra validation khi đăng nhập với username trống', 'Đang ở trang đăng nhập', 'Username: (để trống)\nPassword: Admindemo1234.', '1. Để trống trường username\n2. Nhập password: Admindemo1234.\n3. Click nút "Đăng nhập"', '• Hiển thị thông báo lỗi "Tên đăng nhập là bắt buộc" hoặc tương tự\n• Không cho phép đăng nhập\n• Form vẫn hiển thị'),
        createTC('TC_AUTH_06', 'Kiểm tra validation khi đăng nhập với password trống', 'Đang ở trang đăng nhập', 'Username: admin_demo\nPassword: (để trống)', '1. Nhập username: admin_demo\n2. Để trống trường password\n3. Click nút "Đăng nhập"', '• Hiển thị thông báo lỗi "Mật khẩu là bắt buộc" hoặc tương tự\n• Không cho phép đăng nhập\n• Form vẫn hiển thị'),
        createTC('TC_AUTH_07', 'Kiểm tra đăng nhập với username sai', 'Đang ở trang đăng nhập', 'Username: admin_wrong\nPassword: Admindemo1234.', '1. Nhập username: admin_wrong\n2. Nhập password: Admindemo1234.\n3. Click nút "Đăng nhập"', '• Hiển thị thông báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng"\n• Không đăng nhập được\n• Vẫn ở trang đăng nhập'),
        createTC('TC_AUTH_08', 'Kiểm tra đăng nhập với password sai', 'Đang ở trang đăng nhập', 'Username: admin_demo\nPassword: WrongPassword123', '1. Nhập username: admin_demo\n2. Nhập password: WrongPassword123\n3. Click nút "Đăng nhập"', '• Hiển thị thông báo lỗi "Tên đăng nhập hoặc mật khẩu không đúng"\n• Không đăng nhập được\n• Vẫn ở trang đăng nhập'),
        createTC('TC_AUTH_09', 'Kiểm tra chức năng "Ghi nhớ lần đăng nhập này"', 'Đang ở trang đăng nhập', 'Username: admin_demo\nPassword: Admindemo1234.\nCheckbox: checked', '1. Nhập thông tin đăng nhập\n2. Tick vào checkbox "Ghi nhớ lần đăng nhập này"\n3. Click "Đăng nhập"\n4. Đăng xuất\n5. Truy cập lại trang đăng nhập', '• Đăng nhập thành công\n• Username được lưu lại (hiển thị sẵn khi quay lại)\n• Password không được lưu (bảo mật)'),
        createTC('TC_AUTH_10', 'Kiểm tra đăng xuất khỏi hệ thống', 'Đã đăng nhập thành công với tài khoản bất kỳ', 'User đã đăng nhập', '1. Click vào avatar/username ở header\n2. Click nút "Đăng xuất" hoặc menu logout\n3. Xác nhận đăng xuất', '• Đăng xuất thành công\n• Chuyển hướng về trang đăng nhập\n• Token được xóa\n• Không thể truy cập các trang yêu cầu đăng nhập'),
        createTC('TC_AUTH_11', 'Kiểm tra đăng ký nhân viên mới với đầy đủ thông tin hợp lệ', 'Đã đăng nhập với quyền ADMIN hoặc MANAGER\nĐang ở trang Quản lý Nhân viên', 'FullName: Nguyễn Văn A\nUsername: nva001\nPassword: Password123.\nPhone: 0901234567\nEmail: nva@example.com\nRoleIds: [1] (STAFF)', '1. Click nút "Thêm nhân viên mới"\n2. Điền đầy đủ thông tin\n3. Chọn quyền STAFF\n4. Click "Lưu"', '• Tạo tài khoản thành công\n• Hiển thị thông báo "Đã tạo tài khoản nhân viên mới"\n• Nhân viên mới xuất hiện trong danh sách\n• Có thể đăng nhập bằng username/password vừa tạo'),
        createTC('TC_AUTH_12', 'Kiểm tra validation khi đăng ký với username đã tồn tại', 'Đã đăng nhập với quyền ADMIN\nCó username "admin_demo" đã tồn tại', 'Username: admin_demo (đã tồn tại)\nCác trường khác hợp lệ', '1. Mở form đăng ký nhân viên\n2. Nhập username: admin_demo\n3. Điền các trường khác\n4. Click "Lưu"', '• Hiển thị thông báo lỗi "Username đã tồn tại" hoặc tương tự\n• Không tạo được tài khoản\n• Form vẫn hiển thị để sửa'),
        createTC('TC_AUTH_13', 'Kiểm tra validation khi đăng ký với phone đã tồn tại', 'Đã đăng nhập với quyền ADMIN\nCó phone "0901234567" đã tồn tại', 'Phone: 0901234567 (đã tồn tại)\nCác trường khác hợp lệ', '1. Mở form đăng ký nhân viên\n2. Nhập phone: 0901234567\n3. Điền các trường khác\n4. Click "Lưu"', '• Hiển thị thông báo lỗi "Số điện thoại đã tồn tại" hoặc tương tự\n• Không tạo được tài khoản\n• Form vẫn hiển thị để sửa'),
        createTC('TC_AUTH_14', 'Kiểm tra validation khi đăng ký với password không đủ mạnh', 'Đã đăng nhập với quyền ADMIN', 'Password: 123456 (quá yếu)', '1. Mở form đăng ký nhân viên\n2. Nhập password: 123456\n3. Điền các trường khác\n4. Click "Lưu"', '• Hiển thị thông báo lỗi về độ mạnh mật khẩu\n• Không tạo được tài khoản\n• Form vẫn hiển thị để sửa'),
        createTC('TC_AUTH_15', 'Kiểm tra đăng ký nhân viên với nhiều quyền (roles)', 'Đã đăng nhập với quyền ADMIN', 'FullName: Trần Thị B\nUsername: ttb001\nRoleIds: [1, 2] (STAFF và MANAGER)', '1. Mở form đăng ký nhân viên\n2. Điền thông tin\n3. Chọn nhiều quyền (STAFF và MANAGER)\n4. Click "Lưu"', '• Tạo tài khoản thành công\n• Nhân viên có cả 2 quyền\n• Có thể truy cập các module của cả 2 roles'),
        createTC('TC_AUTH_16', 'Kiểm tra validation khi đăng ký không chọn quyền (roleIds rỗng)', 'Đã đăng nhập với quyền ADMIN', 'Các trường khác hợp lệ nhưng không chọn role nào', '1. Mở form đăng ký nhân viên\n2. Điền thông tin nhưng không chọn quyền\n3. Click "Lưu"', '• Hiển thị thông báo lỗi "Phải chọn ít nhất một quyền" hoặc tương tự\n• Không tạo được tài khoản\n• Form vẫn hiển thị để sửa'),
        createTC('TC_AUTH_17', 'Kiểm tra STAFF không thể đăng ký nhân viên mới', 'Đã đăng nhập với quyền STAFF', 'User có role STAFF', '1. Truy cập trang Quản lý Nhân viên\n2. Quan sát giao diện', '• Không hiển thị nút "Thêm nhân viên mới"\n• Nếu truy cập trực tiếp API sẽ bị từ chối (403 Forbidden)')
    ];
    return cases;
}

// 2. Module Đơn hàng/Bán hàng (POS)
function createOrderTestCases() {
    const cases = [
        createTC('TC_ORDER_01', 'Kiểm tra hiển thị danh sách đơn hàng', 'Đã đăng nhập với quyền STAFF/MANAGER/ADMIN\nCó ít nhất 1 đơn hàng trong hệ thống', 'Truy cập trang Quản lý Hoá đơn', '1. Click vào menu "Quản lý Hoá đơn"\n2. Quan sát danh sách đơn hàng', '• Hiển thị danh sách đơn hàng với các cột: Mã đơn, Khách hàng, Tổng tiền, Trạng thái, Ngày tạo\n• Có phân trang\n• Có bộ lọc theo trạng thái, ngày tháng\n• Có nút tìm kiếm'),
        createTC('TC_ORDER_02', 'Kiểm tra tạo đơn hàng mới tại POS (chọn bàn trước)', 'Đã đăng nhập với quyền STAFF\nCó bàn trống (status: EMPTY)\nCó sản phẩm trong hệ thống', 'Table: Bàn 1\nProducts: [Cà phê đen x2, Bánh mì x1]', '1. Truy cập trang POS\n2. Chọn "Xem sơ đồ bàn"\n3. Click vào Bàn 1\n4. Chọn sản phẩm: Cà phê đen (số lượng 2)\n5. Chọn sản phẩm: Bánh mì (số lượng 1)\n6. Click "Tạo đơn hàng"', '• Tạo đơn hàng thành công\n• Bàn 1 chuyển sang trạng thái SERVING\n• Hiển thị thông tin đơn hàng trong giỏ hàng\n• Tổng tiền được tính đúng\n• Đơn hàng có trạng thái PENDING'),
        createTC('TC_ORDER_03', 'Kiểm tra tạo đơn hàng "Mang về" (Takeaway)', 'Đã đăng nhập với quyền STAFF\nCó sản phẩm trong hệ thống', 'Type: TAKEAWAY\nProducts: [Cà phê sữa x1, Bánh ngọt x2]', '1. Truy cập trang POS\n2. Click nút "Bán Mang Về"\n3. Chọn sản phẩm: Cà phê sữa (số lượng 1)\n4. Chọn sản phẩm: Bánh ngọt (số lượng 2)\n5. Click "Tạo đơn hàng"', '• Tạo đơn hàng TAKEAWAY thành công\n• Đơn hàng không gắn với bàn nào\n• Hiển thị thông tin đơn hàng\n• Tổng tiền được tính đúng\n• Đơn hàng có trạng thái PENDING'),
        createTC('TC_ORDER_04', 'Kiểm tra thêm sản phẩm vào đơn hàng đang PENDING', 'Có đơn hàng PENDING\nCó sản phẩm khác trong hệ thống', 'OrderID: 1 (PENDING)\nProduct: Trà đá (số lượng 1)', '1. Mở đơn hàng PENDING (OrderID: 1)\n2. Click "Thêm món"\n3. Chọn sản phẩm: Trà đá\n4. Nhập số lượng: 1\n5. Click "Thêm vào đơn"', '• Sản phẩm được thêm vào đơn hàng\n• Tổng tiền được cập nhật\n• Số lượng sản phẩm trong đơn tăng lên\n• Đơn hàng vẫn ở trạng thái PENDING'),
        createTC('TC_ORDER_05', 'Kiểm tra cập nhật số lượng sản phẩm trong đơn hàng', 'Có đơn hàng PENDING với sản phẩm đã có', 'OrderID: 1\nProduct: Cà phê đen (hiện tại: 2, cập nhật: 3)', '1. Mở đơn hàng PENDING\n2. Tìm sản phẩm "Cà phê đen"\n3. Thay đổi số lượng từ 2 thành 3\n4. Click "Cập nhật"', '• Số lượng được cập nhật thành 3\n• Tổng tiền được tính lại đúng\n• Thành tiền của sản phẩm = giá x 3'),
        createTC('TC_ORDER_06', 'Kiểm tra xóa sản phẩm khỏi đơn hàng', 'Có đơn hàng PENDING với ít nhất 2 sản phẩm', 'OrderID: 1\nProduct: Bánh mì (cần xóa)', '1. Mở đơn hàng PENDING\n2. Tìm sản phẩm "Bánh mì"\n3. Click nút "Xóa" hoặc icon xóa\n4. Xác nhận xóa', '• Sản phẩm được xóa khỏi đơn hàng\n• Tổng tiền được tính lại\n• Số lượng sản phẩm trong đơn giảm đi'),
        createTC('TC_ORDER_07', 'Kiểm tra thanh toán đơn hàng bằng tiền mặt (CASH)', 'Có đơn hàng PENDING\nĐã đăng nhập với quyền STAFF', 'OrderID: 1\nPaymentMethod: CASH\nTotalAmount: 150,000 VNĐ', '1. Mở đơn hàng PENDING\n2. Click nút "Thanh toán"\n3. Chọn phương thức: Tiền mặt\n4. Xác nhận thanh toán', '• Thanh toán thành công\n• Đơn hàng chuyển sang trạng thái PAID\n• Bàn được giải phóng (chuyển về EMPTY nếu là DINE_IN)\n• Hiển thị thông báo "Thanh toán thành công"\n• Tồn kho nguyên liệu được trừ đi'),
        createTC('TC_ORDER_08', 'Kiểm tra thanh toán đơn hàng bằng chuyển khoản (TRANSFER)', 'Có đơn hàng PENDING', 'OrderID: 2\nPaymentMethod: TRANSFER', '1. Mở đơn hàng PENDING\n2. Click nút "Thanh toán"\n3. Chọn phương thức: Chuyển khoản\n4. Xác nhận thanh toán', '• Thanh toán thành công\n• Đơn hàng chuyển sang trạng thái PAID\n• PaymentMethod được lưu là TRANSFER\n• Bàn được giải phóng'),
        createTC('TC_ORDER_09', 'Kiểm tra áp dụng voucher khi thanh toán', 'Có đơn hàng PENDING\nCó voucher hợp lệ (code: GIAM10, discount: 10%)', 'OrderID: 3\nVoucherCode: GIAM10\nSubTotal: 200,000 VNĐ', '1. Mở đơn hàng PENDING\n2. Click nút "Thanh toán"\n3. Nhập mã voucher: GIAM10\n4. Click "Áp dụng"\n5. Xác nhận thanh toán', '• Voucher được áp dụng thành công\n• Hiển thị số tiền giảm: 20,000 VNĐ (10%)\n• Tổng tiền = 200,000 - 20,000 = 180,000 VNĐ\n• Thanh toán thành công với số tiền đã giảm'),
        createTC('TC_ORDER_10', 'Kiểm tra áp dụng voucher không hợp lệ (đã hết hạn)', 'Có đơn hàng PENDING\nCó voucher đã hết hạn', 'OrderID: 4\nVoucherCode: HETHAN (đã hết hạn)', '1. Mở đơn hàng PENDING\n2. Click nút "Thanh toán"\n3. Nhập mã voucher: HETHAN\n4. Click "Áp dụng"', '• Hiển thị thông báo lỗi "Voucher không hợp lệ" hoặc "Voucher đã hết hạn"\n• Voucher không được áp dụng\n• Tổng tiền không thay đổi'),
        createTC('TC_ORDER_11', 'Kiểm tra gán khách hàng vào đơn hàng', 'Có đơn hàng PENDING\nCó khách hàng trong hệ thống', 'OrderID: 5\nCustomerID: 1 (Nguyễn Văn A)', '1. Mở đơn hàng PENDING\n2. Click "Chọn khách hàng"\n3. Tìm và chọn khách hàng: Nguyễn Văn A\n4. Lưu', '• Khách hàng được gán vào đơn hàng\n• Hiển thị thông tin khách hàng trong đơn\n• Khi thanh toán, điểm tích lũy được cộng cho khách hàng'),
        createTC('TC_ORDER_12', 'Kiểm tra xem chi tiết đơn hàng', 'Có đơn hàng trong hệ thống', 'OrderID: 1', '1. Truy cập trang Quản lý Hoá đơn\n2. Click vào đơn hàng có OrderID: 1', '• Hiển thị modal/trang chi tiết đơn hàng\n• Hiển thị đầy đủ thông tin: Mã đơn, Khách hàng, Bàn, Sản phẩm, Số lượng, Giá, Tổng tiền, Trạng thái, Ngày tạo, Phương thức thanh toán\n• Có nút "In hoá đơn" nếu đã thanh toán'),
        createTC('TC_ORDER_13', 'Kiểm tra lọc đơn hàng theo trạng thái', 'Có nhiều đơn hàng với các trạng thái khác nhau', 'Filter: Status = PAID', '1. Truy cập trang Quản lý Hoá đơn\n2. Chọn bộ lọc "Trạng thái"\n3. Chọn "Đã thanh toán"\n4. Click "Áp dụng"', '• Chỉ hiển thị các đơn hàng có trạng thái PAID\n• Số lượng đơn hàng hiển thị đúng\n• Có thể reset bộ lọc'),
        createTC('TC_ORDER_14', 'Kiểm tra tìm kiếm đơn hàng theo mã đơn', 'Có nhiều đơn hàng trong hệ thống', 'Search: OrderID = 10', '1. Truy cập trang Quản lý Hoá đơn\n2. Nhập "10" vào ô tìm kiếm\n3. Click "Tìm kiếm" hoặc Enter', '• Hiển thị các đơn hàng có mã chứa "10"\n• Kết quả tìm kiếm chính xác\n• Có thể xóa bộ lọc để xem lại tất cả'),
        createTC('TC_ORDER_15', 'Kiểm tra không thể chỉnh sửa đơn hàng đã thanh toán (PAID)', 'Có đơn hàng đã thanh toán (PAID)', 'OrderID: 6 (Status: PAID)', '1. Mở đơn hàng đã thanh toán\n2. Thử thêm/sửa/xóa sản phẩm', '• Không cho phép chỉnh sửa đơn hàng đã thanh toán\n• Các nút thêm/sửa/xóa bị vô hiệu hóa hoặc ẩn\n• Hiển thị thông báo "Đơn hàng đã thanh toán, không thể chỉnh sửa"'),
        createTC('TC_ORDER_16', 'Kiểm tra tính tổng tiền đơn hàng với nhiều sản phẩm', 'Có đơn hàng PENDING', 'Cà phê đen: 50,000 x 2 = 100,000\nBánh mì: 30,000 x 1 = 30,000\nTrà đá: 20,000 x 3 = 60,000', '1. Tạo đơn hàng mới\n2. Thêm các sản phẩm với số lượng như trên\n3. Quan sát tổng tiền', '• Tổng tiền = 100,000 + 30,000 + 60,000 = 190,000 VNĐ\n• Hiển thị đúng số tiền\n• Có thể áp dụng voucher để giảm giá'),
        createTC('TC_ORDER_17', 'Kiểm tra không thể thanh toán đơn hàng rỗng (không có sản phẩm)', 'Có đơn hàng PENDING nhưng chưa có sản phẩm nào', 'OrderID: 7 (không có sản phẩm)', '1. Mở đơn hàng PENDING rỗng\n2. Click nút "Thanh toán"', '• Hiển thị thông báo lỗi "Đơn hàng không có sản phẩm nào" hoặc tương tự\n• Không cho phép thanh toán\n• Nút thanh toán bị vô hiệu hóa'),
        createTC('TC_ORDER_18', 'Kiểm tra chọn món trước tại POS', 'Đã đăng nhập với quyền STAFF\nCó sản phẩm trong hệ thống', 'Products: [Cà phê đen x1]', '1. Truy cập trang POS\n2. Click nút "Chọn món trước"\n3. Chọn sản phẩm: Cà phê đen\n4. Sau đó chọn bàn hoặc tạo đơn mang về', '• Có thể chọn sản phẩm trước\n• Sau đó mới chọn bàn hoặc tạo đơn mang về\n• Đơn hàng được tạo thành công')
    ];
    return cases;
}

// 3. Module Quản lý Bàn (TABLE)
function createTableTestCases() {
    const cases = [
        createTC('TC_TABLE_01', 'Kiểm tra hiển thị danh sách bàn', 'Đã đăng nhập với quyền STAFF/MANAGER/ADMIN\nCó ít nhất 1 bàn trong hệ thống', 'Truy cập trang Quản lý Bàn', '1. Click vào menu "Quản lý Bàn"\n2. Quan sát danh sách bàn', '• Hiển thị danh sách bàn với các thông tin: Tên bàn, Sức chứa, Trạng thái\n• Có thể xem dạng danh sách\n• Có bộ lọc theo trạng thái\n• Có nút tìm kiếm'),
        createTC('TC_TABLE_02', 'Kiểm tra tạo bàn mới với thông tin hợp lệ', 'Đã đăng nhập với quyền MANAGER/ADMIN', 'Name: Bàn 10\nCapacity: 4', '1. Click nút "Thêm bàn mới"\n2. Nhập tên: Bàn 10\n3. Nhập sức chứa: 4\n4. Click "Lưu"', '• Tạo bàn thành công\n• Hiển thị thông báo "Đã tạo bàn mới"\n• Bàn mới xuất hiện trong danh sách với trạng thái EMPTY\n• Có thể chọn bàn này tại POS'),
        createTC('TC_TABLE_03', 'Kiểm tra validation khi tạo bàn với tên trống', 'Đã đăng nhập với quyền MANAGER/ADMIN', 'Name: (để trống)\nCapacity: 4', '1. Click nút "Thêm bàn mới"\n2. Để trống tên bàn\n3. Nhập sức chứa: 4\n4. Click "Lưu"', '• Hiển thị thông báo lỗi "Tên bàn là bắt buộc" hoặc tương tự\n• Không tạo được bàn\n• Form vẫn hiển thị để sửa'),
        createTC('TC_TABLE_04', 'Kiểm tra validation khi tạo bàn với tên đã tồn tại', 'Đã đăng nhập với quyền MANAGER/ADMIN\nCó bàn tên "Bàn 1" đã tồn tại', 'Name: Bàn 1 (đã tồn tại)\nCapacity: 4', '1. Click nút "Thêm bàn mới"\n2. Nhập tên: Bàn 1\n3. Nhập sức chứa: 4\n4. Click "Lưu"', '• Hiển thị thông báo lỗi "Tên bàn đã tồn tại" hoặc tương tự\n• Không tạo được bàn\n• Form vẫn hiển thị để sửa'),
        createTC('TC_TABLE_05', 'Kiểm tra cập nhật thông tin bàn', 'Đã đăng nhập với quyền MANAGER/ADMIN\nCó bàn "Bàn 5" (Capacity: 2)', 'TableID: 5\nName: Bàn 5\nCapacity: 6 (cập nhật từ 2)', '1. Click vào bàn "Bàn 5"\n2. Click nút "Chỉnh sửa"\n3. Thay đổi sức chứa từ 2 thành 6\n4. Click "Lưu"', '• Cập nhật thành công\n• Hiển thị thông báo "Đã cập nhật thông tin bàn"\n• Sức chứa được cập nhật thành 6\n• Thông tin hiển thị đúng'),
        createTC('TC_TABLE_06', 'Kiểm tra xóa bàn', 'Đã đăng nhập với quyền MANAGER/ADMIN\nCó bàn "Bàn 10" không có đơn hàng nào', 'TableID: 10', '1. Click vào bàn "Bàn 10"\n2. Click nút "Xóa"\n3. Xác nhận xóa', '• Xóa bàn thành công\n• Hiển thị thông báo "Đã xóa bàn"\n• Bàn không còn xuất hiện trong danh sách\n• Không thể chọn bàn này tại POS'),
        createTC('TC_TABLE_07', 'Kiểm tra không thể xóa bàn đang có đơn hàng PENDING', 'Đã đăng nhập với quyền MANAGER/ADMIN\nCó bàn "Bàn 1" đang có đơn hàng PENDING', 'TableID: 1 (có đơn hàng PENDING)', '1. Click vào bàn "Bàn 1"\n2. Click nút "Xóa"\n3. Xác nhận xóa', '• Hiển thị thông báo lỗi "Không thể xóa bàn đang có đơn hàng" hoặc tương tự\n• Bàn không bị xóa\n• Vẫn hiển thị trong danh sách'),
        createTC('TC_TABLE_08', 'Kiểm tra cập nhật trạng thái bàn từ EMPTY sang SERVING', 'Có bàn "Bàn 2" với trạng thái EMPTY', 'TableID: 2\nStatus: EMPTY -> SERVING', '1. Tại POS, chọn bàn "Bàn 2"\n2. Tạo đơn hàng cho bàn này', '• Trạng thái bàn tự động chuyển từ EMPTY sang SERVING\n• Hiển thị màu sắc/icon tương ứng với trạng thái SERVING\n• Bàn không thể được chọn cho đơn hàng khác'),
        createTC('TC_TABLE_09', 'Kiểm tra trạng thái bàn tự động chuyển về EMPTY sau khi thanh toán', 'Có bàn "Bàn 3" với trạng thái SERVING\nCó đơn hàng PENDING gắn với bàn này', 'TableID: 3\nOrderID: 5 (PENDING)', '1. Thanh toán đơn hàng của bàn "Bàn 3"\n2. Quan sát trạng thái bàn', '• Đơn hàng chuyển sang trạng thái PAID\n• Trạng thái bàn tự động chuyển từ SERVING về EMPTY\n• Bàn có thể được chọn cho đơn hàng mới'),
        createTC('TC_TABLE_10', 'Kiểm tra lọc bàn theo trạng thái', 'Có nhiều bàn với các trạng thái khác nhau', 'Filter: Status = EMPTY', '1. Truy cập trang Quản lý Bàn\n2. Chọn bộ lọc "Trạng thái"\n3. Chọn "Trống"\n4. Click "Áp dụng"', '• Chỉ hiển thị các bàn có trạng thái EMPTY\n• Số lượng bàn hiển thị đúng\n• Có thể reset bộ lọc'),
        createTC('TC_TABLE_11', 'Kiểm tra tìm kiếm bàn theo tên', 'Có nhiều bàn trong hệ thống', 'Search: "Bàn 1"', '1. Truy cập trang Quản lý Bàn\n2. Nhập "Bàn 1" vào ô tìm kiếm\n3. Click "Tìm kiếm" hoặc Enter', '• Hiển thị các bàn có tên chứa "Bàn 1"\n• Kết quả tìm kiếm chính xác\n• Có thể xóa bộ lọc để xem lại tất cả'),
        createTC('TC_TABLE_12', 'Kiểm tra STAFF không thể tạo/sửa/xóa bàn', 'Đã đăng nhập với quyền STAFF', 'User có role STAFF', '1. Truy cập trang Quản lý Bàn\n2. Quan sát giao diện', '• Không hiển thị nút "Thêm bàn mới"\n• Không hiển thị nút "Chỉnh sửa" và "Xóa" cho các bàn\n• Nếu truy cập trực tiếp API sẽ bị từ chối (403 Forbidden)'),
        createTC('TC_TABLE_13', 'Kiểm tra hiển thị sơ đồ bàn tại POS', 'Đã đăng nhập với quyền STAFF\nCó nhiều bàn trong hệ thống', 'Truy cập POS, chọn "Xem sơ đồ bàn"', '1. Truy cập trang POS\n2. Click "Xem sơ đồ bàn"\n3. Quan sát sơ đồ', '• Hiển thị sơ đồ bàn với layout rõ ràng\n• Mỗi bàn hiển thị tên và trạng thái\n• Màu sắc khác nhau cho các trạng thái (EMPTY, SERVING, RESERVED)\n• Có thể click vào bàn để chọn'),
        createTC('TC_TABLE_14', 'Kiểm tra validation sức chứa bàn phải lớn hơn 0', 'Đã đăng nhập với quyền MANAGER/ADMIN', 'Name: Bàn 11\nCapacity: 0 hoặc -1', '1. Click nút "Thêm bàn mới"\n2. Nhập tên: Bàn 11\n3. Nhập sức chứa: 0 hoặc -1\n4. Click "Lưu"', '• Hiển thị thông báo lỗi "Sức chứa phải lớn hơn 0" hoặc tương tự\n• Không tạo được bàn\n• Form vẫn hiển thị để sửa'),
        createTC('TC_TABLE_15', 'Kiểm tra không thể chọn bàn đang SERVING cho đơn hàng mới', 'Có bàn "Bàn 4" với trạng thái SERVING', 'TableID: 4 (Status: SERVING)', '1. Truy cập trang POS\n2. Chọn "Xem sơ đồ bàn"\n3. Thử click vào bàn "Bàn 4"', '• Bàn "Bàn 4" bị vô hiệu hóa hoặc hiển thị cảnh báo\n• Không thể chọn bàn này cho đơn hàng mới\n• Hiển thị thông báo "Bàn đang phục vụ"')
    ];
    return cases;
}

// 4. Module Quản lý Nhân viên (STAFF)
function createStaffTestCases() {
    const cases = [
        createTC('TC_STAFF_01', 'Xem danh sách nhân viên', 'Quyền Admin', 'Page: Staff', '1. Vào trang Staff', 'Hiện list: Tên, Role, Phone, Status'),
        createTC('TC_STAFF_02', 'Tìm kiếm nhân viên', 'Quyền Admin', 'Keyword: "Nam"', '1. Nhập tên Nam', 'Hiện các nhân viên tên Nam'),
        createTC('TC_STAFF_03', 'Cập nhật thông tin (SĐT)', 'Quyền Admin', 'User: A', '1. Sửa SĐT mới\n2. Lưu', 'SĐT được cập nhật'),
        createTC('TC_STAFF_04', 'Upload Avatar', 'Quyền Admin', 'File: .jpg', '1. Chọn ảnh -> Upload', 'Ảnh đại diện thay đổi'),
        createTC('TC_STAFF_05', 'Xóa Avatar (về mặc định)', 'Quyền Admin', 'Action: Delete Img', '1. Xóa ảnh', 'Về ảnh default'),
        createTC('TC_STAFF_06', 'Khóa tài khoản (Inactive)', 'Quyền Admin', 'Status: Inactive', '1. Đổi status sang Inactive', 'User đó không thể đăng nhập nữa'),
        createTC('TC_STAFF_07', 'Mở khóa tài khoản', 'Quyền Admin', 'Status: Active', '1. Đổi status sang Active', 'User đăng nhập lại bình thường'),
        createTC('TC_STAFF_08', 'Reset mật khẩu', 'Quyền Admin', 'User: B', '1. Click Reset Pass', 'Mật khẩu về mặc định hoặc gửi mail reset'),
        createTC('TC_STAFF_09', 'Phân quyền (Đổi Role)', 'Quyền Admin', 'Staff -> Manager', '1. Đổi role\n2. Lưu', 'User B có quyền Manager'),
        createTC('TC_STAFF_10', 'Xem lịch sử đăng nhập', 'Quyền Admin', 'User: A', '1. Chọn "Xem lịch sử"', 'Hiện list: IP, Time, Browser'),
        createTC('TC_STAFF_11', 'Lọc nhân viên theo Role', 'Quyền Admin', 'Filter: Manager', '1. Chọn lọc Manager', 'Chỉ hiện user là Manager'),
        createTC('TC_STAFF_12', 'Lọc nhân viên theo Trạng thái', 'Quyền Admin', 'Filter: Active', '1. Chọn lọc Active', 'Chỉ hiện user đang hoạt động'),
        createTC('TC_STAFF_13', 'Validate Email không hợp lệ', 'Quyền Admin', 'Email: abc.com', '1. Nhập email sai định dạng', 'Báo lỗi "Email sai định dạng"'),
        createTC('TC_STAFF_14', 'Staff xem profile bản thân', 'Login Staff', 'Page: Profile', '1. Vào profile', 'Xem được thông tin cá nhân'),
        createTC('TC_STAFF_15', 'Staff đổi mật khẩu', 'Login Staff', 'OldPass, NewPass', '1. Nhập pass cũ/mới\n2. Lưu', 'Đổi pass thành công, login lại ok')
    ];
    return cases;
}

// 5. Module Quản lý Khách hàng (CUSTOMER)
function createCustomerTestCases() {
    const cases = [
        createTC('TC_CUST_01', 'Xem danh sách khách hàng', 'Login Staff', 'Page: Customer', '1. Vào trang Khách hàng', 'Hiện list: Tên, Phone, Điểm, Tổng chi'),
        createTC('TC_CUST_02', 'Thêm khách hàng mới', 'Login Staff', 'Full info', '1. Nhập info\n2. Lưu', 'Khách hàng mới được tạo'),
        createTC('TC_CUST_03', 'Validate trùng SĐT khách', 'Login Staff', 'Phone: Exist', '1. Nhập SĐT cũ', 'Báo lỗi "SĐT đã tồn tại"'),
        createTC('TC_CUST_04', 'Sửa thông tin khách', 'Login Staff', 'Address: New', '1. Sửa địa chỉ\n2. Lưu', 'Thông tin cập nhật thành công'),
        createTC('TC_CUST_05', 'Xóa khách hàng', 'Quyền Manager', 'Action: Delete', '1. Xóa khách', 'Khách ẩn khỏi danh sách (Soft delete)'),
        createTC('TC_CUST_06', 'Xem chi tiết & Lịch sử mua', 'Login Staff', 'Customer: A', '1. Click chi tiết', 'Hiện info + List các đơn hàng đã mua'),
        createTC('TC_CUST_07', 'Tích điểm tự động', 'POS', 'Order 100k', '1. Thanh toán đơn 100k cho khách A', 'Điểm khách A tăng (ví dụ +10 điểm)'),
        createTC('TC_CUST_08', 'Tìm kiếm khách bằng SĐT', 'Page: Customer', 'Search: 090...', '1. Nhập SĐT', 'Tìm ra đúng khách hàng'),
        createTC('TC_CUST_09', 'Lọc khách hàng VIP', 'Page: Customer', 'Rank: VIP', '1. Lọc hạng VIP', 'Chỉ hiện khách có chi tiêu cao'),
        createTC('TC_CUST_10', 'Xuất Excel danh sách khách', 'Quyền Manager', 'Action: Export', '1. Click Export', 'Tải xuống file .xlsx chứa danh sách'),
        createTC('TC_CUST_11', 'Import khách từ Excel', 'Quyền Manager', 'File: customers.xlsx', '1. Upload file', 'Hệ thống nhập dữ liệu khách hàng hàng loạt'),
        createTC('TC_CUST_12', 'Validate tên khách trống', 'Form Create', 'Name: [Empty]', '1. Để trống tên', 'Báo lỗi bắt buộc nhập tên'),
        createTC('TC_CUST_13', 'Hiển thị tổng chi tiêu đúng', 'Sau thanh toán', 'Bill: 500k', '1. Check lại tổng chi tiêu', 'Tổng chi tiêu tăng thêm 500k'),
        createTC('TC_CUST_14', 'Ghi chú sở thích khách', 'Detail', 'Note: Ít đường', '1. Thêm ghi chú', 'Ghi chú được lưu lại'),
        createTC('TC_CUST_15', 'Staff không xóa được khách', 'Quyền Staff', 'Delete button', '1. Tìm nút xóa', 'Nút xóa ẩn hoặc disable')
    ];
    return cases;
}

// 6. Module Quản lý Voucher (VOUCHER) - Mới bổ sung
function createVoucherTestCases() {
    const cases = [
        createTC('TC_VOUCHER_01', 'Xem danh sách Voucher', 'Quyền Manager', 'Page: Voucher', '1. Vào trang Voucher', 'Hiện list: Mã, Giảm giá, Ngày hết hạn, Trạng thái'),
        createTC('TC_VOUCHER_02', 'Tạo Voucher giảm theo %', 'Quyền Manager', 'Code: SALE10, Val: 10%', '1. Tạo voucher %\n2. Lưu', 'Tạo thành công'),
        createTC('TC_VOUCHER_03', 'Tạo Voucher giảm tiền mặt', 'Quyền Manager', 'Code: 50K, Val: 50,000', '1. Tạo voucher tiền\n2. Lưu', 'Tạo thành công'),
        createTC('TC_VOUCHER_04', 'Validate ngày bắt đầu > kết thúc', 'Form Create', 'Start > End', '1. Chọn ngày sai', 'Báo lỗi thời gian không hợp lệ'),
        createTC('TC_VOUCHER_05', 'Validate mã Voucher trùng', 'Form Create', 'Code: SALE10 (Exist)', '1. Nhập code cũ', 'Báo lỗi "Mã đã tồn tại"'),
        createTC('TC_VOUCHER_06', 'Thiết lập đơn tối thiểu (Min Spend)', 'Form Create', 'Min: 100k', '1. Set min spend 100k', 'Lưu thành công'),
        createTC('TC_VOUCHER_07', 'Thiết lập số lượng giới hạn', 'Form Create', 'Limit: 50', '1. Set limit 50', 'Lưu thành công'),
        createTC('TC_VOUCHER_08', 'Sửa Voucher (Active -> Inactive)', 'List Voucher', 'Status -> Inactive', '1. Tắt kích hoạt', 'Voucher không dùng được ở POS nữa'),
        createTC('TC_VOUCHER_09', 'Xóa Voucher chưa dùng', 'List Voucher', 'Action: Delete', '1. Xóa voucher', 'Xóa thành công'),
        createTC('TC_VOUCHER_10', 'Chặn xóa Voucher đã có đơn dùng', 'List Voucher', 'Used in Order #1', '1. Xóa voucher', 'Báo lỗi hoặc chỉ cho phép ẩn (soft delete)'),
        createTC('TC_VOUCHER_11', 'Áp dụng Voucher chưa đủ điều kiện', 'POS', 'Bill 50k < Min 100k', '1. Apply voucher', 'Báo lỗi "Đơn hàng chưa đủ điều kiện"'),
        createTC('TC_VOUCHER_12', 'Áp dụng Voucher đã hết lượt', 'POS', 'Usage: 50/50', '1. Apply voucher', 'Báo lỗi "Voucher đã hết lượt sử dụng"'),
        createTC('TC_VOUCHER_13', 'Tìm kiếm Voucher', 'Page: Voucher', 'Search: SALE', '1. Tìm kiếm', 'Hiện voucher có chữ SALE'),
        createTC('TC_VOUCHER_14', 'Voucher giảm giá tối đa (Max cap)', 'Form Create', '10% max 20k', '1. Tạo voucher có max cap', 'Hệ thống ghi nhận giới hạn giảm'),
        createTC('TC_VOUCHER_15', 'Check logic giảm giá Max cap', 'POS', 'Bill 500k, 10% max 20k', '1. Tính: 50k > 20k', 'Chỉ giảm 20k (đúng logic)')
    ];
    return cases;
}

// 7. Module Quản lý Kho (INVENTORY) - Mới bổ sung
function createInventoryTestCases() {
    const cases = [
        createTC('TC_INV_01', 'Xem danh sách nguyên liệu', 'Quyền Manager', 'Page: Ingredients', '1. Vào trang Kho', 'Hiện list: Tên, Đơn vị, Tồn kho, Giá vốn'),
        createTC('TC_INV_02', 'Tạo nguyên liệu mới', 'Quyền Manager', 'Name: Sữa, Unit: ml', '1. Nhập info\n2. Lưu', 'Nguyên liệu mới xuất hiện, tồn kho = 0'),
        createTC('TC_INV_03', 'Quản lý Nhà cung cấp (Supplier)', 'Page: Supplier', 'Add Supplier', '1. Thêm NCC mới', 'Lưu thành công NCC'),
        createTC('TC_INV_04', 'Tạo đơn nhập hàng (Purchase Order)', 'Page: PO', 'Supplier A, Sữa: 100 hộp', '1. Tạo PO\n2. Chọn hàng', 'Đơn nhập trạng thái Draft/Pending'),
        createTC('TC_INV_05', 'Duyệt đơn nhập hàng', 'PO Pending', 'Action: Approve', '1. Duyệt đơn', 'Tồn kho tăng lên tương ứng'),
        createTC('TC_INV_06', 'Hủy đơn nhập hàng', 'PO Pending', 'Action: Cancel', '1. Hủy đơn', 'Trạng thái Cancelled, kho không tăng'),
        createTC('TC_INV_07', 'Thiết lập công thức (Recipe)', 'Product: Cafe Sữa', 'Recipe: 50ml Sữa + 20g Cafe', '1. Gán công thức', 'Lưu thành công'),
        createTC('TC_INV_08', 'Trừ kho tự động khi bán', 'POS', 'Bán 1 Cafe Sữa', '1. Hoàn thành đơn', 'Kho giảm: 50ml Sữa, 20g Cafe'),
        createTC('TC_INV_09', 'Cảnh báo tồn kho thấp', 'Settings', 'Min Alert: 10', '1. Bán hàng cho tồn < 10', 'Hệ thống hiện cảnh báo/đỏ'),
        createTC('TC_INV_10', 'Kiểm kê kho (Cân bằng kho)', 'Page: Audit', 'System: 10, Actual: 8', '1. Tạo phiếu kiểm kê\n2. Nhập thực tế 8', 'Kho cập nhật về 8, ghi log chênh lệch'),
        createTC('TC_INV_11', 'Xem lịch sử biến động kho', 'Ingredient Detail', 'Tab: History', '1. Xem lịch sử', 'Hiện rõ: Nhập, Bán, Kiểm kê'),
        createTC('TC_INV_12', 'Chặn bán khi hết nguyên liệu (Option)', 'Inventory', 'Stock: 0', '1. Cố bán món cần nguyên liệu đó', 'POS cảnh báo hết hàng (nếu bật config)'),
        createTC('TC_INV_13', 'Sửa đơn vị tính', 'Ingredient', 'Unit: kg -> g', '1. Sửa đơn vị', 'Cần validate hoặc warning ảnh hưởng công thức'),
        createTC('TC_INV_14', 'Xuất báo cáo tồn kho', 'Report', 'Action: Export', '1. Xuất file', 'File excel hiện tồn đầu, nhập, xuất, tồn cuối'),
        createTC('TC_INV_15', 'Xóa nguyên liệu chưa dùng', 'Ingredient', 'No Transaction', '1. Xóa', 'Xóa thành công'),
        createTC('TC_INV_16', 'Không xóa nguyên liệu đã có giao dịch', 'Ingredient', 'Has History', '1. Xóa', 'Báo lỗi "Nguyên liệu đã phát sinh dữ liệu"')
    ];
    return cases;
}

// --- Main Execution ---
function generateExcel() {
    // Tạo Workbook mới
    const workbook = XLSX.utils.book_new();

    // Tổng hợp các module
    const modules = [
        { name: '1. Auth', fn: createAuthTestCases },
        { name: '2. Order_POS', fn: createOrderTestCases },
        { name: '3. Table', fn: createTableTestCases },
        { name: '4. Staff', fn: createStaffTestCases },
        { name: '5. Customer', fn: createCustomerTestCases },
        { name: '6. Voucher', fn: createVoucherTestCases },
        { name: '7. Inventory', fn: createInventoryTestCases },
    ];

    let totalCases = 0;

    // Duyệt qua từng module để tạo sheet
    modules.forEach(mod => {
        const data = mod.fn();
        totalCases += data.length;
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Set độ rộng cột cho dễ nhìn
        const colWidths = [
            { wch: 15 }, // ID
            { wch: 40 }, // Summary
            { wch: 25 }, // Pre-condition
            { wch: 25 }, // Test Data
            { wch: 35 }, // Steps
            { wch: 40 }, // Expected
            { wch: 10 }, // Result
            { wch: 10 }, // Bug
            { wch: 15 }, // Notes
            { wch: 12 }, // Date
            { wch: 10 }  // Tester
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, mod.name);
    });

    // Xuất file
    const fileName = 'TestCases_CafeShop_Full.xlsx';
    XLSX.writeFile(workbook, fileName);
    
    console.log('================================================');
    console.log(`✅ Đã tạo file thành công: ${fileName}`);
    console.log(`📊 Tổng số Test Cases: ${totalCases}`);
    console.log(`👥 Testers tham gia: ${testers.join(', ')}`);
    console.log('================================================');
}

// Chạy hàm tạo file
generateExcel();