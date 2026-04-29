import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, 'src/preload'),
  build: {
    outDir: path.resolve(__dirname, 'dist/preload'),
    lib: {
      entry: path.resolve(__dirname, 'src/preload/index.js'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
    },
    emptyOutDir: true,
    sourcemap: true,
  },
})
