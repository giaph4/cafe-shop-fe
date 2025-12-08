# PHÂN TÍCH VÀ ĐỀ XUẤT CHỨC NĂNG MỚI

## TỔNG QUAN HỆ THỐNG

### Các API Module Chính:
1. **Orders** - Quản lý đơn hàng (14 endpoints)
2. **Products** - Quản lý sản phẩm (11 endpoints)
3. **Customers** - Quản lý khách hàng (8 endpoints)
4. **Shifts** - Quản lý ca làm việc (30+ endpoints)
5. **Shift Reports** - Báo cáo ca làm việc (3 endpoints)
6. **Vouchers** - Quản lý mã giảm giá (8 endpoints)
7. **Expenses** - Quản lý chi phí (5 endpoints)
8. **Purchase Orders** - Quản lý phiếu nhập (6 endpoints)
9. **Ingredients** - Quản lý nguyên liệu (6 endpoints)
10. **Suppliers** - Quản lý nhà cung cấp (5 endpoints)
11. **Tables** - Quản lý bàn (6 endpoints)
12. **Users** - Quản lý người dùng (8 endpoints)
13. **Reports** - Báo cáo tổng hợp (16 endpoints)
14. **Categories** - Quản lý danh mục (4 endpoints)
15. **Login History** - Lịch sử đăng nhập (1 endpoint)
16. **Shift Sessions** - Phiên làm việc (8 endpoints)
17. **Chat** - Hệ thống chat (15+ endpoints)
18. **Files** - Quản lý file (5 endpoints)
19. **Dashboards** - Dashboard theo role (3 endpoints)
20. **Admin Analytics** - Phân tích AI (2 endpoints)

---

## CHỨC NĂNG MỚI ĐỀ XUẤT

---

### 1. DỰ BÁO DOANH THU THÔNG MINH

**Tên chức năng:** Dự báo doanh thu thông minh dựa trên lịch sử và xu hướng

**Dữ liệu dùng từ API nào:**
- `getRevenueByDate(startDate, endDate)` - Doanh thu theo ngày
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng theo khoảng thời gian
- `getHourlySales(date)` - Doanh số theo giờ
- `getCategorySales(startDate, endDate)` - Doanh số theo danh mục
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy

**Cách kết hợp các API:**
1. Lấy dữ liệu doanh thu 3-6 tháng gần nhất qua `getRevenueByDate`
2. Lấy dữ liệu đơn hàng tương ứng qua `getOrdersByDateRange`
3. Phân tích xu hướng theo giờ qua `getHourlySales` (lấy nhiều ngày)
4. Phân tích xu hướng theo danh mục qua `getCategorySales`
5. Kết hợp với dữ liệu sản phẩm bán chạy từ `getBestSellers`
6. Tính toán xu hướng: tăng/giảm theo ngày trong tuần, theo tháng, theo mùa
7. Dự báo dựa trên: moving average, seasonal patterns, growth rate

**Luồng hoạt động:**
1. User chọn khoảng thời gian muốn dự báo (7 ngày, 30 ngày, 90 ngày)
2. Hệ thống tự động lấy dữ liệu lịch sử 3-6 tháng trước đó
3. Phân tích patterns: ngày trong tuần, giờ trong ngày, tháng trong năm
4. Tính toán dự báo với confidence interval (khoảng tin cậy)
5. Hiển thị biểu đồ so sánh dự báo vs thực tế (nếu có)
6. Cảnh báo nếu dự báo thấp hơn mục tiêu đã đặt

**Lợi ích:**
- **Cho người dùng:** Lập kế hoạch nhân sự, nguyên liệu, marketing dựa trên dự báo
- **Cho hệ thống:** Tối ưu inventory, staffing, marketing campaigns
- **Giá trị kinh doanh:** Giảm waste, tăng hiệu quả vận hành, cải thiện cash flow

**Gợi ý UI:**
- Dashboard card hiển thị dự báo doanh thu 7/30 ngày tới
- Biểu đồ line chart: Lịch sử (màu xám) + Dự báo (màu xanh) + Confidence band (màu nhạt)
- Bảng chi tiết: Ngày, Dự báo, Confidence, So với hôm qua, So với tuần trước
- Filter: Theo danh mục, theo giờ, theo ngày trong tuần
- Export Excel dự báo

**Mở rộng nâng cấp:**
- Machine Learning model để dự báo chính xác hơn
- Tích hợp yếu tố bên ngoài: thời tiết, sự kiện, lễ tết
- Dự báo theo từng sản phẩm/category cụ thể
- Auto-adjust dự báo dựa trên thực tế (self-learning)
- Alert khi dự báo sai lệch lớn với thực tế

---

### 2. PHÂN TÍCH HIỆU QUẢ MARKETING VÀ VOUCHER

**Tên chức năng:** Phân tích ROI của voucher và chiến dịch marketing

**Dữ liệu dùng từ API nào:**
- `getVoucherSummary()` - Tổng quan voucher
- `searchVouchers()` - Danh sách voucher với filter
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng có dùng voucher
- `getAdminMetrics(from, to)` - Metrics tổng hợp (có voucherUsageCount)
- `getRevenueByDate(startDate, endDate)` - Doanh thu theo ngày
- `getTopCustomers(startDate, endDate)` - Top khách hàng

**Cách kết hợp các API:**
1. Lấy danh sách voucher active qua `searchVouchers({active: true})`
2. Với mỗi voucher, lấy orders trong khoảng thời gian voucher valid
3. Tính toán: số lần dùng, tổng discount, tổng revenue từ voucher, số khách hàng mới
4. So sánh doanh thu ngày có voucher vs không có voucher qua `getRevenueByDate`
5. Phân tích khách hàng mới từ `getTopCustomers` (so sánh trước/sau khi có voucher)
6. Tính ROI = (Revenue từ voucher - Discount amount) / Marketing cost (nếu có)

**Luồng hoạt động:**
1. User chọn khoảng thời gian và voucher muốn phân tích
2. Hệ thống lấy tất cả orders có dùng voucher trong khoảng thời gian
3. Tính metrics: Usage count, Total discount, Revenue generated, New customers acquired
4. So sánh với baseline (ngày không có voucher) để tính incremental revenue
5. Tính ROI, Cost per acquisition, Average order value với voucher
6. Hiển thị dashboard với charts và insights

**Lợi ích:**
- **Cho người dùng:** Biết voucher nào hiệu quả, nên tạo voucher gì tiếp theo
- **Cho hệ thống:** Tối ưu chiến lược voucher, tránh lãng phí
- **Giá trị kinh doanh:** Tăng ROI marketing, tối ưu ngân sách voucher

**Gợi ý UI:**
- Dashboard với cards: Total vouchers, Active vouchers, Total usage, Total discount, ROI
- Bảng so sánh voucher: Code, Usage, Discount given, Revenue generated, ROI, Status
- Biểu đồ: Voucher usage over time, Revenue impact chart
- Filter: Theo voucher code, theo type, theo khoảng thời gian
- Detail view: Click vào voucher để xem chi tiết orders, customers, timeline
- Export report

**Mở rộng nâng cấp:**
- A/B testing cho voucher (so sánh 2 voucher strategies)
- Predictive analytics: Dự đoán voucher nào sẽ hiệu quả
- Auto-suggest voucher parameters dựa trên lịch sử
- Tích hợp với email/SMS marketing để track campaign
- Customer segmentation: Voucher nào phù hợp với segment nào

---

### 3. QUẢN LÝ TỒN KHO THÔNG MINH VÀ TỰ ĐỘNG ĐẶT HÀNG

**Tên chức năng:** Hệ thống cảnh báo và đề xuất đặt hàng tự động

**Dữ liệu dùng từ API nào:**
- `getIngredients({name, page, size})` - Danh sách nguyên liệu
- `getInventoryReport(lowStock)` - Báo cáo tồn kho
- `getProductRecipe(productId)` - Công thức sản phẩm
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy
- `getPurchaseOrders(filters)` - Lịch sử đặt hàng
- `getSuppliers()` - Danh sách nhà cung cấp
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng để tính consumption rate

**Cách kết hợp các API:**
1. Lấy danh sách nguyên liệu low stock qua `getInventoryReport(true)`
2. Với mỗi nguyên liệu, tính consumption rate từ orders gần đây:
   - Lấy orders 30 ngày qua qua `getOrdersByDateRange`
   - Với mỗi order, lấy order details (có productId)
   - Lấy recipe của từng product qua `getProductRecipe`
   - Tính tổng nguyên liệu đã dùng = sum(quantity * recipe.amount)
   - Consumption rate = total used / 30 days
3. Dự báo số ngày còn lại = current stock / consumption rate
4. Nếu < reorder level hoặc < số ngày lead time, đề xuất đặt hàng
5. Lấy lịch sử purchase orders để biết supplier và giá
6. Tự động tạo purchase order suggestion với số lượng đề xuất

**Luồng hoạt động:**
1. Hệ thống tự động chạy kiểm tra mỗi ngày (hoặc real-time khi có order)
2. Tính toán consumption rate cho mỗi nguyên liệu
3. So sánh với reorder level và lead time
4. Tạo alerts: Critical (hết trong 1-2 ngày), Warning (hết trong 3-5 ngày), Info (hết trong 6-10 ngày)
5. Đề xuất purchase order với: Ingredient, Supplier, Suggested quantity, Estimated cost
6. Manager có thể approve và tạo purchase order ngay từ suggestion

**Lợi ích:**
- **Cho người dùng:** Không bao giờ hết nguyên liệu, tối ưu chi phí tồn kho
- **Cho hệ thống:** Tự động hóa, giảm manual work, tránh stockout
- **Giá trị kinh doanh:** Giảm waste, tối ưu cash flow, đảm bảo service quality

**Gợi ý UI:**
- Dashboard với alert cards: Critical (đỏ), Warning (vàng), Info (xanh)
- Bảng nguyên liệu: Name, Current stock, Reorder level, Consumption rate, Days remaining, Status, Action
- Chart: Stock level over time với reorder level line
- Modal "Create Purchase Order" từ suggestion với pre-filled data
- Filter: Theo status (critical/warning/info), theo supplier
- Auto-refresh mỗi 5 phút hoặc khi có order mới

**Mở rộng nâng cấp:**
- Machine Learning để dự báo consumption chính xác hơn
- Tích hợp với supplier API để auto-order (nếu có)
- Economic Order Quantity (EOQ) calculation
- Safety stock calculation dựa trên variability
- Multi-supplier comparison để chọn supplier tốt nhất
- Batch ordering để tối ưu shipping cost

---

### 4. PHÂN TÍCH HIỆU SUẤT NHÂN VIÊN TOÀN DIỆN

**Tên chức năng:** Dashboard phân tích hiệu suất nhân viên tích hợp nhiều metrics

**Dữ liệu dùng từ API nào:**
- `getStaffPerformance(startDate, endDate)` - Hiệu suất nhân viên
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng để tính theo staff
- `getAssignmentsByUserId(userId)` - Lịch sử ca làm việc
- `getAttendanceByAssignment(assignmentId)` - Chấm công
- `getAdjustmentsByAssignment(assignmentId)` - Thưởng/phạt
- `getShiftReport(sessionId)` - Báo cáo ca làm việc
- `listPayrollSummaries({userId})` - Lương thưởng
- `getUserActivityLogs(userId)` - Activity logs

**Cách kết hợp các API:**
1. Lấy danh sách staff từ `getUsers({role: 'STAFF'})`
2. Với mỗi staff:
   - Lấy orders của họ qua `getOrdersByDateRange` (filter by userId)
   - Lấy assignments qua `getAssignmentsByUserId`
   - Với mỗi assignment, lấy attendance và adjustments
   - Lấy shift reports từ sessions của họ
   - Tính metrics: Revenue, Orders count, Average order value, Attendance rate, On-time rate, Tips earned, Bonuses, Penalties
3. So sánh với team average và top performers
4. Tính performance score = weighted average của các metrics
5. Phân tích trends: cải thiện hay giảm sút

**Luồng hoạt động:**
1. Manager chọn khoảng thời gian và staff muốn xem
2. Hệ thống aggregate dữ liệu từ nhiều nguồn
3. Tính toán comprehensive metrics
4. Hiển thị dashboard với:
   - Overview cards: Performance score, Revenue, Orders, Attendance
   - Charts: Performance over time, Comparison với team
   - Tables: Chi tiết từng metric, Shift history, Adjustments
5. Có thể export report cho từng staff

**Lợi ích:**
- **Cho người dùng:** Đánh giá công bằng, phát hiện nhân viên xuất sắc/cần hỗ trợ
- **Cho hệ thống:** Data-driven decisions cho payroll, promotions, training
- **Giá trị kinh doanh:** Tối ưu team performance, giữ chân nhân tài, cải thiện service

**Gợi ý UI:**
- Dashboard với tabs: Overview, Performance, Attendance, Financial, Trends
- Leaderboard: Top performers với metrics
- Individual staff page: Chi tiết đầy đủ với charts và tables
- Comparison view: So sánh 2-3 staff với nhau
- Filter: Theo khoảng thời gian, theo role, theo shift
- Export: PDF report cho performance review

**Mở rộng nâng cấp:**
- 360 feedback integration
- Goal setting và tracking
- Performance improvement plans tự động
- Predictive analytics: Dự đoán nhân viên nào có nguy cơ nghỉ việc
- Gamification: Badges, achievements, leaderboards
- Integration với training system

---

### 5. PHÂN TÍCH KHÁCH HÀNG VÀ CHIẾN LƯỢC LOYALTY

**Tên chức năng:** Phân tích hành vi khách hàng và đề xuất chương trình loyalty

**Dữ liệu dùng từ API nào:**
- `getCustomers({keyword, page, size})` - Danh sách khách hàng
- `getCustomerPurchaseHistory({id, startDate, endDate})` - Lịch sử mua hàng
- `getTopCustomers(startDate, endDate)` - Top khách hàng
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng để phân tích
- `getCategorySales(startDate, endDate)` - Phân tích theo category
- `getBestSellers(startDate, endDate)` - Sản phẩm yêu thích

**Cách kết hợp các API:**
1. Lấy danh sách customers qua `getCustomers`
2. Với mỗi customer:
   - Lấy purchase history qua `getCustomerPurchaseHistory`
   - Tính metrics: Total spend, Order count, Average order value, Frequency, Last visit, Favorite products/categories
3. Phân loại customers: VIP, Regular, Occasional, At-risk (không mua lâu)
4. Phân tích patterns: Thời gian mua (giờ/ngày), Sản phẩm yêu thích, Category preferences
5. So sánh với top customers để tìm gaps
6. Đề xuất: Voucher phù hợp, Sản phẩm recommend, Re-engagement campaigns

**Luồng hoạt động:**
1. Hệ thống tự động phân tích customers định kỳ
2. Phân loại và gán tags: VIP, Regular, At-risk, New
3. Tính customer lifetime value (CLV) và RFM score (Recency, Frequency, Monetary)
4. Hiển thị dashboard với:
   - Customer segments với số lượng và metrics
   - Top customers list
   - At-risk customers cần re-engagement
   - Insights: Trends, Patterns, Recommendations
5. Manager có thể tạo targeted campaigns cho từng segment

**Lợi ích:**
- **Cho người dùng:** Hiểu khách hàng, tạo campaigns hiệu quả, tăng retention
- **Cho hệ thống:** Data-driven marketing, tối ưu customer experience
- **Giá trị kinh doanh:** Tăng customer lifetime value, giảm churn, tăng revenue

**Gợi ý UI:**
- Dashboard với customer segments cards: VIP, Regular, Occasional, At-risk
- Customer list với filters: Segment, Spend range, Last visit
- Individual customer profile: Purchase history, Preferences, Recommendations
- RFM analysis chart: Scatter plot Recency vs Frequency
- Campaign builder: Tạo voucher/campaign cho segment cụ thể
- Export: Customer list với tags và metrics

**Mở rộng nâng cấp:**
- Loyalty points system tích hợp
- Personalized recommendations dựa trên AI
- Predictive churn analysis
- Customer journey mapping
- Integration với email/SMS marketing
- Referral program tracking
- Birthday/anniversary campaigns tự động

---

### 6. PHÂN TÍCH LỢI NHUẬN THEO SẢN PHẨM VÀ DANH MỤC

**Tên chức năng:** Phân tích profit margin và đề xuất pricing strategy

**Dữ liệu dùng từ API nào:**
- `getProducts(filters)` - Danh sách sản phẩm (có cost và price)
- `getProductRecipe(productId)` - Công thức để tính cost
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy
- `getCategorySales(startDate, endDate)` - Doanh số theo category
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng để tính revenue
- `getProfitReport(startDate, endDate)` - Báo cáo lợi nhuận tổng
- `getTotalImportedIngredientCost(startDate, endDate)` - Chi phí nguyên liệu

**Cách kết hợp các API:**
1. Lấy danh sách products qua `getProducts`
2. Với mỗi product:
   - Lấy recipe qua `getProductRecipe` để tính cost per unit
   - Lấy orders có product này qua `getOrdersByDateRange` (filter by productId trong orderDetails)
   - Tính: Revenue = sum(quantity * price), Cost = sum(quantity * cost), Profit = Revenue - Cost, Margin = Profit / Revenue
3. Phân tích theo category qua `getCategorySales`
4. So sánh với best sellers để tìm products có margin thấp nhưng bán nhiều
5. Đề xuất: Tăng giá, Giảm cost, Bundle với products khác, Discontinue nếu không profitable

**Luồng hoạt động:**
1. Hệ thống tính profit margin cho mỗi product trong khoảng thời gian
2. Phân loại: High margin high volume (stars), High margin low volume (cash cows), Low margin high volume (cần optimize), Low margin low volume (cần review)
3. Hiển thị dashboard với:
   - Profitability matrix: Margin vs Volume scatter plot
   - Top profitable products
   - Products cần attention (low margin)
   - Category profitability comparison
4. Đề xuất actions: Price adjustments, Cost optimization, Product mix changes

**Lợi ích:**
- **Cho người dùng:** Tối ưu pricing, focus vào products profitable, cải thiện margin
- **Cho hệ thống:** Data-driven pricing decisions, inventory optimization
- **Giá trị kinh doanh:** Tăng profitability, tối ưu product mix, cải thiện bottom line

**Gợi ý UI:**
- Dashboard với profitability matrix (scatter plot)
- Bảng products: Name, Revenue, Cost, Profit, Margin, Volume, Status
- Category comparison: Bar chart so sánh margin theo category
- Product detail: Cost breakdown, Price history, Margin trends
- Pricing suggestions: Modal với recommended price và impact analysis
- Filter: Theo category, theo margin range, theo volume

**Mở rộng nâng cấp:**
- Dynamic pricing dựa trên demand và inventory
- Competitor price tracking (nếu có data)
- Price elasticity analysis
- Bundle optimization: Tìm products nên bundle để tăng margin
- Seasonal pricing recommendations
- A/B testing cho pricing

---

### 7. DỰ BÁO NHU CẦU NGUYÊN LIỆU DỰA TRÊN ĐƠN HÀNG

**Tên chức năng:** Dự báo nhu cầu nguyên liệu dựa trên đơn hàng và xu hướng

**Dữ liệu dùng từ API nào:**
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng để tính consumption
- `getProductRecipe(productId)` - Công thức sản phẩm
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy để dự báo
- `getIngredients()` - Danh sách nguyên liệu
- `getInventoryReport()` - Tồn kho hiện tại
- `getHourlySales(date)` - Xu hướng theo giờ

**Cách kết hợp các API:**
1. Lấy orders 30-90 ngày qua qua `getOrdersByDateRange`
2. Với mỗi order, lấy order details (products và quantity)
3. Với mỗi product, lấy recipe qua `getProductRecipe`
4. Tính consumption: Với mỗi nguyên liệu, sum(quantity * recipe.amount) qua tất cả orders
5. Phân tích trends: Consumption theo ngày, theo giờ, theo sản phẩm
6. Dự báo nhu cầu 7/30 ngày tới dựa trên:
   - Historical consumption rate
   - Seasonal patterns (nếu có)
   - Best sellers trends
7. So sánh với current stock để đề xuất đặt hàng

**Luồng hoạt động:**
1. Hệ thống tự động tính consumption rate mỗi ngày
2. Phân tích patterns: Ngày trong tuần, Giờ trong ngày, Sản phẩm trends
3. Dự báo nhu cầu với confidence interval
4. So sánh với stock hiện tại và reorder level
5. Tạo alerts và purchase suggestions
6. Hiển thị dashboard với: Current stock, Consumption rate, Forecast, Days remaining, Suggested order

**Lợi ích:**
- **Cho người dùng:** Đảm bảo không thiếu nguyên liệu, tối ưu inventory
- **Cho hệ thống:** Tự động hóa, giảm waste, tối ưu cash flow
- **Giá trị kinh doanh:** Tránh stockout, giảm overstock, cải thiện service quality

**Gợi ý UI:**
- Dashboard với cards: Critical ingredients, Forecast accuracy, Suggested orders
- Bảng ingredients: Name, Current stock, Consumption rate, Forecast 7d/30d, Days remaining, Status
- Charts: Consumption over time, Forecast vs Actual (nếu có), Stock level projection
- Alerts: Critical (đỏ), Warning (vàng), Info (xanh)
- One-click create purchase order từ forecast

**Mở rộng nâng cấp:**
- Machine Learning để dự báo chính xác hơn
- Tích hợp với supplier lead time
- Safety stock calculation tự động
- Multi-ingredient optimization (ingredients dùng chung)
- Seasonal adjustment factors
- Event-based forecasting (lễ tết, sự kiện)

---

### 8. PHÂN TÍCH HIỆU QUẢ CA LÀM VIỆC VÀ TỐI ƯU SCHEDULING

**Tên chức năng:** Phân tích hiệu quả ca làm việc và đề xuất tối ưu lịch làm việc

**Dữ liệu dùng từ API nào:**
- `listShiftInstances(filters)` - Danh sách ca làm việc
- `getShiftReport(sessionId)` - Báo cáo ca làm việc
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng theo ca
- `getHourlySales(date)` - Doanh số theo giờ
- `getAssignmentsForShift(shiftId)` - Nhân viên trong ca
- `getAttendanceByShift(shiftId)` - Chấm công ca
- `getStaffPerformance(startDate, endDate)` - Hiệu suất nhân viên

**Cách kết hợp các API:**
1. Lấy danh sách shift instances trong khoảng thời gian
2. Với mỗi shift:
   - Lấy shift report để biết revenue, orders
   - Lấy orders trong ca qua `getOrdersByDateRange` (filter by shiftSessionId)
   - Lấy assignments để biết số nhân viên
   - Tính metrics: Revenue per staff, Orders per staff, Efficiency score
3. Phân tích theo giờ qua `getHourlySales` để biết peak hours
4. So sánh shifts: Same time slot khác ngày để tìm patterns
5. Đề xuất: Tăng/giảm staff trong ca, Thay đổi shift times, Optimal staffing levels

**Luồng hoạt động:**
1. Manager chọn khoảng thời gian muốn phân tích
2. Hệ thống aggregate dữ liệu từ shifts
3. Tính toán efficiency metrics
4. Phân tích patterns: Peak hours, Optimal staffing, Best performing shifts
5. Hiển thị dashboard với:
   - Shift efficiency comparison
   - Hourly demand vs staffing chart
   - Recommendations cho scheduling
6. Có thể apply recommendations vào shift templates

**Lợi ích:**
- **Cho người dùng:** Tối ưu nhân sự, giảm over/under staffing, cải thiện service
- **Cho hệ thống:** Data-driven scheduling, cost optimization
- **Giá trị kinh doanh:** Giảm labor cost, tăng service quality, cải thiện profitability

**Gợi ý UI:**
- Dashboard với shift efficiency cards
- Calendar view: Hiển thị shifts với color coding theo efficiency
- Charts: Hourly demand vs staffing, Shift comparison
- Recommendations panel: Suggested changes với impact analysis
- One-click apply: Apply recommendations vào shift templates
- Filter: Theo ngày, theo ca, theo staff

**Mở rộng nâng cấp:**
- Auto-scheduling dựa trên forecast và constraints
- Staff preferences integration
- Labor cost optimization
- Skill-based scheduling (assign staff phù hợp với demand)
- Real-time adjustments dựa trên current demand
- Integration với attendance để auto-adjust

---

### 9. PHÂN TÍCH TỶ LỆ HỦY ĐƠN VÀ CẢI THIỆN

**Tên chức năng:** Phân tích nguyên nhân hủy đơn và đề xuất cải thiện

**Dữ liệu dùng từ API nào:**
- `getOrdersByStatus('CANCELLED')` - Đơn hàng đã hủy
- `getOrdersByDateRange(startDate, endDate)` - Tất cả đơn hàng để tính cancellation rate
- `getOrdersByStatus(status)` - Đơn hàng theo status
- `getHourlySales(date)` - Doanh số theo giờ (để tìm correlation)
- `getProductById(id)` - Thông tin sản phẩm (nếu có sản phẩm thường bị hủy)
- `getTableById(id)` - Thông tin bàn (nếu liên quan đến table)

**Cách kết hợp các API:**
1. Lấy cancelled orders qua `getOrdersByStatus('CANCELLED')`
2. Lấy total orders qua `getOrdersByDateRange` để tính cancellation rate
3. Phân tích patterns:
   - Theo giờ: Giờ nào có tỷ lệ hủy cao?
   - Theo sản phẩm: Sản phẩm nào thường bị hủy?
   - Theo bàn: Bàn nào có nhiều đơn hủy?
   - Theo thời gian chờ: Đơn chờ lâu có tỷ lệ hủy cao hơn?
4. Tính financial impact: Revenue lost từ cancelled orders
5. Đề xuất: Tối ưu thời gian chế biến, Cải thiện service, Điều chỉnh menu

**Luồng hoạt động:**
1. Hệ thống tự động track cancellation rate
2. Phân tích cancelled orders để tìm patterns
3. Tính toán impact: Revenue lost, Customer satisfaction impact
4. Hiển thị dashboard với:
   - Cancellation rate trends
   - Top reasons (nếu có data)
   - Products/tables/hours với high cancellation
   - Financial impact
5. Đề xuất actionable improvements

**Lợi ích:**
- **Cho người dùng:** Giảm waste, cải thiện customer experience, tăng revenue
- **Cho hệ thống:** Data-driven improvements, quality control
- **Giá trị kinh doanh:** Giảm revenue loss, tăng customer satisfaction, cải thiện operations

**Gợi ý UI:**
- Dashboard với cancellation rate card và trend chart
- Bảng cancelled orders: Order ID, Time, Products, Reason (nếu có), Revenue lost
- Analysis: Cancellation by hour, by product, by table
- Impact calculator: Total revenue lost, Potential recovery
- Recommendations panel với actionable items
- Filter: Theo khoảng thời gian, theo sản phẩm, theo bàn

**Mở rộng nâng cấp:**
- Predictive cancellation: Dự đoán đơn nào có nguy cơ hủy
- Auto-intervention: Tự động offer discount hoặc priority cho đơn có nguy cơ hủy
- Customer feedback integration
- Root cause analysis tự động
- A/B testing cho improvements
- Integration với kitchen display system để track preparation time

---

### 10. BÁO CÁO TỔNG HỢP THEO THỜI GIAN THỰC (REAL-TIME DASHBOARD)

**Tên chức năng:** Dashboard tổng hợp real-time với auto-refresh và alerts

**Dữ liệu dùng từ API nào:**
- `getAdminDashboard({range, from, to})` - Dashboard admin
- `getManagerDashboard()` - Dashboard manager
- `getStaffDashboard(userId)` - Dashboard staff
- `getOrdersByStatus('PENDING')` - Đơn hàng đang chờ
- `getInventoryReport(true)` - Nguyên liệu sắp hết
- `getTables()` - Trạng thái bàn
- `getCurrentShiftSession()` - Ca làm việc hiện tại
- WebSocket events (nếu có) - Real-time updates

**Cách kết hợp các API:**
1. Lấy dashboard data từ role-appropriate API
2. Lấy real-time data: Pending orders, Low stock items, Table status
3. Tính toán KPIs: Revenue today, Orders today, Active tables, Staff on duty
4. Tạo alerts: Critical orders, Low stock, Table issues
5. Auto-refresh mỗi 30 giây hoặc khi có event
6. Cache và incremental updates để tối ưu performance

**Luồng hoạt động:**
1. User mở dashboard
2. Hệ thống load initial data
3. Setup auto-refresh timer (30s-1min)
4. Listen to WebSocket events (nếu có) cho real-time updates
5. Hiển thị với color coding: Green (good), Yellow (warning), Red (critical)
6. Alerts hiển thị ở top với sound/notification (optional)

**Lợi ích:**
- **Cho người dùng:** Cập nhật thông tin ngay lập tức, phản ứng nhanh với issues
- **Cho hệ thống:** Proactive management, better decision making
- **Giá trị kinh doanh:** Tăng efficiency, giảm response time, cải thiện service

**Gợi ý UI:**
- Dashboard với cards: Revenue, Orders, Tables, Staff, Alerts
- Real-time indicators: Blinking dots, timestamps
- Alert panel: Critical issues với actions
- Charts với live updates
- Filter và time range selector
- Fullscreen mode cho monitoring
- Mobile-responsive

**Mở rộng nâng cấp:**
- WebSocket integration cho true real-time
- Push notifications cho critical alerts
- Customizable widgets
- Multiple dashboard views (operations, financial, inventory)
- Export snapshot
- Historical comparison (so với cùng thời điểm hôm qua/tuần trước)

---

### 11. PHÂN TÍCH XU HƯỚNG VÀ SEASONAL PATTERNS

**Tên chức năng:** Phân tích xu hướng dài hạn và seasonal patterns

**Dữ liệu dùng từ API nào:**
- `getRevenueByDate(startDate, endDate)` - Doanh thu theo ngày (lấy 1-2 năm)
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng (lấy 1-2 năm)
- `getCategorySales(startDate, endDate)` - Doanh số theo category
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy
- `getHourlySales(date)` - Doanh số theo giờ (lấy nhiều ngày)
- `getPaymentMethodStats(startDate, endDate)` - Phương thức thanh toán

**Cách kết hợp các API:**
1. Lấy dữ liệu 1-2 năm qua các API
2. Phân tích patterns:
   - Weekly patterns: Thứ mấy bán tốt nhất?
   - Monthly patterns: Tháng nào peak?
   - Seasonal patterns: Mùa nào bán tốt?
   - Hourly patterns: Giờ nào peak?
   - Category trends: Category nào đang tăng/giảm?
3. Tính growth rates: Week-over-week, Month-over-month, Year-over-year
4. Identify anomalies: Ngày/giờ bất thường
5. Forecast dựa trên seasonal patterns

**Luồng hoạt động:**
1. User chọn metric muốn phân tích (Revenue, Orders, Category, etc.)
2. Hệ thống lấy historical data
3. Phân tích và identify patterns
4. Hiển thị với:
   - Trend charts với annotations
   - Seasonal decomposition
   - Growth metrics
   - Anomaly detection
5. Export insights report

**Lợi ích:**
- **Cho người dùng:** Hiểu business cycles, lập kế hoạch dài hạn, tối ưu operations
- **Cho hệ thống:** Strategic planning, resource allocation
- **Giá trị kinh doanh:** Tăng strategic decision making, cải thiện long-term planning

**Gợi ý UI:**
- Dashboard với multiple time series charts
- Pattern indicators: Weekly, Monthly, Seasonal
- Growth metrics cards: WoW, MoM, YoY
- Anomaly alerts: Unusual days/weeks
- Comparison view: So sánh periods
- Export: PDF report với insights

**Mở rộng nâng cấp:**
- Machine Learning cho pattern detection
- Predictive analytics dựa trên patterns
- External factors integration (weather, events)
- Automated insights generation
- Custom pattern detection (user-defined)
- Integration với marketing calendar

---

### 12. TỐI ƯU MENU VÀ PRODUCT MIX

**Tên chức năng:** Phân tích menu và đề xuất tối ưu product mix

**Dữ liệu dùng từ API nào:**
- `getProducts(filters)` - Danh sách sản phẩm
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy
- `getCategorySales(startDate, endDate)` - Doanh số theo category
- `getProductSalesSummary(startDate, endDate)` - Tổng quan doanh số sản phẩm
- `getProfitReport(startDate, endDate)` - Lợi nhuận
- `getProductRecipe(productId)` - Công thức (để tính cost)
- `toggleProductAvailability(id)` - Bật/tắt sản phẩm

**Cách kết hợp các API:**
1. Lấy danh sách products
2. Tính metrics cho mỗi product:
   - Sales volume, Revenue, Profit margin, Popularity rank
3. Phân tích category performance
4. Identify:
   - Star products: High volume + High margin
   - Cash cows: Low volume + High margin
   - Dogs: Low volume + Low margin (cần review)
   - Question marks: High volume + Low margin (cần optimize)
5. Đề xuất:
   - Products nên promote
   - Products nên discontinue
   - Products cần optimize (price hoặc cost)
   - Menu gaps (categories thiếu)

**Luồng hoạt động:**
1. Hệ thống phân tích products trong khoảng thời gian
2. Tính toán metrics và phân loại
3. Hiển thị product portfolio matrix
4. Đề xuất actions với impact analysis
5. Manager có thể apply changes: Toggle availability, Adjust price, Promote

**Lợi ích:**
- **Cho người dùng:** Tối ưu menu, focus vào products profitable, cải thiện customer experience
- **Cho hệ thống:** Data-driven menu decisions, inventory optimization
- **Giá trị kinh doanh:** Tăng profitability, tối ưu operations, cải thiện menu appeal

**Gợi ý UI:**
- Product portfolio matrix (BCG-style)
- Bảng products với metrics và recommendations
- Category performance comparison
- Action panel: Apply changes với preview
- Filter: Theo category, theo status, theo performance

**Mở rộng nâng cấp:**
- A/B testing cho menu changes
- Customer feedback integration
- Competitor menu analysis (nếu có)
- Seasonal menu suggestions
- Bundle recommendations
- Menu engineering optimization

---

### 13. PHÂN TÍCH CHI PHÍ VÀ TỐI ƯU NGÂN SÁCH

**Tên chức năng:** Phân tích chi phí toàn diện và đề xuất tối ưu ngân sách

**Dữ liệu dùng từ API nào:**
- `getExpenses(startDate, endDate)` - Chi phí
- `getExpensesByDate(startDate, endDate)` - Chi phí theo ngày
- `getTotalExpenses(startDate, endDate)` - Tổng chi phí
- `getTotalImportedIngredientCost(startDate, endDate)` - Chi phí nguyên liệu
- `getProfitReport(startDate, endDate)` - Báo cáo lợi nhuận
- `getRevenueByDate(startDate, endDate)` - Doanh thu
- `listPayrollSummaries({startDate, endDate})` - Lương nhân viên

**Cách kết hợp các API:**
1. Lấy tất cả expenses qua `getExpenses`
2. Phân loại: Ingredients, Labor, Rent, Utilities, Marketing, Other
3. Tính tỷ lệ: Cost/Revenue ratio, Cost per order, Cost per customer
4. So sánh với revenue để tính profit margin
5. Phân tích trends: Cost tăng/giảm, Budget vs Actual
6. Đề xuất: Cắt giảm chi phí không cần thiết, Tối ưu categories có cost cao

**Luồng hoạt động:**
1. Hệ thống aggregate expenses theo category
2. Tính toán cost ratios và trends
3. So sánh với budget (nếu có) hoặc historical average
4. Identify cost drivers và anomalies
5. Hiển thị dashboard với:
   - Cost breakdown charts
   - Cost trends
   - Budget vs Actual
   - Recommendations
6. Export cost analysis report

**Lợi ích:**
- **Cho người dùng:** Kiểm soát chi phí, tối ưu ngân sách, cải thiện profitability
- **Cho hệ thống:** Financial control, cost optimization
- **Giá trị kinh doanh:** Tăng profit margin, cải thiện cash flow, sustainable growth

**Gợi ý UI:**
- Dashboard với cost breakdown pie chart
- Cost trends line chart
- Budget vs Actual comparison
- Top cost categories table
- Recommendations panel
- Export: Excel/PDF report

**Mở rộng nâng cấp:**
- Budget planning và tracking
- Cost allocation (theo department, theo product)
- Variance analysis tự động
- Cost forecasting
- Integration với accounting system
- Automated cost alerts

---

### 14. PHÂN TÍCH HIỆU QUẢ BÀN VÀ TỐI ƯU LAYOUT

**Tên chức năng:** Phân tích hiệu quả sử dụng bàn và đề xuất tối ưu layout

**Dữ liệu dùng từ API nào:**
- `getTables()` - Danh sách bàn
- `getOrdersByDateRange(startDate, endDate)` - Đơn hàng (có tableId)
- `getTableById(id)` - Chi tiết bàn
- `getHourlySales(date)` - Doanh số theo giờ (để tính utilization)

**Cách kết hợp các API:**
1. Lấy danh sách tables
2. Với mỗi table:
   - Lấy orders của table qua `getOrdersByDateRange` (filter by tableId)
   - Tính: Utilization rate, Average order value, Average duration, Revenue per hour
3. Phân tích: Tables nào hiệu quả nhất? Tables nào ít được dùng?
4. So sánh với capacity: Tables lớn có utilization tốt hơn tables nhỏ?
5. Đề xuất: Thay đổi layout, Thay đổi capacity, Reposition tables

**Luồng hoạt động:**
1. Hệ thống track table utilization trong khoảng thời gian
2. Tính toán metrics cho mỗi table
3. Phân tích patterns: Vị trí, Size, Utilization correlation
4. Hiển thị dashboard với:
   - Table utilization heatmap
   - Top/bottom performing tables
   - Recommendations
5. Visual layout editor để test changes

**Lợi ích:**
- **Cho người dùng:** Tối ưu không gian, tăng capacity, cải thiện customer experience
- **Cho hệ thống:** Space optimization, revenue optimization
- **Giá trị kinh doanh:** Tăng revenue per square foot, cải thiện layout efficiency

**Gợi ý UI:**
- Visual table map với color coding (utilization)
- Table performance table
- Layout editor (drag & drop)
- Recommendations với impact analysis
- Filter: Theo size, theo vị trí, theo performance

**Mở rộng nâng cấp:**
- 3D layout visualization
- Customer flow analysis
- Peak time utilization
- Reservation optimization
- Table assignment algorithm
- Integration với POS để real-time table status

---

### 15. BÁO CÁO TỔNG HỢP CHO INVESTORS/STAKEHOLDERS

**Tên chức năng:** Tự động tạo báo cáo tổng hợp chuyên nghiệp cho stakeholders

**Dữ liệu dùng từ API nào:**
- `getAdminDashboard({range, from, to})` - Dashboard metrics
- `getAdminMetrics({from, to})` - Metrics chi tiết
- `getProfitReport(startDate, endDate)` - Lợi nhuận
- `getRevenueByDate(startDate, endDate)` - Doanh thu
- `getTopCustomers(startDate, endDate)` - Top khách hàng
- `getStaffPerformance(startDate, endDate)` - Hiệu suất nhân viên
- `getBestSellers(startDate, endDate)` - Sản phẩm bán chạy
- `getExpensesByDate(startDate, endDate)` - Chi phí
- Tất cả các API reports khác

**Cách kết hợp các API:**
1. Lấy comprehensive data từ tất cả report APIs
2. Aggregate và format theo structure chuyên nghiệp:
   - Executive Summary
   - Financial Performance (Revenue, Profit, Expenses)
   - Operational Metrics (Orders, Customers, Staff)
   - Product Performance
   - Customer Insights
   - Staff Performance
   - Trends và Forecasts
3. Tạo visualizations: Charts, Graphs, Tables
4. Generate PDF/Excel report với branding

**Luồng hoạt động:**
1. User chọn: Period, Sections muốn include, Format (PDF/Excel)
2. Hệ thống gather data từ các APIs
3. Generate report với professional formatting
4. Include: Summary, Detailed sections, Charts, Insights
5. Export và có thể schedule auto-generation

**Lợi ích:**
- **Cho người dùng:** Tiết kiệm thời gian, professional reports, dễ share với stakeholders
- **Cho hệ thống:** Automated reporting, consistency
- **Giá trị kinh doanh:** Better communication với investors, data-driven decisions

**Gợi ý UI:**
- Report builder: Chọn sections, period, format
- Preview: Xem trước report
- Templates: Pre-defined report templates
- Schedule: Auto-generate và email reports
- Export: PDF, Excel, PowerPoint
- Share: Direct link hoặc email

**Mở rộng nâng cấp:**
- Custom branding (logo, colors)
- Multiple languages
- Interactive reports (web-based)
- Automated insights generation (AI)
- Comparison reports (period over period)
- Integration với email để auto-send

---

## TỔNG KẾT

### Các chức năng được đề xuất đều:
✅ **Khả thi ngay** - Dùng 100% API hiện có, không cần backend changes
✅ **Giá trị cao** - Giải quyết pain points thực tế, tăng efficiency và profitability
✅ **Dễ triển khai** - Chỉ cần frontend development, có thể làm từng phần
✅ **Scalable** - Có thể mở rộng với ML/AI, integrations sau

### Ưu tiên triển khai (theo impact và effort):
1. **High Impact, Low Effort:** Real-time Dashboard, Voucher Analysis, Inventory Alerts
2. **High Impact, Medium Effort:** Staff Performance Analysis, Customer Loyalty, Profit Analysis
3. **Medium Impact, Low Effort:** Cancellation Analysis, Table Optimization
4. **High Impact, High Effort:** Revenue Forecasting, Demand Forecasting, Comprehensive Reporting

### Lưu ý khi triển khai:
- Bắt đầu với MVP (Minimum Viable Product) cho mỗi feature
- Test với real data để đảm bảo accuracy
- Gather user feedback để iterate
- Monitor performance (API calls, response time)
- Consider caching cho data không thay đổi thường xuyên

