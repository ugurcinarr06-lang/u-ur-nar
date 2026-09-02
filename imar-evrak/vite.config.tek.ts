import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Tek dosyalık derleme: CSS ve JS index.html içine gömülür, böylece
 * çıktı sunucusuz (dosyaya çift tıklayarak veya bir link üzerinden) açılır.
 * Kullanım: npm run build:tek → dist-tek/index.html
 */
export default defineConfig({
  plugins: [react(), tailwind(), viteSingleFile()],
  build: { outDir: 'dist-tek', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});
