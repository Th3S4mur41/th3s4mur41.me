/**
 * Sätteri HAST plugin that wraps tables in a scroll container.
 *
 * Wide tables would otherwise overflow the article and cause page-level horizontal scrolling
 * on narrow viewports. The wrapper scrolls instead (see `.table-wrapper` in base.css).
 */
export function createSatteriTableWrapperPlugin() {
	return {
		name: "satteri-table-wrapper",
		element: {
			filter: ["table"],
			visit(node, ctx) {
				const parent = ctx.parent(node);
				if (parent?.type === "element" && parent.properties?.className?.includes?.("table-wrapper")) {
					return;
				}

				ctx.wrapNode(node, {
					type: "element",
					tagName: "div",
					properties: { className: ["table-wrapper"] },
					children: [],
				});
			},
		},
	};
}
