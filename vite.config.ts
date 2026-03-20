import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const devPort = Number(process.env.PORT) || 5173;
  return {
    appType: 'spa' as const,
    server: {
      port: devPort,
      strictPort: false,
      host: '0.0.0.0',
      allowedHosts: ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok.io', '.loca.lt'],
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-icon.svg'],
        manifest: {
          name: 'TAC Cargo',
          short_name: 'TAC',
          description: 'Enterprise Logistics Management Platform',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
      // rollup-plugin-visualizer exports Rollup's Plugin type which differs from Vite's PluginOption
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'stats.html',
      }) as unknown as import('vite').PluginOption,
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      // Hidden source maps for Sentry error tracking (not served to clients)
      sourcemap: 'hidden' as const,
      // manualChunks intentionally removed.
      // Custom manualChunks caused circular chunk dependencies at runtime:
      //   vendor-core -> vendor-react -> vendor-core
      //   (packages like @floating-ui, vaul, cmdk that import React were
      //    placed in vendor-core, but React was in vendor-react, so
      //    React.useLayoutEffect / React.forwardRef was undefined on load)
      // Vite's default auto-chunking does not have this problem.
      chunkSizeWarningLimit: 1200,
    },
  };
});
