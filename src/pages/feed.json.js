import { getCollection } from "astro:content";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";
import { getHeroImageUrl, renderBodyToHtml } from "../utils/feedHelpers";

export async function GET(context) {
	const siteUrl = context.site ?? new URL(new URL(context.request.url).origin);
	const homePageUrl = new URL("/", siteUrl).href;
	const feedUrl = new URL("/feed.json", siteUrl).href;
	const authorUrl = new URL("/about/", siteUrl).href;
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();

	const [blogEntries, talkEntries] = await Promise.all([
		getCollection("blog", ({ data }) => isVisibleContent(data, { now, previewFuture })),
		getCollection("talks", ({ data }) => isVisibleContent(data, { now, previewFuture })),
	]);

	const toItem = async (section, entry) => {
		const url = new URL(`/${section}/${entry.id}/`, siteUrl).href;
		const [heroImageUrl, contentHtml] = await Promise.all([
			getHeroImageUrl(section, entry.id, entry.data.image, siteUrl),
			renderBodyToHtml(entry, siteUrl),
		]);

		return {
			id: url,
			url,
			external_url: entry.data.canonical ?? undefined,
			title: entry.data.title,
			summary: entry.data.description ?? undefined,
			image: heroImageUrl ?? undefined,
			content_html: contentHtml ?? undefined,
			date_published: entry.data.date.toISOString(),
			date_modified: entry.data.updated ? entry.data.updated.toISOString() : undefined,
			authors: [
				{
					name: "Michaël Vanderheyden",
					url: authorUrl,
				},
			],
			tags: entry.data.tags ?? undefined,
		};
	};

	const items = (
		await Promise.all([
			...blogEntries.map((entry) => toItem("blog", entry)),
			...talkEntries.map((entry) => toItem("talks", entry)),
		])
	).sort((a, b) => (b.date_published ?? "").localeCompare(a.date_published ?? ""));

	const feed = {
		version: "https://jsonfeed.org/version/1.1",
		title: "Th3S4mur41.me",
		home_page_url: homePageUrl,
		feed_url: feedUrl,
		description: "Web development, accessibility, performance, CSS, JavaScript, UI/UX and open source insights.",
		authors: [
			{
				name: "Michaël Vanderheyden",
				url: authorUrl,
			},
		],
		language: "en",
		items,
	};

	return new Response(JSON.stringify(feed), {
		headers: {
			"Content-Type": "application/feed+json; charset=utf-8",
		},
	});
}
