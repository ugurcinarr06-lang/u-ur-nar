import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    port: 3100,
    host: true,
    // Geliştirmede API çağrıları ayrı çalışan sunucuya gider.
    proxy: { '/api': 'http://localhost:3200' },
  },
});
