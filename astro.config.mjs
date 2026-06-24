import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import browserslist from "browserslist";
import browserslistToEsbuild from "browserslist-to-esbuild";
import { browserslistToTargets } from "lightningcss";
import { createSatteriExternalLinksPlugin } from "./src/plugins/satteri-external-links.js";
import { createSatteriGithubAlertsA11yPlugin } from "./src/plugins/satteri-github-alerts-a11y.js";
import { createSatteriHeadingDatesPlugin } from "./src/plugins/satteri-heading-dates.js";
import { createSatteriInjectTocPlugin } from "./src/plugins/satteri-inject-toc.js";
import { createSatteriOptimizeFirstImagePlugin } from "./src/plugins/satteri-optimize-first-image.js";
import { createSatteriReadingTimePlugin } from "./src/plugins/satteri-reading-time.js";
import { createSatteriViewTransitionNamesPlugin } from "./src/plugins/satteri-view-transition-names.js";
import { SITE_CONFIG } from "./src/utils/config.js";

const satteriProcessor = satteri({
	mdastPlugins: [createSatteriReadingTimePlugin({ wordsPerMinute: SITE_CONFIG.readingTime.wordsPerMinute })],
	hastPlugins: [
		createSatteriHeadingDatesPlugin,
		createSatteriInjectTocPlugin,
		createSatteriViewTransitionNamesPlugin,
		createSatteriGithubAlertsA11yPlugin,
		createSatteriOptimizeFirstImagePlugin,
		createSatteriExternalLinksPlugin,
	],
});

const BROWSERSLIST_OPTIONS = { path: process.cwd() };
const resolvedBrowsers = browserslist(undefined, BROWSERSLIST_OPTIONS);
const lightningCssTargets = browserslistToTargets(resolvedBrowsers);
const viteCssTargets = browserslistToEsbuild(resolvedBrowsers);

// https://astro.build/config
export default defineConfig({
	site: "https://th3s4mur41.me",
	vite: {
		css: {
			transformer: "lightningcss",
			lightningcss: {
				targets: lightningCssTargets,
			},
		},
		build: {
			cssMinify: "lightningcss",
			cssTarget: viteCssTargets,
		},
	},
	markdown: {
		syntaxHighlight: "prism",
		processor: satteriProcessor,
	},
	integrations: [
		sitemap({
			// Exclude any draft blog post URLs using the conventional `_draft-` slug prefix.
			// The sitemap integration does not expose markdown frontmatter, so we rely on URL pattern.
			// Example draft path: https://th3s4mur41.me/blog/_draft-my-new-post/
			filter: (pageUrl) => !pageUrl.includes("/_draft-"),
		}),
		mdx({
			processor: satteriProcessor,
		}),
		compress({
			HTML: {
				removeComments: true,
				collapseWhitespace: false,
				removeAttributeQuotes: false,
			},
			// CSS is already transformed and minified by Lightning CSS in Vite.
			// A second pass here drops some modern/nested declarations in production.
			CSS: false,
			JavaScript: true,
			Image: false,
		}),
	],
	devToolbar: {
		enabled: false,
	},
});
