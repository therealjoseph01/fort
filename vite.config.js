import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build`        → standard production build in /dist
// `npm run build:single` → one self-contained HTML file in /preview (open it directly in a browser)
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    build: single
      ? { outDir: 'preview', emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 }
      : { chunkSizeWarningLimit: 2000 },
  }
})
