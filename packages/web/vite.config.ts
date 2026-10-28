import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev`: the API runs on 3000, the front-end calls it through this proxy.
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
