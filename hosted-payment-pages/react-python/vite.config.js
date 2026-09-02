import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
