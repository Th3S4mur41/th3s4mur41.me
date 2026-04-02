import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import { rehypeGithubAlerts } from "rehype-github-alerts";
import remarkReadingTime from "remark-reading-time";
import {
	rehypeExternalLinks,
	rehypeInjectToc,
	rehypeOptimizeFirstImage,
	rehypeViewTransitionNames,
} from "./src/plugins/index.js";

const sharedRehypePlugins = [rehypeInjectToc, rehypeViewTransitionNames, rehypeOptimizeFirstImage, rehypeExternalLinks];
const mdxRehypePlugins = [
	rehypeInjectToc,
	rehypeViewTransitionNames,
	rehypeGithubAlerts,
	rehypeOptimizeFirstImage,
	rehypeExternalLinks,
];

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	markdown: {
		syntaxHighlight: "prism",
		remarkPlugins: [remarkReadingTime],
		rehypePlugins: sharedRehypePlugins,
	},
	integrations: [
		sitemap({
			// Exclude any draft blog post URLs using the conventional `_draft-` slug prefix.
			// The sitemap integration does not expose markdown frontmatter, so we rely on URL pattern.
			// Example draft path: https://th3s4mur41.me/blog/_draft-my-new-post/
			filter: (pageUrl) => !pageUrl.includes("/_draft-"),
		}),
		mdx({
			remarkPlugins: [remarkReadingTime],
			rehypePlugins: mdxRehypePlugins,
		}),
		compress({
			HTML: {
				removeComments: true,
				collapseWhitespace: false,
				removeAttributeQuotes: false,
			},
			CSS: true,
			JavaScript: true,
			Image: false,
		}),
	],
	devToolbar: {
		enabled: false, // Disable the Astro toolbar
	},
});
