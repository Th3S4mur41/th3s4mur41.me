import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { isPreviewFutureContentEnabled, isVisibleContent } from "../utils/contentVisibility";

export async function GET(context) {
	const now = new Date();
	const previewFuture = isPreviewFutureContentEnabled();
	const site = context.site ?? new URL(new URL(context.request.url).origin);

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
			description: entry.data.description ?? "",
			pubDate: entry.data.date,
			link: `/${section}/${entry.id}/`,
			categories: entry.data.tags ?? [],
		}));

	return rss({
		title: "Th3S4mur41.me",
		description: "Web development, accessibility, performance, CSS, JavaScript, UI/UX and open source insights.",
		site,
		items,
	});
}
