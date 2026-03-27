import getReadingTime from "reading-time";
import { visit } from "unist-util-visit";

/**
 * Remark plugin to compute reading time from markdown content.
 */
export default function remarkReadingTime({ attribute = "readingTime", wordsPerMinute = 130 } = {}) {
	return function transformer(tree, file) {
		let text = "";

		visit(tree, ["text", "code"], (node) => {
			text += node.value;
		});

		file.data ||= {};
		file.data[attribute] = getReadingTime(text, { wordsPerMinute });
	};
}
