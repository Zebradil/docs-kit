# docs-kit

Shared kit for generating browsable documentation and a landing page for small OSS projects.

- One content contract (`docs/site.yaml` + Diátaxis page tree) across all projects.
- One layout, swappable designs (theme = CSS tokens).
- Reference pages generated from code (CLI `--help`, config schema), never handwritten.
- Reusable GitHub Actions workflow: generate, build, deploy to GitHub Pages.
- Agent skills (Claude Code plugin): [`docs-audit`](skills/docs-audit/SKILL.md), [`docs-bootstrap`](skills/docs-bootstrap/SKILL.md), [`docs-write`](skills/docs-write/SKILL.md).

## Claude Code plugin

This repository is a Claude Code plugin marketplace with one plugin, `docs-kit`, holding the three skills. In a Claude Code session:

```text
/plugin marketplace add Zebradil/docs-kit
/plugin install docs-kit@docs-kit
```

The shell equivalents are `claude plugin marketplace add Zebradil/docs-kit` and `claude plugin install docs-kit@docs-kit`. The skills run as `/docs-kit:docs-audit` and so on, or when a request matches their description.

Recommended flow in a consuming project:

1. `docs-audit` writes the gap report `docs/.audit.md`; it never edits docs.
2. Review the report: reorder, drop, or fix gaps before any prose lands.
3. `docs-bootstrap` sets up `docs/`, `site.yaml`, the workflow, and Renovate, then opens a PR.
4. `docs-write` closes one gap per run with one PR. Repeat, re-auditing when the code moves.

The plugin carries no `version`, so its version is the commit it was installed from. Third-party marketplaces do not auto-update by default; pull the latest `main` with `claude plugin marketplace update docs-kit && claude plugin update docs-kit@docs-kit`.

## Content contract

Every consuming project has a `docs/site.yaml` validated by [`schema/site.schema.json`](schema/site.schema.json); see [`examples/site.yaml`](examples/site.yaml). Validate one locally:

```sh
npm ci
node schema/validate.mjs path/to/docs/site.yaml
```

## Using the kit

The repository root is the npm package [`@zebradil/docs-kit`](https://www.npmjs.com/package/@zebradil/docs-kit), published from each release tag ([ADR 0007](docs/adr/0007-publish-to-npm.md)). A consuming project's `docs/` needs three files besides `site.yaml` and its pages under `src/content/docs/`:

<!-- x-release-please-start-version -->
```jsonc
// package.json
{ "private": true, "type": "module", "dependencies": { "@zebradil/docs-kit": "0.10.0" } }
```
<!-- x-release-please-end -->

```js
// astro.config.mjs
import docsKit from '@zebradil/docs-kit';

export default docsKit({ site: 'site.yaml' });
```

```js
// src/content.config.mjs
export { collections } from '@zebradil/docs-kit/content';
```

Build with `npm ci && npx astro build` from `docs/`. The site is served at `https://<owner>.github.io/<repo>/`, derived from `repo:` in `site.yaml`; with `domain:` set, it is served at `https://<domain>/`. [`packages/docs-kit/fixture/`](packages/docs-kit/fixture/) is a complete example.

To count visitors, set `analytics:` in `site.yaml`; the script is loaded on every page with the given `data-*` attributes:

```yaml
analytics:
  script: https://stats.example.dev/app.js
  attributes:
    data-website-id: 00000000-0000-0000-0000-000000000000
```

For coding agents and LLMs, every site serves [`/llms.txt`](https://llmstxt.org), an index of all pages, and `/llms-full.txt`, all pages in one file. Each page's Markdown source is also served at its URL with `.md` appended (`/guides/configure/` → `/guides/configure.md`), with relative links made absolute. GitHub Pages cannot vary a response on the `Accept` header, so the `.md` URLs are the only Markdown route.

### Publishing with GitHub Actions

[`.github/workflows/docs.yml`](.github/workflows/docs.yml) is a reusable workflow. A consuming project calls it from `.github/workflows/docs.yml`, pinned to the same tag as the kit in `docs/package.json`:

<!-- x-release-please-start-version -->
```yaml
name: docs
on:
  push: { branches: [main] }
  pull_request:
permissions: { contents: read, pages: write, id-token: write }
jobs:
  docs:
    uses: Zebradil/docs-kit/.github/workflows/docs.yml@v0.10.0
```
<!-- x-release-please-end -->

Keep `uses:` on its own indented line: Renovate's github-actions manager finds refs line by line and misses one inside a flow mapping.

The caller must grant `pages: write` and `id-token: write`: a called workflow can only narrow the caller's token permissions, never widen them, and the deploy job needs both.

On every run it installs `docs/` with `npm ci`, builds the CLI with `reference.cli.build` (run from the repository root) when set, regenerates the CLI reference with `help2md` into `docs/src/content/docs/reference/cli`, and builds the site with `npx astro build` (which validates `site.yaml`). On a pull request it fails if the regenerated reference differs from the committed one and prints the diff. On a push to the default branch it deploys `docs/dist` to GitHub Pages.

Inputs, all optional:

| Input | Default | Use |
|---|---|---|
| `directory` | `docs` | Docs directory, relative to the repository root. |
| `nix` | `false` | Install Nix first, for `build: nix build` and friends. |
| `deploy` | `true` | Deploy on pushes to the default branch. |

Runs on `ubuntu-latest`, which already has Rust (cargo, rustup) and Go (default version linked into `/usr/bin`; a newer `go` line in `go.mod` makes Go download that toolchain itself); see the [runner image tool list](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).

One manual step per repository, by its owner: enable Pages with GitHub Actions as the source, in Settings → Pages → Build and deployment → Source: GitHub Actions, or:

```sh
gh api --method POST repos/<owner>/<repo>/pages -f build_type=workflow
```

Until then the deploy job fails. This repository builds [the fixture](packages/docs-kit/fixture/) through the workflow ([`pages.yml`](.github/workflows/pages.yml)) and deploys it only when the repository variable `PAGES_ENABLED` is `true`; set it after enabling Pages (`gh variable set PAGES_ENABLED --body true`).

Terms used across the kit are defined in [`CONTEXT.md`](CONTEXT.md).

Status: pre-release. Kit, workflow and skills are in place; no `v*` tag yet, first pilot pending. See the design map issue (#1).

## refgen/help2md

Generates CLI reference pages from `--help` output (clap and cobra), one Starlight page per command:

```sh
node refgen/help2md.mjs --bin target/release/kasha --out docs/src/content/docs/reference/cli
```

The kit ships it as the `help2md` binary, so a consuming project runs the version it pins, from `docs/`:

```sh
npx --no-install help2md --bin ../target/release/kasha --out src/content/docs/reference/cli
```

`--no-install` matters: without it, a missing kit makes `npx` fetch an unrelated `help2md` package from the npm registry.

Pages are named after the command path (`kasha.md`, `kasha-config-set.md`). `help` and cobra's default `completion` are skipped. Tests: `node --test`.
