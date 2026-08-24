/**
 * Targets for the visual regression suite.
 *
 * Keep this list intentionally small and curated: every entry multiplies the number
 * of screenshots (one per browser/viewport project), so only add pages whose layout
 * is worth guarding against regressions.
 */

/** Static pages that always exist, independent of content collections. */
export const STATIC_ROUTES = [
	{ name: "home", path: "/" },
	{ name: "blog-index", path: "/blog/" },
	{ name: "about", path: "/about/" },
	{ name: "specs", path: "/specs/" },
	// TODO: enable once the resume page ships.
	// { name: "cv", path: "/cv/" },
];

/**
 * Representative entries per content collection, keyed by section.
 * Values are entry slugs as they appear in the URL (`/<section>/<slug>/`).
 */
export const COLLECTION_ENTRIES = {
	blog: ["href-hash-focus-desync-accessibility", "mixins-from-preprocessors-to-native-css"],
	speaking: ["you-dont-need-js-for-that"],
	notes: ["standard-site"],
};

/** Flattened list of every route the visual suite covers. */
export const VISUAL_ROUTES = [
	...STATIC_ROUTES,
	...Object.entries(COLLECTION_ENTRIES).flatMap(([section, slugs]) =>
		slugs.map((slug) => ({ name: `${section}-${slug}`, path: `/${section}/${slug}/` })),
	),
];
