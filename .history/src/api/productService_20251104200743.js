import api from './axios'

/**
 * Lấy danh sách sản phẩm có phân trang và lọc.
 * [cite_start]API: GET /api/v1/products [cite: 906-908]
 * @param {Object} params - Gồm { page, size, name, categoryId }
 */
export const getFilteredProducts = async (params) => {
    try {
        // Chỉ truyền các params có giá trị
        const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});

        const { data } = await api.get('/products', { params: filteredParams });
        return data; // Trả về cấu trúc Page (content, totalPages, ...)
    } catch (error) {
        console.error("Failed to fetch products:", error);
        // Ném lỗi ra để component cha có thể bắt và xử lý (vd: hiển thị toast)
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách sản phẩm");
    }
}

/**
 * Lấy chi tiết một sản phẩm theo ID.
 * [cite_start]API: GET /api/v1/products/{id} [cite: 932-934]
 */
export const getProductById = async (id) => {
    try {
        const { data } = await api.get(`/products/${id}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch product with id ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải chi tiết sản phẩm");
    }
}

/**
 * Tạo sản phẩm mới (dùng FormData để có thể kèm ảnh).
 * [cite_start]API: POST /api/v1/products (Multipart) [cite: 977-980]
 * @param {Object} productData - Dữ liệu JSON của sản phẩm
 * @param {File} imageFile - File ảnh (có thể null)
 */
export const createProductWithImage = async (productData, imageFile) => {
    try {
        const formData = new FormData();

        // 1. Thêm product data dưới dạng JSON string
        formData.append('product', new Blob([JSON.stringify(productData)], {
            type: "application/json"
        }));

        // 2. Thêm file ảnh nếu có
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const { data } = await api.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data' // Quan trọng
            }
        });
        return data;
    } catch (error) {
        console.error("Failed to create product:", error);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo sản phẩm");
    }
}

/**
 * Cập nhật sản phẩm (dùng FormData để có thể kèm ảnh).
 * [cite_start]API: PUT /api/v1/products/{id} (Multipart) [cite: 1004-1007]
 * @param {Number} id - ID sản phẩm
 * @param {Object} productData - Dữ liệu JSON của sản phẩm
 * @param {File} imageFile - File ảnh mới (có thể null)
 */
export const updateProductWithImage = async (id, productData, imageFile) => {
    try {
        const formData = new FormData();

        formData.append('product', new Blob([JSON.stringify(productData)], {
            type: "application/json"
        }));

        if (imageFile) {
            formData.append('image', imageFile);
        }

        const { data } = await api.put(`/products/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return data;
    } catch (error) {
        console.error(`Failed to update product ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật sản phẩm");
    }
}


/**
 * Xóa một sản phẩm.
 * [cite_start]API: DELETE /api/v1/products/{id} [cite: 959-961]
 */
export const deleteProduct = async (id) => {
    try {
        await api.delete(`/products/${id}`);
        return id; // Trả về id để cập nhật UI
    } catch (error) {
        console.error(`Failed to delete product ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi xoá sản phẩm");
    }
}

/**
 * Bật/Tắt trạng thái "available" của sản phẩm.
 * [cite_start]API: PATCH /api/v1/products/{id}/toggle-availability [cite: 968-970]
 */
export const toggleProductAvailability = async (id) => {
    try {
        const { data } = await api.patch(`/products/${id}/toggle-availability`);
        return data;
    } catch (error) {
        console.error(`Failed to toggle availability for product ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái");
    }
}