# 3. Themes may bundle fonts; the logo is content, not theme

Status: accepted, 2026-09-29

## Context

The `porridge` theme, made for kasha, needs web fonts (a display serif for headings) and kasha needs its own logo. ADR 0002 limits a theme to CSS tokens and keeps the layout shared.

## Decision

- A theme may `@import` self-hosted fonts from `@fontsource-variable/*` packages, which are kit dependencies. Vite bundles the font files into the consuming site, so a page makes no third-party font requests. A theme may set a font on heading selectors (`h1`–`h3`, `.site-title`, `.card .title`); that is still look, not layout.
- The logo is per-project content, so it goes in `site.yaml` (`logo.light`, optional `logo.dark`) and not in a theme. The kit passes it to Starlight's `logo`. Paths are relative to the docs directory, as Starlight resolves them from the project root.
- The favicon needs no kit option: Starlight serves `public/favicon.svg` by default.

## Consequences

- Switching themes still changes only CSS; CI now diffs `default` against both `mono` and `porridge`.
- Font files ship only in builds using `porridge`; other themes do not import them.
