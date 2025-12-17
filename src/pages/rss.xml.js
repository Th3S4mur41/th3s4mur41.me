import { getCollection } from "astro:content";
import rss from "@astrojs/rss";

export async function GET(context) {
	const now = Date.now();
	const site = context.site ?? new URL("https://th3s4mur41.me");

	const [blogEntries, talkEntries] = await Promise.all([
		getCollection("blog", ({ data }) => data.published === true && data.date.valueOf() <= now),
		getCollection("talks", ({ data }) => data.published === true && data.date.valueOf() <= now),
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
