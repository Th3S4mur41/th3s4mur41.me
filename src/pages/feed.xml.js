import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";

const escapeXmlText = (value) =>
	value
		.replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

const sanitizeDescription = (value) =>
	value
		// Some feed validators treat <description> as HTML and complain about '&' sequences.
		// Replacing '&' avoids false positives while keeping meaning.
		.replace(/\s*&\s*/g, " and ")
		.replace(/\s{2,}/g, " ")
		.trim();

export async function GET(context) {
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();
	const site = context.site ?? new URL(new URL(context.request.url).origin);
	const feedUrl = new URL("/feed.xml", site).href;

	const [blogEntries, talkEntries] = await Promise.all([
		getCollection("blog", ({ data }) => isVisibleContent(data, { now, previewFuture })),
		getCollection("talks", ({ data }) => isVisibleContent(data, { now, previewFuture })),
	]);

	const items = [
		...blogEntries.map((entry) => ({
			section: "blog",
			entry,
		})),
		...talkEntries.map((entry) => ({
			section: "talks",
			entry,
		})),
	]
		.sort((a, b) => b.entry.data.date.valueOf() - a.entry.data.date.valueOf())
		.map(({ section, entry }) => ({
			title: entry.data.title,
			description: sanitizeDescription(entry.data.description ?? ""),
			pubDate: entry.data.date,
			link: `/${section}/${entry.id}/`,
			categories: entry.data.tags ?? [],
		}));

	const channelPubDate = items[0]?.pubDate ?? now;
	const channelLastBuildDate =
		[
			...blogEntries.map((entry) => entry.data.updated ?? entry.data.date),
			...talkEntries.map((entry) => entry.data.updated ?? entry.data.date),
		].sort((a, b) => b.valueOf() - a.valueOf())[0] ?? channelPubDate;
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
			`<pubDate>${channelPubDate.toUTCString()}</pubDate>`,
			`<lastBuildDate>${channelLastBuildDate.toUTCString()}</lastBuildDate>`,
			"<ttl>60</ttl>",
			`<copyright>${escapeXmlText(copyright)}</copyright>`,
		].join(""),
		items,
	});
}
