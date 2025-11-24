# 🔍 HƯỚNG DẪN ĐỐI CHIẾU API VỚI BACKEND
## Cafe Dashboard - Hướng dẫn chi tiết

---

## 📋 PHƯƠNG PHÁP ĐỐI CHIẾU

### Bước 1: Lấy Backend API Spec

**Cách 1: Từ Swagger UI**
```bash
# Kiểm tra các URL phổ biến:
http://localhost:8080/swagger-ui.html
http://localhost:8080/swagger-ui/index.html
http://localhost:8080/v3/api-docs
http://localhost:8080/api-docs
```

**Cách 2: Yêu cầu Backend Team**
- Yêu cầu file OpenAPI/Swagger JSON hoặc YAML
- Hoặc danh sách endpoints với request/response schema

**Cách 3: Introspect Live Backend**
- Sử dụng Postman/Insomnia để test endpoints
- Document lại request/response format

### Bước 2: Đối chiếu từng API

**Template đối chiếu**:

| FE Call | BE Spec | Status | Action |
|---------|---------|--------|--------|
| `GET /api/v1/products` | `GET /api/v1/products?page=0&size=10` | ✅ | OK |
| `POST /api/v1/orders` | `POST /api/v1/orders` | ⚠️ | Body schema khác |

---

## 🔍 DANH SÁCH API CẦN ĐỐI CHIẾU

### 1. Authentication APIs (`src/api/authService.js`)

**Endpoints**:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

**Cần kiểm tra**:
- Request body schema
- Response schema (accessToken, refreshToken, expiresIn)
- Error response format

### 2. Product APIs (`src/api/productService.js`)

**Endpoints**:
- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/products/:id`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
- `POST /api/v1/products/:id/image`
- `GET /api/v1/products/:id/recipe`
- `PUT /api/v1/products/:id/recipe`

**Cần kiểm tra**:
- Query params (page, size, categoryId, keyword)
- Request body schema
- Response schema (pagination format)
- Multipart form data cho image upload

### 3. Order APIs (`src/api/orderService.js`)

**Endpoints**:
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/orders/status/:status`
- `GET /api/v1/orders/date-range`
- `GET /api/v1/orders/table/:tableId/pending`
- `POST /api/v1/orders/:id/items`
- `PUT /api/v1/orders/:id/items/:itemId`
- `DELETE /api/v1/orders/:id/items/:itemId`
- `POST /api/v1/orders/:id/voucher`
- `POST /api/v1/orders/:id/payment`
- `PUT /api/v1/orders/:id/cancel`
- `PUT /api/v1/orders/:id`

**Cần kiểm tra**:
- Pagination params
- Date range params format
- Request body schema
- Response schema

### 4. Customer APIs (`src/api/customerService.js`)

**Endpoints**:
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `GET /api/v1/customers/:id`
- `PUT /api/v1/customers/:id`
- `DELETE /api/v1/customers/:id`
- `GET /api/v1/customers/:id/purchase-history`

**Cần kiểm tra**:
- Query params
- Request/Response schema

### 5. Report APIs (`src/api/reportService.js`)

**Endpoints**:
- `GET /api/v1/reports/dashboard`
- `GET /api/v1/reports/daily-revenue`
- `GET /api/v1/reports/inventory`
- `GET /api/v1/reports/orders/export`
- `GET /api/v1/reports/profit`
- `GET /api/v1/reports/best-sellers`
- `GET /api/v1/reports/revenue-by-date`
- `GET /api/v1/reports/expenses-by-date`
- `GET /api/v1/reports/total-expenses`
- `GET /api/v1/reports/total-imported-ingredients`
- `GET /api/v1/reports/top-customers`
- `GET /api/v1/reports/staff-performance`
- `GET /api/v1/reports/category-sales`
- `GET /api/v1/reports/hourly-sales`
- `GET /api/v1/reports/product-sales-summary`
- `GET /api/v1/reports/payment-method-stats`
- `GET /api/v1/reports/sales-comparison`
- `GET /api/v1/reports/inventory/export`
- `GET /api/v1/reports/expenses/export`

**Cần kiểm tra**:
- Query params (startDate, endDate, top, sortBy)
- Response schema
- Export endpoints (blob response)

### 6. Shift APIs (`src/api/shiftService.js`)

**Endpoints**: Nhiều endpoints, cần đối chiếu từng cái

### 7. Dashboard APIs

**Endpoints**:
- `GET /api/admin/dashboard`
- `GET /api/manager/dashboard`
- `GET /api/staff/dashboard`

**Cần kiểm tra**:
- Query params (range, from, to)
- Response schema

---

## 🔧 TEMPLATE SỬA API

### Khi phát hiện API không khớp:

**1. Sửa URL**:
```javascript
// Trước
export const getProducts = async () => {
    const { data } = await api.get('/api/v1/products')
    return data
}

// Sau (nếu backend yêu cầu pagination bắt buộc)
export const getProducts = async (page = 0, size = 10) => {
    const { data } = await api.get('/api/v1/products', {
        params: { page, size }
    })
    return data
}
```

**2. Sửa Request Body**:
```javascript
// Trước
export const createProduct = async (productData) => {
    const { data } = await api.post('/api/v1/products', productData)
    return data
}

// Sau (nếu backend yêu cầu schema khác)
export const createProduct = async (productData) => {
    const payload = {
        name: productData.name,
        price: Number(productData.price),
        categoryId: productData.categoryId,
        // Map đúng schema backend
    }
    const { data } = await api.post('/api/v1/products', payload)
    return data
}
```

**3. Sửa Response Mapping**:
```javascript
// Trước
export const getProducts = async () => {
    const { data } = await api.get('/api/v1/products')
    return data // Giả định data là array
}

// Sau (nếu backend trả về pagination object)
export const getProducts = async (page = 0, size = 10) => {
    const { data } = await api.get('/api/v1/products', {
        params: { page, size }
    })
    // Backend trả về: { content: [], totalElements: 100, totalPages: 10 }
    return {
        content: Array.isArray(data?.content) ? data.content : [],
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 0,
        // Map đúng schema
    }
}
```

---

## 📊 BẢNG ĐỐI CHIẾU API (Template)

| # | FE Endpoint | Method | BE Endpoint | Method | Status | Issues | Action |
|---|-------------|--------|-------------|--------|--------|--------|--------|
| 1 | `/api/v1/products` | GET | `/api/v1/products` | GET | ⏳ | Chưa đối chiếu | Cần kiểm tra |
| 2 | `/api/v1/orders` | GET | `/api/v1/orders` | GET | ⏳ | Chưa đối chiếu | Cần kiểm tra |
| ... | ... | ... | ... | ... | ... | ... | ... |

**Status**:
- ✅ Khớp
- ⚠️ Có vấn đề (ghi rõ)
- ❌ Không khớp (ghi rõ)
- ⏳ Chưa đối chiếu

---

*Hướng dẫn này cần được cập nhật sau khi có backend API spec*

