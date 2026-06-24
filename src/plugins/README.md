# Plugins

This folder contains the custom [Satteri plugins](https://satteri.bruits.org/docs/plugins/) used by the site.

The plugins are split between two phases:

- MDAST plugins run on Markdown before it becomes HTML.
- HAST plugins run on the generated HTML tree.

## Usage

Import the plugin creators from `src/plugins/index.js` and pass them into the Satteri processor in `astro.config.mjs`.

```js
import { satteri } from "@astrojs/markdown-satteri";
import {
  createSatteriExternalLinksPlugin,
  createSatteriGithubAlertsA11yPlugin,
  createSatteriHeadingDatesPlugin,
  createSatteriInjectTocPlugin,
  createSatteriOptimizeFirstImagePlugin,
  createSatteriReadingTimePlugin,
  createSatteriViewTransitionNamesPlugin,
} from "./src/plugins/index.js";

const processor = satteri({
  mdastPlugins: [createSatteriReadingTimePlugin()],
  hastPlugins: [
    createSatteriHeadingDatesPlugin,
    createSatteriInjectTocPlugin,
    createSatteriViewTransitionNamesPlugin,
    createSatteriGithubAlertsA11yPlugin,
    createSatteriOptimizeFirstImagePlugin,
    createSatteriExternalLinksPlugin,
  ],
});
```

## Plugins

### `createSatteriReadingTimePlugin`

- Phase: MDAST
- Purpose: calculates reading-time data from the markdown content.
- Output: stores the result on `ctx.data.readingTime` for later plugins.
- Use when: you need reading-time metadata for blog posts and listings.

### `createSatteriInjectTocPlugin`

- Phase: HAST
- Purpose: inserts the reading-time line and a table of contents after the first `h1`.
- Output: injects a `p.reading-meta` element and a `nav.table-of-contents` element.
- Use when: you want blog posts to show a TOC and reading-time summary.
- Notes: expects the reading-time plugin to run before it.

### `createSatteriHeadingDatesPlugin`

- Phase: HAST
- Purpose: turns ISO date strings in headings into semantic `time` elements.
- Output: preserves the original heading while improving readability and machine parsing.
- Use when: headings include dates such as `2026-04-22`.

### `createSatteriViewTransitionNamesPlugin`

- Phase: HAST
- Purpose: adds unique `view-transition-name` styles to article titles and hero images.
- Output: improves page transition consistency between article pages.
- Use when: the site uses view transitions for article navigation.

### `createSatteriGithubAlertsA11yPlugin`

- Phase: HAST
- Purpose: converts GitHub-style alert blockquotes into accessible alert markup.
- Output: renders alerts as `aside` elements with GitHub-style alert classes and an `aria-label`.
- Use when: content includes `> [!NOTE]`, `> [!WARNING]`, and similar alert syntax.

### `createSatteriOptimizeFirstImagePlugin`

- Phase: HAST
- Purpose: marks the first image in a post as eager and high priority.
- Output: adds `loading="eager"` and `fetchpriority="high"` to the first relevant image.
- Use when: you want better LCP for post hero images.

### `createSatteriExternalLinksPlugin`

- Phase: HAST
- Purpose: decorates external links and downloadable links.
- Output: adds `target="_blank"` and `rel="external noopener"` to external links and `download` to supported file links.
- Use when: you want external links to behave consistently and safely.

## Ordering

Keep `createSatteriReadingTimePlugin` in `mdastPlugins` before any HAST plugin that depends on `ctx.data.readingTime`.

The current HAST order is intentional:

1. Heading date formatting
2. TOC and reading-meta injection
3. View transition naming
4. GitHub alert conversion
5. First-image optimization
6. External link decoration

## Notes

- Plugin creators are named exports.
- The `index.js` file is the public import surface for this folder.
- Keep plugin-specific behavior documented close to the implementation so the config stays easy to audit.
