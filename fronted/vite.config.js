// ye Vite configuration file hai jisme React aur TailwindCSS v4 plugin configure kiya gaya hai
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 5173,
    host: true
  }
})
