import { defineConfig } from 'vite'
import path from 'path'
import commonjs from '@rollup/plugin-commonjs'
import { builtinModules } from 'module'

export default defineConfig({
  root: path.resolve(__dirname, 'src/main'),
  build: {
    outDir: path.resolve(__dirname, 'dist/main'),
    lib: {
      entry: path.resolve(__dirname, 'src/main/main.js'),
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      // 外部化所有 Node.js 内置模块和 electron
      external: [...builtinModules, 'electron', 'sql.js'],
      plugins: [commonjs()],
    },
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
