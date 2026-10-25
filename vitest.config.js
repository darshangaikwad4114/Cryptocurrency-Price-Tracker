import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js', 'tests/**/*.test.{js,jsx}'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}', 'api/**/*.js'],
      exclude: ['src/app/main.jsx', 'src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
    },
  },
});
