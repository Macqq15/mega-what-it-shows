import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({ extensions: ['.svx'], layout: { runbook: './src/lib/layouts/runbook.svelte' } }),
  ],
  kit: {
    adapter: adapter({ strict: false }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['*'], handleHttpError: 'warn' },
  },
};
