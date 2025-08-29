import { h } from "hastscript";
import { visit } from "unist-util-visit";

export default function rehypeSeparator() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName === "hr") {
				const svgNode = h(
					"svg",
					{
						xmlns: "http://www.w3.org/2000/svg",
						viewBox: "0 0 100 20",
						role: "separator",
						class: "katana-slash",
						"aria-hidden": "false",
						preserveAspectRatio: "none",
					},
					[
						h("path", {
							d: "M0 10 Q50 0 100 10",
							stroke: "black",
							"stroke-width": "2",
							fill: "none",
							"stroke-linecap": "round",
						}),
					],
				);

				parent.children[index] = svgNode;
			}
		});
	};
}
