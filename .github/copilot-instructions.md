# Copilot Instructions for This Repository

## Commit Messages

- Always use [Conventional Commits](https://www.conventionalcommits.org/) format.
- Format: `type(scope): description`
- Use imperative mood (e.g., "fix bug", not "fixed bug").
- Follow the rules configured in commitlint.config.js
- Include scope when relevant (e.g., api, ui, auth).
- Optionally add a body with details and reference issues with `#<number>` when applicable.

## Web Content

- This application MUST conform to [WCAG 2.2 Level AA](https://www.w3.org/WAI/standards-guidelines/wcag/) requirements.
- For contrast issues, prefer APCA over traditional contrast ratios.
- Ensure all interactive elements are keyboard accessible.
- Use semantic HTML5 elements for structure (e.g., `<header>`, `<nav>`, `<main>`, `<footer>`).
- Provide meaningful alt text for images.
- Ensure forms have associated labels and clear error messages.
- Use ARIA roles and properties only when necessary and ensure they are correctly implemented.
- Prefer modern HTML/CSS features, potentially as progressive enhancements over older JavaScript solutions.

## Markdown Files

- Ensure proper heading hierarchy (e.g., H1 followed by H2, then H3).
- Use fenced code blocks with language identifiers for code snippets.
