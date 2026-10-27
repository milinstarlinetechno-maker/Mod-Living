import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin panel is served under /admin (by Vite in development, by the Node server in production).
const proxy = { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' };

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  server: { port: 5174, proxy },
  preview: { proxy },
});
