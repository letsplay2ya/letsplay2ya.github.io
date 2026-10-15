import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vue from '@astrojs/vue';

// Set SITE_URL when a real hosting address is selected. Local builds need no account.
export default defineConfig({
  ...(process.env.SITE_URL ? { site: process.env.SITE_URL } : {}),
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), react(), vue()],
  markdown: { shikiConfig: { theme: 'github-dark' } },
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
