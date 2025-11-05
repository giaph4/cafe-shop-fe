import axios from './axios';

const API_URL = '/api/v1/expenses';

/**
 * Lấy danh sách chi phí (có phân trang, sắp xếp và lọc theo ngày)
 * @param {object} params - Các tham số truy vấn (page, size, sort, startDate, endDate)
 */
const getAll = (params) => {
    return axios.get(API_URL, { params });
};

/**
 * Lấy chi tiết một chi phí bằng ID
 * @param {number} id - ID của chi phí
 */
const getById = (id) => {
    return axios.get(`${API_URL}/${id}`);
};

/**
 * Tạo một chi phí mới
 * @param {object} expenseDTO - Đối tượng chi phí (không cần id, user, createdAt...)
 */
const create = (expenseDTO) => {
    return axios.post(API_URL, expenseDTO);
};

/**
 * Cập nhật một chi phí
 * @param {number} id - ID của chi phí cần cập nhật
 * @param {object} expenseDTO - Đối tượng chi phí
 */
const update = (id, expenseDTO) => {
    return axios.put(`${API_URL}/${id}`, expenseDTO);
};

/**
 * Xóa một chi phí
 * @param {number} id - ID của chi phí cần xóa
 */
const deleteExpense = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};

export const expenseService = {
    getAll,
    getById,
    create,
    update,
    deleteExpense,
};
