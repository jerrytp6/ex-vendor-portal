import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// base 可透過 env 變更（VITE_BASE）
// dev 預設 /EXPO/（沿用既有相對路徑）；Zeabur 根路徑部署設 VITE_BASE=/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: env.VITE_BASE || '/EXPO/',
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:7002',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  }
})
