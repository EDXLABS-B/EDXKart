import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is proxied to the Spring Boot backend, so there are no CORS problems in dev or preview.
const proxy = { '/api': { target: process.env.BACKEND_URL || 'http://localhost:8080', changeOrigin: true } }
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 5173, proxy },
})
