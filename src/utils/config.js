import { visit } from "unist-util-visit";

export const SITE_CONFIG = {
	readingTime: {
		wordsPerMinute: 130,
	},
};

/**
 * Extracts text chunks from a markdown AST for reading time calculation.
 * Collects text from readable content nodes while excluding metadata like alt attributes.
 */
export function extractReadingTimeChunks(tree) {
	const chunks = [];
	visit(tree, ["text", "code", "inlineCode", "html"], (node) => {
		// HTML nodes contain raw HTML content (e.g., figcaptions), extract text via regex.
		if (node.type === "html" && node.value) {
			// Remove HTML tags to get readable text
			const textContent = node.value.replace(/<[^>]*>/g, " ");
			chunks.push(textContent);
		} else if (node.value) {
			chunks.push(node.value);
		}
	});
	return chunks;
}
