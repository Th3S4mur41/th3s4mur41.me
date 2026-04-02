import getReadingTime from "reading-time";
import { extractReadingTimeChunks, SITE_CONFIG } from "../utils/config.js";

/**
 * Remark plugin to compute reading time from markdown content.
 */
export function remarkReadingTime({
	attribute = "readingTime",
	wordsPerMinute = SITE_CONFIG.readingTime.wordsPerMinute,
} = {}) {
	return function transformer(tree, file) {
		// Collect text from relevant nodes to compute reading time.
		const chunks = extractReadingTimeChunks(tree);
		const text = chunks.join("\n\n");
		if (text.trim().length === 0) {
			return;
		}

		const stats = getReadingTime(text, { wordsPerMinute });
		if (stats.words <= 0) {
			return;
		}

		file.data ||= {};
		file.data[attribute] = stats;

		// Expose reading stats on entry.data via Astro frontmatter so list views
		// can consume it without reparsing markdown in components.
		if (file.data.astro?.frontmatter && typeof file.data.astro.frontmatter === "object") {
			file.data.astro.frontmatter[attribute] = stats;
		}
	};
}
