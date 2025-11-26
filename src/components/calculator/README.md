# Calculator Panel - Hướng dẫn sử dụng

## Tổng quan

Máy tính panel là một component Vue 3 được tích hợp vào navbar, cung cấp các tính năng:
- Máy tính chuẩn với các phép toán cơ bản và nâng cao
- Tính tiền nhanh (Quick Pay) với VAT, tip, giảm giá
- Chuyển đổi tiền tệ

## Cách sử dụng

### Mở/Đóng panel

1. **Click icon máy tính** trên navbar (biểu tượng calculator)
2. **Phím tắt**: `Ctrl+M` (hoặc `Cmd+M` trên Mac) để mở/đóng
3. **Phím Esc**: Đóng panel (nếu không bị ghim)

### Tính năng chính

#### 1. Máy tính chuẩn

**Phép toán cơ bản:**
- `+`, `-`, `×`, `÷`: Cộng, trừ, nhân, chia
- `=`: Tính kết quả
- `C`: Xóa tất cả
- `CE`: Xóa entry hiện tại
- `⌫`: Xóa ký tự cuối
- `±`: Đổi dấu
- `%`: Phần trăm
- `R100`, `R1000`: Làm tròn đến 100/1000

**Phép toán nâng cao:**
- `√`: Căn bậc hai
- `x²`: Bình phương
- `log`: Logarit cơ số 10
- `ln`: Logarit tự nhiên
- `sin`, `cos`, `tan`: Hàm lượng giác (độ)
- `n!`: Giai thừa

**Bộ nhớ:**
- `M+`: Cộng vào bộ nhớ
- `M-`: Trừ khỏi bộ nhớ
- `MR`: Gọi từ bộ nhớ
- `MC`: Xóa bộ nhớ

**Lịch sử:**
- Tự động lưu 20 phép tính gần nhất
- Click vào lịch sử để nạp lại kết quả
- Nút "Xóa" để xóa toàn bộ lịch sử

#### 2. Tính tiền nhanh (Quick Pay)

Nhập các thông tin:
- **Số lượng**: Số lượng sản phẩm
- **Giá đơn vị**: Giá của một đơn vị
- **Giảm giá**: Số tiền hoặc phần trăm giảm
- **VAT (%)**: Phần trăm thuế VAT
- **Tip (%)**: Phần trăm tip

Kết quả hiển thị:
- Subtotal (tổng trước giảm giá)
- Giảm giá (nếu có)
- Subtotal sau giảm giá
- VAT (nếu có)
- Tip (nếu có)
- **Tổng cộng**

**Nút hành động:**
- **Xác nhận**: Gửi event `calculate:completed` với dữ liệu
- **Copy tổng**: Copy tổng tiền vào clipboard

#### 3. Chuyển đổi tiền tệ

- Nhập số tiền cần chuyển đổi
- Nhập tỷ giá quy đổi
- Kết quả hiển thị ngay lập tức

## Tích hợp với hệ thống

### Event: `calculate:completed`

Khi người dùng xác nhận tính tiền nhanh, component sẽ emit event:

```javascript
{
  type: 'quickpay',
  quantity: 2,
  unitPrice: 50000,
  subtotal: 100000,
  discount: 0,
  discountType: 'nominal',
  discountAmount: 0,
  subtotalAfterDiscount: 100000,
  vatPercent: 10,
  vatAmount: 10000,
  tipPercent: 5,
  tipAmount: 5000,
  total: 115000
}
```

### Ví dụ xử lý event

```javascript
// Trong component sử dụng CalculatorPanel
<CalculatorPanel
  v-model="calculatorOpen"
  @calculate:completed="handleCalculatorCompleted"
/>

// Handler
const handleCalculatorCompleted = (data) => {
  if (data.type === 'quickpay') {
    // Gửi lên API hoặc xử lý dữ liệu
    console.log('Tổng tiền:', data.total)
    console.log('VAT:', data.vatAmount)
    console.log('Tip:', data.tipAmount)
    
    // Ví dụ: Gửi lên API
    // await api.createOrder({
    //   total: data.total,
    //   vat: data.vatAmount,
    //   tip: data.tipAmount
    // })
  }
}
```

## Accessibility

- **ARIA labels**: Tất cả buttons và inputs đều có aria-label
- **Keyboard navigation**: 
  - `Ctrl+M`: Mở/đóng
  - `Esc`: Đóng panel
  - Tab navigation trong panel
- **Focus trap**: Khi panel mở, focus được giữ trong panel
- **Screen reader**: Hỗ trợ đầy đủ cho screen readers

## Responsive

- **Desktop**: Panel slide-in từ bên phải, chiếm tối đa 420px
- **Mobile**: Panel full screen, border-radius = 0
- **Tablet**: Tự động điều chỉnh theo kích thước màn hình

## Ghim panel

- Click icon **ghim** (pin) trên header để giữ panel mở
- Khi đã ghim, click overlay hoặc Esc sẽ không đóng panel
- Click lại icon ghim để bỏ ghim

## Lưu ý kỹ thuật

- Sử dụng `BigInt` và decimal logic để tránh lỗi floating point
- Tất cả phép toán đều được làm tròn đến 10 chữ số thập phân
- Lịch sử được lưu trong memory, không persist qua refresh
- Component sử dụng Vue 3 Composition API
- Không phụ thuộc vào thư viện ngoài (chỉ Vue 3)

## Troubleshooting

**Panel không mở:**
- Kiểm tra console có lỗi không
- Đảm bảo `v-model` được bind đúng
- Kiểm tra z-index của overlay (2000)

**Tính toán sai:**
- Kiểm tra input có hợp lệ không
- Xem console log để debug
- Đảm bảo không chia cho 0

**Event không emit:**
- Kiểm tra handler có được bind đúng không
- Xem console log khi click "Xác nhận"

