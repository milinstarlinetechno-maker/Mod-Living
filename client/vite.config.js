import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API and uploaded files come from the Node server.
const proxy = { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { proxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
