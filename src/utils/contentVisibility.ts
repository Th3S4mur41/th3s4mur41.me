export type PublishableDated = {
	published?: boolean;
	date: Date;
};

function envFlag(name: string): boolean {
	const raw = process.env[name];
	if (!raw) return false;
	return raw === "1" || raw.toLowerCase() === "true" || raw.toLowerCase() === "yes";
}

/**
 * When enabled at build-time, content dated in the future is treated as visible.
 * Content with `published: false` remains excluded.
 */
export function isPreviewFutureContentEnabled(): boolean {
	return envFlag("PREVIEW_FUTURE_CONTENT");
}

export function isVisibleContent(
	data: PublishableDated,
	options?: {
		now?: Date;
		previewFuture?: boolean;
	},
): boolean {
	if (data.published !== true) return false;
	const now = options?.now ?? new Date();
	const previewFuture = options?.previewFuture ?? isPreviewFutureContentEnabled();
	return previewFuture ? true : data.date.valueOf() <= now.valueOf();
}
