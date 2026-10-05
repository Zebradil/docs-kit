# 2. Starlight covers theming and the landing page without overrides

Status: accepted, 2026-09-27

## Context

The design map (#1) assumed, from Starlight docs only, that CSS variables are enough for themes and that the splash template can carry a landing page rendered from `site.yaml`. Checked by building the fixture with astro 7.3.5 and @astrojs/starlight 0.42.4.

## Findings

- **Themes are token-only CSS.** The kit passes `layout.css` (layout tokens shared by all themes) and then `themes/<name>.css` as Starlight `customCss`. Starlight imports custom CSS first and puts its own styles in `@layer starlight.*`, so plain `:root { --sl-color-accent: ... }` rules win without `!important`. The `mono` build's CSS carries `--sl-font: var(--sl-font-system-mono)` and grayscale accents; the `default` build carries the teal accents.
- **Switching themes changes only CSS.** Every built HTML page is byte-identical between the `default` and `mono` builds once the hashed `/_astro/*.css` hrefs are removed. CI asserts this (`fixture` job).
- **Token surface:** colors (`--sl-color-accent*`, the gray scale, white/black), fonts (`--sl-font`, `--sl-font-mono`), text sizes and layout widths. Starlight has no radius or spacing-scale tokens; components hard-code `border-radius`. A theme that needs those is a layout change, per #3.
- **Landing without a consumer `index.mdx`.** The kit injects `/` with `injectRoute`, rendering `<StarlightPage>` with `template: 'splash'` and a `hero` built from `site.yaml`. The page reuses Starlight's `Code` (copy button), `Tabs`, `CardGrid` and `LinkCard`, so themes style it for free. Starlight's `Hero` has no slot: the first install command sits directly under the hero, not inside it. `Hero` and `Card` render `title`/`tagline` with `set:html`, so the kit escapes `site.yaml` strings.
- **One extra consumer file.** Astro only looks for the content collection config in the project's own `src/` (`src/content.config.*`). The kit exports it, so the file is one line: `export { collections } from '@zebradil/starlight-kit/content';`.
- **Sidebar.** Starlight 0.39 removed labelled `autogenerate` groups; the kit uses `{ label, items: [{ autogenerate: { directory } }] }` for guides, concepts and reference, and a `slug` link for `getting-started`. A missing `getting-started` page fails the build. A missing section directory builds, leaving an empty group heading; the docs-audit gap report is the place to catch that.

## Decision

Keep Starlight's stock components and layout; the kit only configures them and adds the landing route. No component overrides.

## Consequences

- Starlight upgrades can rename tokens or components; the fixture build and theme diff in CI catch breakage.
- Feature bodies render only `inline code` from Markdown; anything richer needs a Markdown renderer in `Landing.astro`.
