import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/..." aponta para src/ (ex.: import { Button } from "@/components/ui/button")
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Tudo que começa com /api vai para a API .NET — assim não precisamos de CORS.
    proxy: { '/api': 'http://localhost:5280' },
  },
})
