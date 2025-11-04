<!-- <template>
    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div ref="toastEl" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="toast-header" :class="headerClass">
                <i class="fas me-2" :class="iconClass"></i>
                <strong class="me-auto">{{ title }}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                {{ state.message }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Toast } from 'bootstrap';
import { useToast } from '@/utils/toast.js'; // Import hook đã tạo

const toastEl = ref(null);
const { state, toast } = useToast();

// Đăng ký instance Toast với service
onMounted(() => {
    if (toastEl.value) {
        const toastInstance = new Toast(toastEl.value);
        toast.register(toastInstance);
    }
});

// Theo dõi state để hiển thị toast khi cần
watch(() => state.show, (newValue) => {
    if (newValue === false) {
        toast.hide(); // Đảm bảo gọi hide() trên instance
    }
});

// --- Styling ---
const isError = computed(() => state.type === 'error');

const title = computed(() => (isError.value ? 'Lỗi' : 'Thành công'));

const headerClass = computed(() => (
    isError.value ? 'bg-danger text-white' : 'bg-success text-white'
));

const iconClass = computed(() => (
    isError.value ? 'fa-exclamation-circle' : 'fa-check-circle'
));

</script>

<style scoped>
.toast-container {
    z-index: 2000;
    /* Đảm bảo toast đè lên modal */
}

.toast-header .btn-close {
    filter: invert(1) grayscale(100%) brightness(200%);
}
</style> -->