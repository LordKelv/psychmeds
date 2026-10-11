import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base + hash routing lets the build run from any static host or subpath.
export default defineConfig({
  base: './',
  plugins: [react()],
});
