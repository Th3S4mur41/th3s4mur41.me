import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import { rehypeOptimizeFirstImage } from "./src/plugins/rehype-optimize-first-image.js";
import { rehypeViewTransitionNames } from "./src/plugins/rehype-view-transition-names.js";

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	markdown: {
		syntaxHighlight: "prism",
		rehypePlugins: [rehypeViewTransitionNames, rehypeOptimizeFirstImage],
	},
	integrations: [
		sitemap({
			// Exclude any draft blog post URLs using the conventional `_draft-` slug prefix.
			// The sitemap integration does not expose markdown frontmatter, so we rely on URL pattern.
			// Example draft path: https://th3s4mur41.me/blog/_draft-my-new-post/
			filter: (pageUrl) => !pageUrl.includes("/_draft-"),
		}),
		mdx({
			rehypePlugins: [rehypeViewTransitionNames, rehypeOptimizeFirstImage],
		}),
		compress({
			HTML: {
				removeComments: true,
				collapseWhitespace: false,
				removeAttributeQuotes: false,
			},
			CSS: true,
			JavaScript: true,
		}),
	],
	devToolbar: {
		enabled: false, // Disable the Astro toolbar
	},
});
