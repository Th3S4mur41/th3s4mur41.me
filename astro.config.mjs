import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	markdown: {
		syntaxHighlight: "prism",
	},
	integrations: [
		sitemap({
			// Exclude any draft blog post URLs using the conventional `_draft-` slug prefix.
			// The sitemap integration does not expose markdown frontmatter, so we rely on URL pattern.
			// Example draft path: https://th3s4mur41.me/blog/_draft-my-new-post/
			filter: (pageUrl) => !pageUrl.includes("/blog/_draft-"),
		}),
		mdx(),
	],
	devToolbar: {
		enabled: false, // Disable the Astro toolbar
	},
});
