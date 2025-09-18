import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	markdown: {
		syntaxHighlight: "prism",
	},
	integrations: [sitemap(), mdx()],
	devToolbar: {
		enabled: false, // Disable the Astro toolbar
	},
});
