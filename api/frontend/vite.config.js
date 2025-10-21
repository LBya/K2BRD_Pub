/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        brdGenerator: resolve(__dirname, 'brd-generator.html'),
        // Add other HTML files here if needed
      },
    },
  },
}); 