/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		/** Open Graph metadata derived from the current content entry, set by middleware. */
		ogData?: {
			type: "article" | "profile";
			title?: string;
			publishedTime?: Date;
			modifiedTime?: Date;
			author?: string;
			section?: string;
			tags?: string[];
			firstName?: string;
			lastName?: string;
			username?: string;
		};
	}
}
