import { getCollection } from "astro:content";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";

export async function GET(context) {
	const siteUrl = context.site ?? new URL("https://th3s4mur41.me");
	const homePageUrl = new URL("/", siteUrl).href;
	const feedUrl = new URL("/feed.json", siteUrl).href;
	const authorUrl = new URL("/about/", siteUrl).href;
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();

	const [blogEntries, talkEntries] = await Promise.all([
		getCollection("blog", ({ data }) => isVisibleContent(data, { now, previewFuture })),
		getCollection("talks", ({ data }) => isVisibleContent(data, { now, previewFuture })),
	]);

	const toItem = (section, entry) => {
		const url = new URL(`/${section}/${entry.id}/`, siteUrl).href;
		return {
			id: url,
			url,
			external_url: entry.data.canonical ?? undefined,
			title: entry.data.title,
			summary: entry.data.description ?? undefined,
			date_published: entry.data.date.toISOString(),
			date_modified: entry.data.updated ? entry.data.updated.toISOString() : undefined,
			author: {
				name: "Michaël Vanderheyden",
				url: authorUrl,
			},
			tags: entry.data.tags ?? undefined,
		};
	};

	const items = [
		...blogEntries.map((entry) => toItem("blog", entry)),
		...talkEntries.map((entry) => toItem("talks", entry)),
	].sort((a, b) => (b.date_published ?? "").localeCompare(a.date_published ?? ""));

	const feed = {
		version: "https://jsonfeed.org/version/1.1",
		title: "Th3S4mur41.me",
		home_page_url: homePageUrl,
		feed_url: feedUrl,
		description: "Web development, accessibility, performance, CSS, JavaScript, UI/UX and open source insights.",
		author: {
			name: "Michaël Vanderheyden",
			url: authorUrl,
		},
		language: "en",
		items,
	};

	return new Response(JSON.stringify(feed), {
		headers: {
			"Content-Type": "application/feed+json; charset=utf-8",
		},
	});
}
