import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  define: {
    global: 'window'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'chart-vendor': ['vue3-apexcharts'],
          'ui-vendor': ['primevue', 'bootstrap'],
          'form-vendor': ['vee-validate', 'yup'],
          'query-vendor': ['@tanstack/vue-query'],
          'utils-vendor': ['axios', 'dompurify']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
