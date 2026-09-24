import { markdownToHtml } from "satteri";
import { describe, expect, it, vi } from "vitest";
import { CODEPEN_EMBED_HEIGHT, createSatteriCodePenEmbedsPlugin } from "../plugins/satteri-codepen-embeds.js";

function createMetadata(penUrl, { title = "Example Pen", slug = "AbC123", author = "Example Author" } = {}) {
	const user = new URL(penUrl).pathname
		.split("/")
		.filter(Boolean)
		.find((part) => part !== "editor");
	return {
		success: true,
		title,
		author_name: author,
		author_url: `https://codepen.io/${user}`,
		html: `<iframe src="https://codepen.io/${user}/embed/preview/${slug}" title="${title}"></iframe>`,
	};
}

function createFetch(metadata, status = 200) {
	return vi.fn(async () => new Response(JSON.stringify(metadata), { status }));
}

async function render(markdown, fetchImpl, cache = new Map()) {
	return markdownToHtml(markdown, {
		features: { gfm: true },
		hastPlugins: [createSatteriCodePenEmbedsPlugin({ fetchImpl, cache, requestIntervalMs: 0, retryDelaysMs: [] })],
	});
}

describe("createSatteriCodePenEmbedsPlugin", () => {
	it("uses reviewed metadata for published Pens without a network request", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const fetchImpl = vi.fn();
		const { html } = await markdownToHtml(penUrl, {
			features: { gfm: true },
			hastPlugins: [createSatteriCodePenEmbedsPlugin({ fetchImpl })],
		});

		expect(html).toContain('title="Language selectors"');
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it.each([
		"https://codepen.io/th3s4mur41/pen/OPNZWVj",
		"https://codepen.io/editor/th3s4mur41/pen/019f27a0-85d5-7086-bf79-1bcec3b27156",
	])("renders a standalone %s URL as an accessible figure", async (penUrl) => {
		const fetchImpl = createFetch(createMetadata(penUrl, { title: "Language selectors" }));
		const { html } = await render(penUrl, fetchImpl);

		expect(html).toContain('<figure class="codepen-embed">');
		expect(html).toContain(`height="${CODEPEN_EMBED_HEIGHT}"`);
		expect(html).toContain('loading="lazy"');
		expect(html).toContain('title="Language selectors"');
		expect(html).toContain(`href="${penUrl}"`);
		expect(html).toContain("View “");
		expect(fetchImpl).toHaveBeenCalledOnce();

		const endpoint = fetchImpl.mock.calls[0][0];
		expect(endpoint.searchParams.get("url")).toBe(penUrl);
		expect(endpoint.searchParams.get("height")).toBe(String(CODEPEN_EMBED_HEIGHT));
	});

	it("deduplicates metadata requests for repeated Pens", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const fetchImpl = createFetch(createMetadata(penUrl));
		const { html } = await render(`${penUrl}\n\n${penUrl}`, fetchImpl);

		expect(html.match(/class="codepen-embed"/g)).toHaveLength(2);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it("serializes metadata requests for different Pens", async () => {
		let activeRequests = 0;
		let maximumActiveRequests = 0;
		const fetchImpl = vi.fn(async (endpoint) => {
			activeRequests += 1;
			maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
			await Promise.resolve();
			activeRequests -= 1;

			const penUrl = endpoint.searchParams.get("url");
			return new Response(JSON.stringify(createMetadata(penUrl)));
		});

		await render("https://codepen.io/th3s4mur41/pen/OPNZWVj\n\nhttps://codepen.io/th3s4mur41/pen/zxqgLYR", fetchImpl);

		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(maximumActiveRequests).toBe(1);
	});

	it.each([
		"A demo: https://codepen.io/th3s4mur41/pen/OPNZWVj",
		"[Language selectors](https://codepen.io/th3s4mur41/pen/OPNZWVj)",
		"https://example.com/demo",
	])("leaves non-standalone CodePen URLs and other links unchanged", async (markdown) => {
		const fetchImpl = vi.fn();
		const { html } = await render(markdown, fetchImpl);

		expect(html).not.toContain("codepen-embed");
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("fails when CodePen returns incomplete metadata", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const fetchImpl = createFetch({ success: false });

		await expect(render(penUrl, fetchImpl)).rejects.toThrow(`incomplete metadata for ${penUrl}`);
	});

	it("retries transient CodePen responses", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const fetchImpl = vi
			.fn()
			.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }))
			.mockResolvedValueOnce(new Response(JSON.stringify(createMetadata(penUrl))));
		const plugin = createSatteriCodePenEmbedsPlugin({
			fetchImpl,
			cache: new Map(),
			requestIntervalMs: 0,
			retryDelaysMs: [0],
		});

		const { html } = await markdownToHtml(penUrl, { features: { gfm: true }, hastPlugins: [plugin] });

		expect(html).toContain("codepen-embed");
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("does not retry non-transient CodePen responses", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const fetchImpl = createFetch({ success: false }, 404);
		const plugin = createSatteriCodePenEmbedsPlugin({
			fetchImpl,
			cache: new Map(),
			requestIntervalMs: 0,
			retryDelaysMs: [0, 0],
		});

		await expect(markdownToHtml(penUrl, { features: { gfm: true }, hastPlugins: [plugin] })).rejects.toThrow(
			`HTTP 404 for ${penUrl}`,
		);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it("rejects iframe sources outside CodePen", async () => {
		const penUrl = "https://codepen.io/th3s4mur41/pen/OPNZWVj";
		const metadata = createMetadata(penUrl);
		metadata.html = '<iframe src="https://example.com/embed/AbC123"></iframe>';

		await expect(render(penUrl, createFetch(metadata))).rejects.toThrow(`invalid iframe source for ${penUrl}`);
	});
});
