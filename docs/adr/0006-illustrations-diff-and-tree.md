# 6. Illustrations are content; diff and tree sections; the vortex theme

Status: accepted, 2026-11-05

## Context

myks, the second consuming project (#11), redesigned its brand: a vortex mark, a coral, amber and violet palette, and Outfit for headings. Its landing page needed an animated mark in the hero, a picture of sources flowing into the tool, a pull-request diff per cluster, and its environment inheritance tree. ADR 0004 keeps the layout in the kit; ADR 0003 already treats the logo as per-project content.

## Decision

- Illustrations are per-project content, like the logo. `art` (hero) and `flow.art` (flow panel) name SVG files in the docs directory. The kit inlines them, so an illustration's own `<style>` can animate it, honour `prefers-reduced-motion`, follow the color scheme with `:root[data-theme='light']`, and use Starlight's tokens. Illustrations are hidden from screen readers; the flow rows stay in the page as their text.
- With `art` set, the hero's image slot holds it and the flow panel opens a section below the hero.
- New optional data-driven sections, laid out by the kit: `diff` (a change beside one tab of diffs per target) and `tree` (an inheritance tree, one tab per node with an `id`, numbering the nodes it inherits from). Diffs are unified-diff text; the kit turns the `+`/`-` column into Expressive Code line markers, since Expressive Code's `diff` language leaves a diff with hunk headers unmarked.
- New theme `vortex`: plum-tinted neutrals, coral accent, Outfit SemiBold headings over the system sans. Every text and background pair Starlight and the landing page use meets WCAG AA in both schemes, so the light accent is a deeper coral than the brand's.

## Consequences

- An illustration can only use what a theme defines or hard-code its own colors; a project that switches themes may need to redraw it.
- The fixture sets `art`, so it no longer shows the flow panel in the hero; kasha still does.
- Switching themes still changes only CSS; CI's theme diff covers `vortex`.
