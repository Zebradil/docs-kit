# 4. The kit owns its landing layout

Status: accepted, 2026-10-04

## Context

ADR 0002 rendered the landing page from Starlight's stock components only: hero, `Code`, `Tabs`, `CardGrid`. kasha's design asked for a two-column hero with a diagram, a label above the title, numbered feature cards and a components list. A theme cannot add any of that, since themes change look only.

## Decision

- `Landing.astro` keeps Starlight's `hero` (title, actions, `PAGE_TITLE_ID`), but the kit lays it out with landing-only global CSS (`:root:has(.kit-landing)`). The eyebrow rides in the tagline slot and CSS moves it above the title. The flow panel is the hero's `image.html`, as the hero takes no other slot.
- Below the hero, the kit renders its own markup: one tabbed install block, numbered feature cards, an optional components section, links. Colors and fonts come only from Starlight tokens and `--kit-font-display`, so every theme styles it.
- New optional `site.yaml` fields: `headline`, `eyebrow`, `description`, `flow`, `components`. A project that sets none still gets the new layout, with the name as the title and the tagline as the lede.

## Consequences

- Every consuming project's landing page changes on upgrade.
- Hero tweaks depend on Starlight's `.hero`, `.tagline` and `.hero-html` class names. A Starlight upgrade that renames them breaks the layout without failing the build. Check the fixture's landing page after each Starlight bump.
- Switching themes still changes only CSS; CI keeps checking that.
