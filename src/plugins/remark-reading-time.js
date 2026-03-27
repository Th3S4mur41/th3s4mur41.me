import getReadingTime from "reading-time";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to compute reading time from markdown content.
 */
export function remarkReadingTime({ attribute = "readingTime", wordsPerMinute = 130 } = {}) {
	return function transformer(tree, file) {
		// Collect text from relevant nodes to compute reading time.
		const chunks = [];

		visit(tree, ["text", "code", "inlineCode"], (node) => {
			// Push each node's value separately to avoid merging words across node boundaries.
			chunks.push(node.value);
		});

		const text = chunks.join("\n\n");
		file.data ||= {};
		file.data[attribute] = getReadingTime(text, { wordsPerMinute });
	};
}
