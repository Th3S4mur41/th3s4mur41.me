# th3s4mur41.me

![Package version](https://img.shields.io/github/package-json/v/Th3S4mur41/th3s4mur41.me)
![GitHub last commit](https://img.shields.io/github/last-commit/Th3S4mur41/th3s4mur41.me)

![CI](https://github.com/Th3S4mur41/th3s4mur41.me/actions/workflows/checks.yml/badge.svg?branch=main)
![Deployment](https://github.com/Th3S4mur41/th3s4mur41.me/actions/workflows/release.yml/badge.svg?branch=main)

This repository hosts the code which powers the https://th3s4mur41.me website.

## 📜 Scripts

| Script                                      | Description                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm start`                                 | Start the Astro dev server.                                                              |
| `npm run start:prod`                        | Preview the production build locally.                                                    |
| `npm run build`                             | Build the site into `dist/`.                                                             |
| `npm run lint`                              | Check formatting (Prettier) and lint (Biome).                                            |
| `npm run lint:fix`                          | Apply formatting/lint fixes.                                                             |
| `npm test`                                  | Run unit tests (Vitest).                                                                 |
| `npm run test:visual`                       | Run Playwright visual regression tests against `dist/` (requires `npm run build` first). |
| `npm run test:visual:update`                | Update the visual regression baselines.                                                  |
| `npm run sync:atproto` / `sync:atproto:dry` | Sync posts to Bluesky/ATProto.                                                           |

> [!IMPORTANT]
> Visual regression baselines (`tests/visual/__screenshots__/`) are rendered by Playwright and differ slightly between operating systems (font rasterization, anti-aliasing). Always generate/update snapshots on Linux — either in [GitHub Codespaces](https://github.com/features/codespaces), the devcontainer, or CI — so they match the Linux runners used by the `test:visual` workflow. Snapshots produced on macOS or Windows will cause false-positive diffs in CI.

## ♿ Accessibility Testing

This repository includes automated accessibility testing using GitHub Actions. The testing runs automatically after deployments and can also be triggered manually.

**Features:**

- 🔍 Automatic sitemap-based URL discovery
- 🤖 AI-powered accessibility analysis with GitHub's scanner
- 📝 Automated issue creation and PR comments
- 🎯 WCAG 2.1 AA compliance testing

## Assets & Design

Assets and design belong to [Th3S4mur41](https://github.com/Th3S4mur41/)

## Licence

This Source Code Form is subject to the terms of the MIT Public License.
The source code and assets are owned by [Th3S4mur41](https://github.com/Th3S4mur41/)
