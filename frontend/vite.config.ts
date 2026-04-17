import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3006';

  return {
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    server: {
      port: 3010,
      host: 'localhost',
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              proxyRes.headers['access-control-allow-origin'] = 'http://localhost:3010';
              proxyRes.headers['access-control-allow-credentials'] = 'true';
            });
          },
        },
      },
      middlewareMode: false,
      hmr: {
        host: 'localhost',
        port: 3010,
        protocol: 'ws',
      },
    },
    optimizeDeps: {
      include: ['firebase/app', 'firebase/messaging'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            mui: ['@mui/material', '@mui/icons-material'],
            muiX: ['@mui/x-data-grid', '@mui/x-date-pickers'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
