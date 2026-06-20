import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
    plugins: [react(), devTranslateApi],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
