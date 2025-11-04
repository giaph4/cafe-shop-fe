import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
})

// Interceptor để thêm JWT token vào mỗi request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
},
    error => Promise.reject(error)
)

// Interceptor để xử lý lỗi 401 (Unauthorized)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Xóa token cũ và chuyển hướng về trang login
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api