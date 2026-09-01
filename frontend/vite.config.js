import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/courses': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/enrollments': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/attandances': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/notes': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/email': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
