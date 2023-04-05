import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Add your own plugins here for thinkgs like eslint or typecheckers
  plugins: [],
  // @ts-ignore Missing test property
  test: {
    environment: 'jsdom'
  }
});
