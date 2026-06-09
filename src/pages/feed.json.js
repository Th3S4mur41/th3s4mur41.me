import { getCollection } from "astro:content";
import { getEntryIds, isSeriesContainerId } from "../utils/contentSeries";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";
import { getFeedSummary, getFeedTitle, getHeroImageUrl, renderBodyToHtml } from "../utils/feedHelpers";

const FEED_LIMIT = 50;

export async function GET(context) {
	const siteUrl = context.site ?? new URL(new URL(context.request.url).origin);
	const homePageUrl = new URL("/", siteUrl).href;
	const feedUrl = new URL("/feed.json", siteUrl).href;
	const authorUrl = new URL("/about/", siteUrl).href;
	const authorAvatarUrl = new URL("/michael_vanderheyden.jpg", siteUrl).href;
	const iconUrl = new URL("/icons/favicon-512.png", siteUrl).href;
	const faviconUrl = new URL("/favicon.ico", siteUrl).href;
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();

	const [allBlogEntries, speakingEntries, notesEntries] = await Promise.all([
		getCollection("blog"),
		getCollection("speaking", ({ data }) => isVisibleContent(data, { now, previewFuture })),
		getCollection("notes", ({ data }) => isVisibleContent(data, { now, previewFuture })),
	]);
	const blogEntryIds = getEntryIds(allBlogEntries);
	const blogEntries = allBlogEntries.filter((entry) => isVisibleContent(entry.data, { now, previewFuture }));
	const blogPosts = blogEntries.filter((entry) => !isSeriesContainerId(entry.id, blogEntryIds));

	const toItem = async (section, entry) => {
		const url = new URL(`/${section}/${entry.id}/`, siteUrl).href;
		const [heroImageUrl, contentHtml] = await Promise.all([
			getHeroImageUrl(section, entry.id, entry.data.image, siteUrl),
			renderBodyToHtml(entry, siteUrl),
		]);

		const authors = [
			{
				name: "Michaël Vanderheyden",
				url: authorUrl,
				avatar: authorAvatarUrl,
			},
		];

		if (entry.data.coauthors && entry.data.coauthors.length > 0) {
			authors.push(
				...entry.data.coauthors.map((coauthor) => ({
					name: coauthor.name,
					url: coauthor.url ?? undefined,
				})),
			);
		}

		return {
			id: url,
			url,
			external_url: entry.data.canonical ?? undefined,
			title: getFeedTitle(entry),
			summary: getFeedSummary(entry) || undefined,
			image: heroImageUrl ?? undefined,
			content_html: contentHtml ?? undefined,
			date_published: entry.data.date.toISOString(),
			date_modified: entry.data.updated ? entry.data.updated.toISOString() : undefined,
			authors,
			tags: entry.data.tags ?? undefined,
		};
	};

	const items = (
		await Promise.all([
			...blogPosts.map((entry) => toItem("blog", entry)),
			...speakingEntries.map((entry) => toItem("speaking", entry)),
			...notesEntries.map((entry) => toItem("notes", entry)),
		])
	)
		.sort((a, b) => (b.date_published ?? "").localeCompare(a.date_published ?? ""))
		.slice(0, FEED_LIMIT);

	const feed = {
		version: "https://jsonfeed.org/version/1.1",
		title: "Th3S4mur41.me",
		home_page_url: homePageUrl,
		feed_url: feedUrl,
		description: "Web development, accessibility, performance, CSS, JavaScript, UI/UX and open source insights.",
		icon: iconUrl,
		favicon: faviconUrl,
		authors: [
			{
				name: "Michaël Vanderheyden",
				url: authorUrl,
				avatar: authorAvatarUrl,
			},
		],
		language: "en",
		// Non-standard extension field (JSON Feed "_" prefix convention).
		// Updated on every build so feed readers can detect new deployments.
		_site_build_date: now.toISOString(),
		items,
	};

	return new Response(JSON.stringify(feed), {
		headers: {
			"Content-Type": "application/feed+json; charset=utf-8",
		},
	});
}
