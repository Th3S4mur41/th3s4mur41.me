import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";
import { createSatteriTableWrapperPlugin } from "../plugins/satteri-table-wrapper.js";

const render = (markdown) =>
	markdownToHtml(markdown, { features: { gfm: true }, hastPlugins: [createSatteriTableWrapperPlugin] });

describe("createSatteriTableWrapperPlugin", () => {
	it("wraps a markdown table in a scroll container", async () => {
		const { html } = await render("| A | B |\n|---|---|\n| 1 | 2 |\n");
		expect(html.trim()).toMatch(/^<div class="table-wrapper"><table>[\s\S]*<\/table><\/div>$/);
	});

	it("wraps each table exactly once", async () => {
		const table = "| A |\n|---|\n| 1 |\n";
		const { html } = await render(`${table}\ntext\n\n${table}`);
		expect(html.match(/class="table-wrapper"/g)).toHaveLength(2);
		expect(html).not.toContain('<div class="table-wrapper"><div');
	});
});
