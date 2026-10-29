import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const envDir = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  return {
    envDir,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.PORT || env.PORT || 5000}`,
          changeOrigin: true,
        },
      },
    },
  };
});
