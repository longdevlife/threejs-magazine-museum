import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    outDir: '../public/rpg',
    emptyOutDir: true,
  },
  plugins: [createHtmlPlugin()],
});
