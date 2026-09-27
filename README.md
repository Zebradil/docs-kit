# docs-kit

Shared kit for generating browsable documentation and a landing page for small OSS projects.

- One content contract (`docs/site.yaml` + Diátaxis page tree) across all projects.
- One layout, swappable designs (theme = CSS tokens).
- Reference pages generated from code (CLI `--help`, config schema), never handwritten.
- Reusable GitHub Actions workflow: generate, build, deploy to GitHub Pages.
- Agent skills (Claude Code plugin): `docs-audit`, `docs-bootstrap`, `docs-write`.

## Content contract

Every consuming project has a `docs/site.yaml` validated by [`schema/site.schema.json`](schema/site.schema.json); see [`examples/site.yaml`](examples/site.yaml). Validate one locally:

```sh
npm ci
node schema/validate.mjs path/to/docs/site.yaml
```

Terms used across the kit are defined in [`CONTEXT.md`](CONTEXT.md).

Status: design phase. See the design map issue and its sub-issues.
