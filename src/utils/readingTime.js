import getReadingTime from "reading-time";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { extractReadingTimeChunks, SITE_CONFIG } from "./config.js";

const markdownProcessor = unified().use(remarkParse).use(remarkMdx);

/**
 * Compute reading-time stats from markdown content.
 * Used primarily during collection loading to populate entry.data.readingTime.
 * This function performs a pure reading-time computation without any internal caching.
 */
export function computeReadingTime(markdown) {
	if (typeof markdown !== "string" || markdown.trim().length === 0) {
		return undefined;
	}

	const tree = markdownProcessor.parse(markdown);
	const chunks = extractReadingTimeChunks(tree);
	const text = chunks.join("\n\n");
	return getReadingTime(text, { wordsPerMinute: SITE_CONFIG.readingTime.wordsPerMinute });
}
