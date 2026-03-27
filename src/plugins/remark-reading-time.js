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
		file.data ||= {};
		file.data[attribute] = getReadingTime(text, { wordsPerMinute });
	};
}
