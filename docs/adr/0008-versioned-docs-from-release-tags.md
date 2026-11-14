# 8. Versioned docs rebuilt from release tags

Status: accepted, 2026-11-14.

## Context

A consuming project publishes one site, built from its default branch. Users pinned to an older release read docs for features they do not have yet. GitHub Pages deploys with `actions/deploy-pages` replace the whole site, so every deploy must carry every version.

Options considered:

- (a) Rebuild each release tag in full (its own lock file, kit, refgen binary). Old toolchains rot; old builds stop working.
- (b) Freeze each release's built `dist` on a branch and copy it into every deploy, like mkdocs' `mike`. Never breaks, but old versions keep the theme and kit they were built with, and the workflow needs `contents: write`.
- (c) Copy pages into versioned folders in the default branch, like the `starlight-versions` plugin. One build, but duplicated pages in the tree, and the kit's sidebar, `llms.txt` and Markdown routes assume one docs tree.
- (c') Rebuild only the content of each release tag with the current kit.

## Decision

(c'), opt-in with `versions:` in `site.yaml`.

- The default branch stays at the site root, so existing links keep working. The newest patch tag `vX.Y.Z` of each of the last `versions.keep` minor versions is served at `<root>/vX.Y/`.
- `docs-kit-versions` (a kit binary) builds each one after the main build: a copy of the docs directory with `src/content/docs` replaced from the tag and `src/assets` and `public/` laid over from it, built with the current lock file and `site.yaml`, with `DOCS_KIT_VERSION=vX.Y`. The copy lives under `.astro/` in the docs directory, so the build finds `node_modules` by walking up; a symlinked `node_modules` breaks Astro's module paths.
- Refgen output is committed (the docs workflow fails a pull request when it is stale), so each tag carries its own CLI reference and no old binary is built.
- The tags are the storage: no branch, no extra permission. Fixing a release's docs after the fact means a patch release.
- `dist/versions.json` lists the default branch first, then the versions that built. A header switcher reads it at runtime, so a release's docs list releases made after it. Release pages carry a banner linking to the root, `noindex`, and no edit link (a tag cannot be edited on GitHub).
- A release that no longer builds with the current kit is skipped with a workflow warning; it must not block the deploy of the default branch.

## Consequences

- Kit or Starlight changes can break old content: frontmatter, MDX imports of renamed components. The kit's CI builds the fixture from the kit's own release tags to catch this; consumers see a warning and the version drops out of the switcher.
- Absolute internal links in old pages (`/<repo>/guides/x/`) point to the default branch's page, not the release's. Relative links stay within the version.
- Each deploy builds `keep + 1` sites.
- Versions are built only when deploying, so a pull request does not show which releases a kit bump breaks.
- Only `vX.Y.Z` tags count; pre-releases and prefixed tags (`name-vX.Y.Z`) are skipped.
- A tag created by a workflow's `GITHUB_TOKEN` triggers no other workflow, so a new release appears with the next deploy unless the release job runs the docs workflow itself.
