import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // GEMINI_API_KEY yalnızca sunucu/geliştirme tarafında kullanılır;
  // istemci paketine ASLA gömülmez (define yok).
  const env = loadEnv(mode, '.', '');
  const apiKey = env.GEMINI_API_KEY;

  // Yerel geliştirmede (npm run dev) Vite, /api klasörünü çalıştırmaz.
  // Bu eklenti, Vercel'deki /api/translate fonksiyonunu taklit eder ki
  // çeviri yerelde de çalışsın.
  const devTranslateApi: Plugin = {
    name: 'dev-translate-api',
    configureServer(server) {
      server.middlewares.use('/api/translate', (req, res) => {
        const json = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
        if (!apiKey) return json(503, { error: 'NO_API_KEY' });

        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', async () => {
          try {
            const { text, from, to } = JSON.parse(raw || '{}');
            if (!text || !from || !to) return json(400, { error: 'BAD_REQUEST' });
            const { translateText } = await import('./lib/gemini');
            const translation = await translateText(text, from, to, apiKey);
            json(200, { translation });
          } catch {
            json(500, { error: 'TRANSLATE_FAILED' });
          }
        });
      });
    },
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      devTranslateApi,
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon-32x32.png',
          'apple-touch-icon-180x180.png',
          'icon-source.svg',
        ],
        manifest: {
          name: 'Canlı Çeviri',
          short_name: 'Canlı Çeviri',
          description:
            'Yüz yüze, gerçek zamanlı, çift yönlü konuşma çevirisi uygulaması.',
          lang: 'tr',
          theme_color: '#0284c7',
          background_color: '#f0f9ff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          // Çeviri API'si (serverless) asla önbelleğe alınmaz/yakalanmaz.
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
