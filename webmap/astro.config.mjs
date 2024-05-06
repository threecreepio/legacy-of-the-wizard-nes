import { defineConfig } from 'astro/config';
import svelte from "@astrojs/svelte";
import { baseUrl } from './package.json';
import relativeLinks from "astro-relative-links";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), relativeLinks(), tailwind()],
  base: baseUrl
});