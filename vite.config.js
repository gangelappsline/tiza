import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = 'https://tiza-api.appsline.com.mx';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    // En desarrollo las llamadas a /api se reenvían a la API real (evita CORS).
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true, secure: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
