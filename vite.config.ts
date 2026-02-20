import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

const projectRoot = path.resolve(process.cwd());

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $convex: path.join(projectRoot, 'convex')
    }
  },
  server: {
    fs: {
      allow: [path.join(projectRoot, 'convex')]
    }
  }
});
