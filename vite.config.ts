import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two pages: the course app (index.html) and the sign-in page (login.html).
// login.html is a separate entry because the middleware serves it BEFORE
// sign-in, when the app bundle must not be needed.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login.html'),
      },
    },
  },
});
