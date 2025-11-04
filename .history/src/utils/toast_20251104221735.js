// src/utils/toast.js
import { reactive } from 'vue';

// 1. Tạo một state chung (reactive)
const state = reactive({
  show: false,
  message: '',
  type: 'success', // 'success' (xanh) hoặc 'error' (đỏ)
  _toastInstance: null,
});

// 2. Định nghĩa các hàm để component khác gọi
const toast = {
  /**
   * Hiển thị thông báo
   * @param {string} message Nội dung
   * @param {string} type 'success' hoặc 'error'
   */
  show(message, type = 'success') {
    state.message = message;
    state.type = type;
    state.show = true;
    
    // Tự động hiển thị nếu instance đã sẵn sàng
    if (state._toastInstance) {
      state._toastInstance.show();
    }
  },

  // Ẩn thông báo
  hide() {
    state.show = false;
    if (state._toastInstance) {
      state._toastInstance.hide();
    }
  },

  // Dùng nội bộ để component Toast đăng ký
  register(instance) {
    state._toastInstance = instance;
  }
};

// 3. Export hook để các component Vue có thể sử dụng
export function useToast() {
  return {
    state,
    toast,
  };
}