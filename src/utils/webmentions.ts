/**
 * Utility for fetching and processing webmentions from webmention.io
 */

export interface WebmentionAuthor {
	name?: string;
	photo?: string;
	url?: string;
}

export interface Webmention {
	type: string;
	author: WebmentionAuthor;
	url?: string;
	published?: string;
	"wm-received"?: string;
	"wm-id"?: number;
	"wm-source"?: string;
	"wm-target"?: string;
	"wm-property"?: string;
	content?: {
		text?: string;
		html?: string;
	};
}

export interface WebmentionStats {
	likes: number;
	reposts: number;
	replies: number;
	mentions: number;
}

export interface ProcessedWebmentions {
	likes: Webmention[];
	reposts: Webmention[];
	replies: Webmention[];
	mentions: Webmention[];
	stats: WebmentionStats;
}

/**
 * Fetch webmentions for a given URL from webmention.io
 * @param targetUrl The URL to fetch webmentions for
 * @param token The webmention.io API token (optional, but recommended for private mentions)
 * @returns Array of webmentions or null if fetch fails
 */
export async function fetchWebmentions(targetUrl: string, token?: string): Promise<Webmention[] | null> {
	try {
		const url = new URL("https://webmention.io/api/mentions.jf2");
		url.searchParams.set("target", targetUrl);
		url.searchParams.set("per-page", "1000"); // Get all mentions

		if (token) {
			url.searchParams.set("token", token);
		}

		const response = await fetch(url.toString());

		if (!response.ok) {
			console.warn(`Failed to fetch webmentions for ${targetUrl}: ${response.status}`);
			return null;
		}

		const data = await response.json();
		return Array.isArray(data?.children) ? data.children : [];
	} catch (error) {
		console.error(`Error fetching webmentions for ${targetUrl}:`, error);
		return null;
	}
}

/**
 * Process webmentions and group them by type
 * @param mentions Array of webmentions
 * @returns Processed webmentions grouped by type with stats
 */
export function processWebmentions(mentions: Webmention[]): ProcessedWebmentions {
	const likes: Webmention[] = [];
	const reposts: Webmention[] = [];
	const replies: Webmention[] = [];
	const mentionsOnly: Webmention[] = [];

	for (const mention of mentions) {
		const type = mention["wm-property"] || mention.type;

		switch (type) {
			case "like-of":
				likes.push(mention);
				break;
			case "repost-of":
			case "retweet-of":
				reposts.push(mention);
				break;
			case "in-reply-to":
				replies.push(mention);
				break;
			case "mention-of":
			case "bookmark-of":
				mentionsOnly.push(mention);
				break;
		}
	}

	return {
		likes,
		reposts,
		replies,
		mentions: mentionsOnly,
		stats: {
			likes: likes.length,
			reposts: reposts.length,
			replies: replies.length,
			mentions: mentionsOnly.length,
		},
	};
}

/**
 * Get the top N actors from a list of webmentions
 * @param mentions Array of webmentions
 * @param limit Maximum number of actors to return (default: 10)
 * @returns Array of unique authors
 */
export function getTopActors(mentions: Webmention[], limit = 10): WebmentionAuthor[] {
	const seen = new Set<string>();
	const actors: WebmentionAuthor[] = [];

	for (const mention of mentions) {
		if (actors.length >= limit) break;

		const author = mention.author;
		if (!author?.photo) continue;

		// Use photo URL as unique identifier
		const key = author.photo;
		if (seen.has(key)) continue;

		seen.add(key);
		actors.push(author);
	}

	return actors;
}
