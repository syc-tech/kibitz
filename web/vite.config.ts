import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiBase = process.env.VITE_API_BASE_URL;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiBase
      ? {
          '/api': {
            target: apiBase,
            changeOrigin: true,
            secure: false
          }
        }
      : {
          '/api': {
            target: 'http://localhost:4000',
            changeOrigin: true
          }
        }
  }
});
