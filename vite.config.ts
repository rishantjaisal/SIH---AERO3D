import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: true,
    port: 3000,
    watch: {
      ignored: ['**/server/uploads/**', '**/storage/**', '**/backend/**', '**/public/demo/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/demo': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    copyPublicDir: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three/')) return 'vendor-three-core';
          if (id.includes('node_modules/@react-three/drei/')) return 'vendor-three-drei';
          if (id.includes('node_modules/@react-three/fiber/')) return 'vendor-three-fiber';
          if (id.includes('node_modules/leaflet/')) return 'vendor-leaflet';
          if (id.includes('node_modules/lucide-react/')) return 'vendor-icons';
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) return 'vendor-react';
        }
      }
    }
  }
});
