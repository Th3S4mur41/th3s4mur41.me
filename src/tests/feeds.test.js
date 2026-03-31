/**
 * Feed format validation tests.
 *
 * These tests verify that the generated RSS (feed.xml) and JSON Feed (feed.json)
 * files match their respective specifications and contain the enhanced metadata
 * (author, hero image, full article content) introduced by the feed enhancement feature.
 *
 * Prerequisites: run `npm run build` before `npm test` so dist/ exists.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DIST_DIR = resolve(import.meta.dirname, "../../dist");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readDistFile(name) {
	return readFileSync(resolve(DIST_DIR, name), "utf-8");
}

/**
 * Minimal XML attribute parser — returns the value of the first occurrence of
 * `attrName` inside `xmlStr`, handling both `attr="value"` and `attr='value'`.
 */
function extractAttrValue(xmlStr, attrName) {
	const regex = new RegExp(`${attrName}=["']([^"']+)["']`);
	return xmlStr.match(regex)?.[1];
}

/** Return all occurrences of a tag's content from an XML string. */
function extractAllTagContents(xmlStr, tagName) {
	const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "g");
	return [...xmlStr.matchAll(regex)].map((m) => m[1]);
}

/** Return the first occurrence of a tag's text content. */
function extractTagContent(xmlStr, tagName) {
	return extractAllTagContents(xmlStr, tagName)[0] ?? null;
}

// ---------------------------------------------------------------------------
// RSS feed (feed.xml)
// ---------------------------------------------------------------------------

describe("RSS feed (feed.xml)", () => {
	let xml;

	it("exists in dist/", () => {
		xml = readDistFile("feed.xml");
		expect(xml).toBeTruthy();
	});

	it("is well-formed XML starting with the XML declaration", () => {
		expect(xml).toMatch(/^<\?xml version="1\.0"/);
	});

	it("declares RSS version 2.0", () => {
		expect(xml).toContain('version="2.0"');
	});

	it("declares the content:encoded namespace", () => {
		expect(xml).toContain("http://purl.org/rss/1.0/modules/content/");
	});

	it("declares the Atom namespace for self-link", () => {
		expect(xml).toContain("http://www.w3.org/2005/Atom");
	});

	it("has required channel metadata", () => {
		expect(extractTagContent(xml, "title")).toBeTruthy();
		expect(extractTagContent(xml, "description")).toBeTruthy();
		expect(extractTagContent(xml, "link")).toBeTruthy();
		expect(extractTagContent(xml, "language")).toBe("en");
		expect(extractTagContent(xml, "copyright")).toBeTruthy();
	});

	it("contains at least one <item>", () => {
		const items = extractAllTagContents(xml, "item");
		expect(items.length).toBeGreaterThan(0);
	});

	it("every item has a <title>", () => {
		// Isolate each <item>…</item> block.
		const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
		for (const item of itemBlocks) {
			expect(extractTagContent(item, "title")).toBeTruthy();
		}
	});

	it("every item has a <link> and <guid>", () => {
		const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
		for (const item of itemBlocks) {
			expect(extractTagContent(item, "link")).toBeTruthy();
			expect(extractTagContent(item, "guid")).toBeTruthy();
		}
	});

	it("every item has an <author> element", () => {
		const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
		for (const item of itemBlocks) {
			const author = extractTagContent(item, "author");
			expect(author).toBeTruthy();
			expect(author).toContain("Vanderheyden");
		}
	});

	it("items with a hero image have an <enclosure> with an avif URL", () => {
		const enclosures = [...xml.matchAll(/<enclosure[^>]+>/g)].map((m) => m[0]);
		// Not every item must have an enclosure, but those that do should have avif.
		for (const enc of enclosures) {
			expect(enc).toContain('type="image/avif"');
			expect(extractAttrValue(enc, "url")).toMatch(/\.avif(\?|$)/);
		}
	});

	it("items have <content:encoded> with non-empty HTML", () => {
		const encodedBlocks = extractAllTagContents(xml, "content:encoded");
		expect(encodedBlocks.length).toBeGreaterThan(0);
		for (const block of encodedBlocks) {
			// CDATA or escaped HTML — should contain at least an opening tag
			expect(block.length).toBeGreaterThan(10);
		}
	});

	it("content:encoded does not contain raw markdown table pipes", () => {
		const encodedBlocks = extractAllTagContents(xml, "content:encoded");
		for (const block of encodedBlocks) {
			// A rendered HTML table should have <table>, not bare `| col |`
			const hasMarkdownTable = /^\|\s*\w/m.test(block);
			expect(hasMarkdownTable, "Raw markdown table found in content:encoded").toBe(false);
		}
	});

	it("content:encoded does not contain Astro view-transition-name styles", () => {
		const encodedBlocks = extractAllTagContents(xml, "content:encoded");
		for (const block of encodedBlocks) {
			expect(block).not.toContain("view-transition-name");
		}
	});
});

// ---------------------------------------------------------------------------
// JSON feed (feed.json)
// ---------------------------------------------------------------------------

describe("JSON feed (feed.json)", () => {
	let feed;

	it("exists in dist/ and is valid JSON", () => {
		const raw = readDistFile("feed.json");
		expect(() => {
			feed = JSON.parse(raw);
		}).not.toThrow();
	});

	it("conforms to JSON Feed 1.1 version URL", () => {
		expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
	});

	it("has required top-level fields", () => {
		expect(feed.title).toBeTruthy();
		expect(feed.home_page_url).toMatch(/^https?:\/\//);
		expect(feed.feed_url).toMatch(/^https?:\/\//);
		expect(feed.description).toBeTruthy();
	});

	it("has feed-level authors array (JSON Feed 1.1)", () => {
		expect(Array.isArray(feed.authors)).toBe(true);
		expect(feed.authors.length).toBeGreaterThan(0);
		expect(feed.authors[0].name).toContain("Vanderheyden");
		expect(feed.authors[0].url).toMatch(/^https?:\/\//);
	});

	it("has at least one item", () => {
		expect(Array.isArray(feed.items)).toBe(true);
		expect(feed.items.length).toBeGreaterThan(0);
	});

	it("every item has the required fields", () => {
		for (const item of feed.items) {
			expect(item.id).toMatch(/^https?:\/\//);
			expect(item.url).toMatch(/^https?:\/\//);
			expect(item.title).toBeTruthy();
			expect(item.date_published).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		}
	});

	it("every item has an authors array (JSON Feed 1.1)", () => {
		for (const item of feed.items) {
			expect(Array.isArray(item.authors)).toBe(true);
			expect(item.authors.length).toBeGreaterThan(0);
			expect(item.authors[0].name).toContain("Vanderheyden");
		}
	});

	it("items with a hero image have an absolute avif image URL", () => {
		const itemsWithImage = feed.items.filter((i) => i.image);
		expect(itemsWithImage.length).toBeGreaterThan(0);
		for (const item of itemsWithImage) {
			expect(item.image).toMatch(/^https?:\/\//);
			expect(item.image).toMatch(/\.avif(\?|$)/);
		}
	});

	it("items have content_html with non-empty HTML", () => {
		const itemsWithContent = feed.items.filter((i) => i.content_html);
		expect(itemsWithContent.length).toBeGreaterThan(0);
		for (const item of itemsWithContent) {
			expect(item.content_html.length).toBeGreaterThan(10);
		}
	});

	it("content_html does not contain raw markdown table pipes", () => {
		for (const item of feed.items) {
			if (!item.content_html) continue;
			const hasMarkdownTable = /^\|\s*\w/m.test(item.content_html);
			expect(hasMarkdownTable, `Raw markdown table in item "${item.title}"`).toBe(false);
		}
	});

	it("content_html does not contain Astro view-transition-name styles", () => {
		for (const item of feed.items) {
			if (!item.content_html) continue;
			expect(item.content_html).not.toContain("view-transition-name");
		}
	});

	it("content_html image srcs are absolute avif or svg URLs", () => {
		for (const item of feed.items) {
			if (!item.content_html) continue;
			// Only check <img> tag srcs, not script or other element srcs.
			const imgSrcs = [...item.content_html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
			for (const src of imgSrcs) {
				expect(src, `Non-absolute src in "${item.title}"`).toMatch(/^https?:\/\//);
				// Images must be either avif (rasterized) or svg (vector, cannot be converted).
				expect(src, `Unexpected image format in "${item.title}"`).toMatch(/\.(avif|svg)(\?|$)/);
			}
		}
	});
});
