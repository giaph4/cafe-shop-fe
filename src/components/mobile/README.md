# Mobile & Responsive Components

## Cách truy cập và sử dụng

### 1. Bottom Navigation (Tự động hiển thị)

**Vị trí:** Tự động xuất hiện ở cuối màn hình trên mobile (< 768px)

**Cách xem:**
- Mở ứng dụng trên điện thoại hoặc tablet
- Hoặc mở DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
- Chọn device mobile (iPhone, Samsung, etc.)
- Bottom navigation sẽ tự động xuất hiện ở cuối màn hình

**Tính năng:**
- Hiển thị 5 trang chính từ navigation config
- Tự động ẩn trên desktop (> 768px)
- Role-based permissions
- Active state highlighting

### 2. Responsive Layouts (Tự động)

**Vị trí:** Tất cả các trang

**Cách xem:**
- Desktop (> 1024px): Sidebar mở rộng, layout đầy đủ
- Tablet (768-1024px): Sidebar tự động collapse
- Mobile (< 768px): Sidebar thành drawer, bottom navigation hiện

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

### 3. Mobile Components (Cần import để sử dụng)

#### MobileTable Component

**Vị trí:** Sử dụng trong các pages có table

**Cách sử dụng:**
```vue
<template>
  <MobileTable
    :items="products"
    :columns="columns"
    :row-key="'id'"
    card-title-field="name"
    @row-click="handleRowClick"
  >
    <template #cell-price="{ value }">
      {{ formatCurrency(value) }}
    </template>
    <template #actions="{ row }">
      <button @click="edit(row)">Sửa</button>
    </template>
  </MobileTable>
</template>
```

**Tính năng:**
- Tự động chuyển sang card view trên mobile
- Table view trên desktop
- Custom cell rendering
- Row selection support

#### MobileModal Component

**Vị trí:** Sử dụng thay cho modal thông thường

**Cách sử dụng:**
```vue
<template>
  <MobileModal
    ref="modalRef"
    title="Tiêu đề"
    subtitle="Mô tả"
    icon="bi bi-info-circle"
  >
    <p>Nội dung modal</p>
    <template #footer>
      <button @click="modalRef.hide()">Đóng</button>
    </template>
  </MobileModal>
</template>
```

**Tính năng:**
- Tự động fullscreen trên mobile
- Normal modal trên desktop
- Safe area support (notch devices)

#### PullToRefresh Component

**Vị trí:** Wrap scrollable content

**Cách sử dụng:**
```vue
<template>
  <PullToRefresh @refresh="handleRefresh">
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </PullToRefresh>
</template>

<script setup>
const pullToRefreshRef = ref(null)

const handleRefresh = async () => {
  await fetchData()
  pullToRefreshRef.value?.refreshComplete()
}
</script>
```

**Tính năng:**
- Pull down để refresh
- Visual indicator
- Threshold configurable

### 4. Composables

#### useDeviceDetection

**Cách sử dụng:**
```vue
<script setup>
import { useDeviceDetection } from '@/composables/useDeviceDetection'

const { 
  isMobile, 
  isTablet, 
  isDesktop,
  deviceType,
  screenSize 
} = useDeviceDetection()

// Conditional rendering
if (isMobile.value) {
  // Mobile specific code
}
</script>
```

#### useSwipeGestures

**Cách sử dụng:**
```vue
<script setup>
import { useSwipeGestures } from '@/composables/useSwipeGestures'

const { setupSwipe } = useSwipeGestures({
  onSwipeLeft: () => console.log('Swiped left'),
  onSwipeRight: () => console.log('Swiped right'),
  threshold: 50
})

onMounted(() => {
  setupSwipe(elementRef.value)
})
</script>
```

## Cách test

### 1. Test trên Desktop Browser

1. Mở DevTools (F12)
2. Click vào icon "Toggle device toolbar" (Ctrl+Shift+M)
3. Chọn device:
   - iPhone 12 Pro (390x844) - Mobile
   - iPad (768x1024) - Tablet
   - Desktop (1920x1080) - Desktop
4. Refresh trang và kiểm tra responsive behavior

### 2. Test trên Mobile Device

1. Đảm bảo app đang chạy trên network local
2. Lấy IP address của máy tính
3. Mở browser trên mobile, truy cập: `http://[IP]:[PORT]`
4. Kiểm tra:
   - Bottom navigation xuất hiện
   - Tables chuyển sang card view
   - Modals fullscreen
   - Touch gestures hoạt động

### 3. Test Responsive Breakpoints

Sử dụng DevTools để test các breakpoints:
- 375px - Mobile (iPhone SE)
- 768px - Tablet (iPad)
- 1024px - Desktop
- 1920px - Large Desktop

## Ví dụ tích hợp

### Ví dụ: Sử dụng MobileTable trong Products page

```vue
<template>
  <MobileTable
    :items="products"
    :columns="[
      { key: 'name', label: 'Tên sản phẩm' },
      { key: 'price', label: 'Giá', type: 'currency' },
      { key: 'category', label: 'Danh mục' }
    ]"
    card-title-field="name"
    @row-click="handleProductClick"
  >
    <template #actions="{ row }">
      <button @click="editProduct(row)">Sửa</button>
      <button @click="deleteProduct(row)">Xóa</button>
    </template>
  </MobileTable>
</template>
```

## Lưu ý

1. **Bottom Navigation** chỉ hiện trên mobile, tự động ẩn trên desktop
2. **MobileTable** tự động detect device và switch giữa table/card view
3. **MobileModal** tự động fullscreen trên mobile
4. Tất cả components đều có touch-friendly spacing (min 44px)
5. Safe area support cho devices có notch (iPhone X+)

## Troubleshooting

**Q: Bottom navigation không hiện?**
A: Kiểm tra:
- Screen width < 768px
- Component đã được import trong MainLayout
- Navigation items có `mobile !== false` trong config

**Q: Table không chuyển sang card view?**
A: Kiểm tra:
- Đang sử dụng `<MobileTable>` thay vì `<table>`
- Screen width < 768px
- Columns được định nghĩa đúng

**Q: Modal không fullscreen trên mobile?**
A: Kiểm tra:
- Đang sử dụng `<MobileModal>` thay vì modal thông thường
- Screen width < 768px

