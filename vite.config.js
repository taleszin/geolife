import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL para desenvolvimento local
  base: '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Compatibilidade com browsers
    target: 'es2015',
    // Inline assets pequenos (4KB)
    assetsInlineLimit: 4096,
    // Gera sourcemaps para debug
    sourcemap: false,
    // Usa esbuild (default) em vez de terser
    minify: 'esbuild'
  },
  
  // Servidor de desenvolvimento
  server: {
    port: 5173,
    open: true
  },
  
  // Preview (após build)
  preview: {
    port: 4173
  }
});
