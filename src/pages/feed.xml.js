import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { isSeriesContainerEntry } from "../utils/contentSeries";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";
import { getHeroImageUrl, renderBodyToHtml } from "../utils/feedHelpers";

const escapeXmlText = (value) =>
	value
		.replace(/&(?!(?:[a-zA-Z]+|#\d+|#[xX][0-9a-fA-F]+);)/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

const sanitizeDescription = (value) =>
	value
		// Some feed validators treat <description> as HTML and complain about '&' sequences.
		// Replacing '&' avoids false positives while keeping meaning.
		.replace(/\s*&\s*/g, " and ")
		.replace(/\s{2,}/g, " ")
		.trim();

/** Derive the MIME type from an image URL string (defaults to image/jpeg). */
function imageMimeType(url) {
	if (!url) return "image/jpeg";
	const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
	const map = { png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif" };
	return map[ext] ?? "image/jpeg";
}

const FEED_LIMIT = 50;

export async function GET(context) {
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();
	const site = context.site ?? new URL(new URL(context.request.url).origin);
	const feedUrl = new URL("/feed.xml", site).href;
	const iconUrl = new URL("/icons/favicon-512.png", site).href;

	const [blogEntries, talkEntries] = await Promise.all([
		getCollection("blog", ({ data }) => isVisibleContent(data, { now, previewFuture })),
		getCollection("speaking", ({ data }) => isVisibleContent(data, { now, previewFuture })),
	]);
	const blogPosts = blogEntries.filter((entry) => !isSeriesContainerEntry(entry, blogEntries));

	const sortedEntries = [
		...blogPosts.map((entry) => ({ section: "blog", entry })),
		...talkEntries.map((entry) => ({ section: "speaking", entry })),
	]
		.sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
		.slice(0, FEED_LIMIT);

	const items = await Promise.all(
		sortedEntries.map(async ({ section, entry }) => {
			const [heroImageUrl, contentHtml] = await Promise.all([
				getHeroImageUrl(section, entry.id, entry.data.image, site),
				renderBodyToHtml(entry, site),
			]);

			return {
				title: entry.data.title,
				description: sanitizeDescription(entry.data.description ?? ""),
				pubDate: entry.data.date,
				link: `/${section}/${entry.id}/`,
				categories: entry.data.tags ?? [],
				author: "Michaël Vanderheyden",
				// length: 0 — file size of processed images is not available at build time.
				// Most RSS readers treat 0 as "unknown" and still load the image correctly.
				...(heroImageUrl && { enclosure: { url: heroImageUrl, type: imageMimeType(heroImageUrl), length: 0 } }),
				...(contentHtml && { content: contentHtml }),
			};
		}),
	);

	const channelPubDate = items[0]?.pubDate ?? now;
	// Use the build time instead of latest content date so every new deploy
	// signals readers to refresh the feed, even if no articles changed.
	const channelLastBuildDate = now;
	const copyright = `Copyright ${now.getUTCFullYear()} Michaël Vanderheyden`;

	return rss({
		title: "Th3S4mur41.me",
		description: "Web development, accessibility, performance, CSS, JavaScript, UI/UX and open source insights.",
		site,
		xmlns: {
			atom: "http://www.w3.org/2005/Atom",
		},
		customData: [
			`<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
			"<language>en</language>",
			`<pubDate>${channelPubDate.toUTCString()}</pubDate>`,
			`<lastBuildDate>${channelLastBuildDate.toUTCString()}</lastBuildDate>`,
			"<ttl>60</ttl>",
			`<copyright>${escapeXmlText(copyright)}</copyright>`,
			`<image><url>${iconUrl}</url><title>Th3S4mur41.me</title><link>${new URL("/", site).href}</link></image>`,
			"<managingEditor>hello@th3s4mur41.me (Michaël Vanderheyden)</managingEditor>",
		].join(""),
		items,
	});
}
