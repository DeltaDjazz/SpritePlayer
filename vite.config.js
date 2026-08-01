import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Requis pour GitHub Pages (URL de type https://<user>.github.io/<repo>/)
  base: '/SpritePlayer/',
  plugins: [react(), tailwindcss()],
});
