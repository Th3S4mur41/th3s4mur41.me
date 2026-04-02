import getReadingTime from "reading-time";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { extractReadingTimeChunks, SITE_CONFIG } from "./config.js";

const markdownProcessor = unified().use(remarkParse).use(remarkMdx);
const readingTimeCache = new Map();

/**
 * Compute reading-time stats from markdown content with shared cache.
 */
export function getReadingTimeFromMarkdown(markdown) {
	if (typeof markdown !== "string" || markdown.trim().length === 0) {
		return { stats: undefined, source: "fallback-unavailable" };
	}

	const cached = readingTimeCache.get(markdown);
	if (cached) {
		return { stats: cached, source: "fallback-cached" };
	}

	const tree = markdownProcessor.parse(markdown);
	const chunks = extractReadingTimeChunks(tree);
	const text = chunks.join("\n\n");
	const stats = getReadingTime(text, { wordsPerMinute: SITE_CONFIG.readingTime.wordsPerMinute });

	readingTimeCache.set(markdown, stats);
	return { stats, source: "fallback-parsed" };
}

export function getReadingTimeCacheSize() {
	return readingTimeCache.size;
}
