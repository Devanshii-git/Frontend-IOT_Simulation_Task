import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react/') || id.includes('node_modules/framer-motion/') || id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind-merge/')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/recharts/')) {
            return 'chart-vendor';
          }
          if (id.includes('node_modules/zustand/')) {
            return 'state-vendor';
          }
        },
      },
    },
  },
})
