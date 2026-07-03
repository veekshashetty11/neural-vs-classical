import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite keeps the frontend dev loop fast, while the Tailwind plugin compiles
// utility classes directly from the React source files.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
