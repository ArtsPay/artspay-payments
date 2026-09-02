import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    // Forwards API calls to the backend during dev, so the browser only
    // ever talks to this dev server, not the backend directly. No CORS
    // needed. Change the target if the backend is running elsewhere.
    proxy: {
      '/api': 'http://localhost:8000',
      '/webhooks': 'http://localhost:8000',
    },
  },
});
