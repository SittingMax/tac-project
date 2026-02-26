import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const devPort = Number(process.env.PORT) || 5173;
  return {
    appType: 'spa',
    server: {
      port: devPort,
      strictPort: true, // Fail if port is taken
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
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'stats.html',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['motion', 'lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-data': ['@tanstack/react-query', 'zustand', 'zod', '@hookform/resolvers'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  } as any;
});
