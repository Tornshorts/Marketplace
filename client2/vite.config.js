import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server:{
    proxy:{
        '/api':'https://marketplace-h5x5.onrender.com',
    }
  }
})
