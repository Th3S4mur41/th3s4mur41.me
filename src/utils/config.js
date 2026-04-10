import { visit } from "unist-util-visit";

export const SITE_CONFIG = {
	readingTime: {
		wordsPerMinute: 130,
	},
	date: {
		locale: "en-GB",
		formatOptions: {
			year: "numeric",
			month: "short",
			day: "numeric",
		},
	},
};

export function formatSiteDate(value, overrides = {}) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.valueOf())) {
		return "";
	}

	return date.toLocaleDateString(SITE_CONFIG.date.locale, {
		...SITE_CONFIG.date.formatOptions,
		...overrides,
	});
}

export function formatIsoDateAsSiteDate(isoDate) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
		return "";
	}

	const [year, month, day] = isoDate.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (Number.isNaN(date.valueOf())) {
		return "";
	}

	return formatSiteDate(date, { timeZone: "UTC" });
}

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
