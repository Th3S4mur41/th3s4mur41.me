import getReadingTime from "reading-time";
import { defineMdastPlugin } from "satteri";
import { extractReadingTimeChunks, SITE_CONFIG } from "../utils/config.js";

/**
 * Sätteri MDAST plugin to compute reading time statistics from markdown content.
 *
 * The plugin collects text from content nodes and computes reading time metrics.
 * The stats object is stored in ctx.data.readingTime for use by HAST plugins
 * (e.g., satteri-inject-toc) and downstream processors.
 */
export function createSatteriReadingTimePlugin(options = {}) {
	const { wordsPerMinute = SITE_CONFIG.readingTime.wordsPerMinute } = options;

	return defineMdastPlugin({
		name: "satteri-reading-time",
		root(tree, ctx) {
			// Collect text chunks from the tree
			const chunks = extractReadingTimeChunks(tree);
			const text = chunks.join("\n\n");

			if (text.trim().length === 0) {
				return;
			}

			// Compute reading time stats
			const stats = getReadingTime(text, { wordsPerMinute });

			if (stats.words <= 0) {
				return;
			}

			// Store stats in context data for use by downstream processors
			// This persists through the MDAST→HAST transition
			ctx.data.readingTime = stats;
		},
	});
}
