/**
 * Tag display names and utilities
 * Maps tag slugs to their human-readable display names
 */

export const TAG_DISPLAY_NAMES = {
	html: "HTML",
	css: "CSS",
	javascript: "JavaScript",
	a11y: "Accessibility",
	devops: "DevOps",
	testing: "Testing",
	ux: "UX",
	dx: "Developer Experience",
	"code-quality": "Code Quality",
	"how-to": "How-To",
	ai: "AI",
	thoughts: "Thoughts",
};

// Derive allowed tags from display names to avoid duplication
export const ALLOWED_TAGS = Object.keys(TAG_DISPLAY_NAMES);

/**
 * Get display name for a tag
 * @param {string} tag - The tag slug
 * @returns {string} The display name, or the tag itself if not found
 */
export function getTagDisplayName(tag) {
	return TAG_DISPLAY_NAMES[tag] || tag;
}

/**
 * Sort tags for consistent ordering
 * @param {string[]} tags - Array of tag slugs
 * @returns {string[]} Sorted tags
 */
export function sortTags(tags) {
	return [...tags].sort((a, b) => {
		const aIndex = ALLOWED_TAGS.indexOf(a);
		const bIndex = ALLOWED_TAGS.indexOf(b);
		return (aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex) - (bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex);
	});
}
