import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/convert': {
            target: process.env.VITE_API_URL || 'http://localhost:5001',
            changeOrigin: true,
            secure: false
          },
          '/api': {
            target: process.env.VITE_API_URL || 'http://localhost:5001',
            changeOrigin: true,
            secure: false
          }
        }
      }
    };
});
