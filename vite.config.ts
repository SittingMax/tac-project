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
      strictPort: false, // Don't fail if port is taken
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
      // Target modern browsers for smaller output
      target: 'es2022',
      // CSS code splitting for better caching
      cssCodeSplit: true,
      // Hidden source maps for Sentry error tracking (not served to clients)
      sourcemap: 'hidden' as const,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@sentry')) return 'vendor-sentry';
              if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
              if (id.includes('jspdf') || id.includes('pdf-lib') || id.includes('html2canvas'))
                return 'vendor-pdf';
              if (
                id.includes('@zxing') ||
                id.includes('jsbarcode') ||
                id.includes('bwip-js') ||
                id.includes('qrcode')
              )
                return 'vendor-scanner';
              if (id.includes('gsap')) return 'vendor-gsap';
              if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('@radix-ui')) return 'vendor-radix';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('@tanstack') || id.includes('zustand') || id.includes('zod'))
                return 'vendor-data';
              if (id.includes('react') && !id.includes('@')) return 'vendor-react';
              if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('date-fns') || id.includes('fuse.js') || id.includes('sonner'))
                return 'vendor-utils';
              return 'vendor-core'; // catch-all for other deps
            }
          },
        },
      },
      // Production-grade threshold: warn on chunks > 1200KB (jspdf/pdf-lib is huge)
      chunkSizeWarningLimit: 1200,
    },
  };
});
