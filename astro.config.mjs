import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	integrations: [sitemap()],
	devToolbar: {
		enabled: false, // Disable the Astro toolbar
	},
});
