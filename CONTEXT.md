# docs-kit

Shared kit that gives small OSS projects the same docs structure with swappable designs.

## Glossary

- **Consuming project**: a repository that uses docs-kit for its docs site. It owns `docs/site.yaml` and the hand-written pages; everything else comes from the kit.
- **Content contract**: the rules every consuming project follows: `docs/site.yaml` validated by `schema/site.schema.json`, plus the Diátaxis page tree (getting-started, guides, concepts, reference). The landing page is rendered from `site.yaml` only.
- **Layout**: page structure shared by all consuming projects: landing page, sidebar, page chrome. Lives in the kit; a consuming project never overrides it.
- **Theme**: a CSS file of design tokens (colors, fonts, spacing, radii) selected by `theme:` in `site.yaml`. Changes look only; anything structural is a layout change.
- **Refgen**: the step that generates `reference/` pages from code (CLI `--help` today). Reference pages are generated only, never hand-written, and CI fails when they are stale.
- **Gap report**: output of the `docs-audit` skill: each place a consuming project falls short of the content contract, with severity, evidence, and an action sized for one `docs-write` run.
