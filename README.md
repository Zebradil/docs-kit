# docs-kit

Shared kit for generating browsable documentation and a landing page for small OSS projects.

- One content contract (`docs/site.yaml` + Diátaxis page tree) across all projects.
- One layout, swappable designs (theme = CSS tokens).
- Reference pages generated from code (CLI `--help`, config schema), never handwritten.
- Reusable GitHub Actions workflow: generate, build, deploy to GitHub Pages.
- Agent skills (Claude Code plugin): [`docs-audit`](skills/docs-audit/SKILL.md), `docs-bootstrap`, [`docs-write`](skills/docs-write/SKILL.md).

## Content contract

Every consuming project has a `docs/site.yaml` validated by [`schema/site.schema.json`](schema/site.schema.json); see [`examples/site.yaml`](examples/site.yaml). Validate one locally:

```sh
npm ci
node schema/validate.mjs path/to/docs/site.yaml
```

## Using the kit

The repository root is the npm package `@zebradil/starlight-kit`, installed as a git dependency pinned to a tag ([ADR 0001](docs/adr/0001-kit-as-repo-root-git-dependency.md)). A consuming project's `docs/` needs three files besides `site.yaml` and its pages under `src/content/docs/`:

```jsonc
// package.json
{ "private": true, "type": "module", "dependencies": { "@zebradil/starlight-kit": "github:Zebradil/docs-kit#v0.1.0" } }
```

```js
// astro.config.mjs
import docsKit from '@zebradil/starlight-kit';

export default docsKit({ site: 'site.yaml' });
```

```js
// src/content.config.mjs
export { collections } from '@zebradil/starlight-kit/content';
```

Build with `npm ci && npx astro build` from `docs/`. The site is served at `https://<owner>.github.io/<repo>/`, derived from `repo:` in `site.yaml`. [`packages/starlight-kit/fixture/`](packages/starlight-kit/fixture/) is a complete example.

Terms used across the kit are defined in [`CONTEXT.md`](CONTEXT.md).

Status: design phase. See the design map issue and its sub-issues.

## refgen/help2md

Generates CLI reference pages from `--help` output (clap and cobra), one Starlight page per command:

```sh
node refgen/help2md.mjs --bin target/release/kasha --out docs/src/content/docs/reference/cli
```

Pages are named after the command path (`kasha.md`, `kasha-config-set.md`). `help` and cobra's default `completion` are skipped. Tests: `node --test`.
