import api from './axios'

/**
 * Lấy danh sách chi phí (phân trang, lọc, sắp xếp).
 * API: GET /api/v1/expenses 
 * @param {Object} params - Gồm { page, size, sort, startDate, endDate }
 */
export const getExpenses = async (params) => {
    try {
        // Lọc ra các params rỗng
        const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});

        const { data } = await api.get('/expenses', { params: filteredParams });
        return data; // Trả về cấu trúc Page
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải danh sách chi phí");
    }
}

/**
 * Lấy chi tiết một khoản chi phí.
 * API: GET /api/v1/expenses/{id} [cite: 440-442]
 */
export const getExpenseById = async (id) => {
    try {
        const { data } = await api.get(`/expenses/${id}`);
        return data;
    } catch (error) {
        console.error(`Failed to fetch expense ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi tải chi tiết chi phí");
    }
}

export const createExpense = async (expenseData) => {
    try {
        const { data } = await api.post('/expenses', expenseData);
        return data;
    } catch (error) {
        console.error("Failed to create expense:", error);
        throw new Error(error.response?.data?.message || "Lỗi khi tạo chi phí");
    }
}

export const updateExpense = async (id, expenseData) => {
    try {
        const { data } = await api.put(`/expenses/${id}`, expenseData);
        return data;
    } catch (error) {
        console.error(`Failed to update expense ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi cập nhật chi phí");
    }
}

/**
 * Xóa một khoản chi phí.
 * API: DELETE /api/v1/expenses/{id} [cite: 471-473]
 */
export const deleteExpense = async (id) => {
    try {
        await api.delete(`/expenses/${id}`);
        return id;
    } catch (error) {
        console.error(`Failed to delete expense ${id}:`, error);
        throw new Error(error.response?.data?.message || "Lỗi khi xoá chi phí");
    }
}