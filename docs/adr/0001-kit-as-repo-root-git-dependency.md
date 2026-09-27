# 1. Ship starlight-kit as the repo-root package, installed as a git dependency

Status: accepted, 2026-09-27

## Context

Consuming projects pin a kit version and Renovate bumps it (design map, #1). The kit needs the schema in `schema/` to validate `site.yaml`. We want no owner secrets and no extra tooling for consumers.

## Options

| Option | Installs | Renovate bumps | Needs owner action |
|---|---|---|---|
| (a) Publish `@zebradil/starlight-kit` to npmjs | yes | yes (npm datasource) | npm account + token or trusted publishing, release workflow |
| (b) GitHub Packages npm registry | only with a token, even for public packages | yes | token in every consumer and CI |
| (c) pnpm git subdirectory: `github:Zebradil/docs-kit#v1.0.0&path:packages/starlight-kit` | pnpm only | **no** | none |
| (d) Repo root is the package, npm git dep: `github:Zebradil/docs-kit#v1.0.0` | npm, pnpm, yarn | yes (github-tags datasource) | push `vX.Y.Z` tags |

(c) is ruled out by Renovate's npm extractor: it splits the value on `#` and treats the ref as a version only when the whole ref is one (`isVersion(depRefPart)`); `v1.0.0&path:...` is not, so the dependency gets `skipReason = 'unversioned-reference'`. Source: [`lib/modules/manager/npm/extract/common/dependency.ts`, lines 157-230 at 44.115.11](https://github.com/renovatebot/renovate/blob/44.115.11/lib/modules/manager/npm/extract/common/dependency.ts#L157-L230). The same code maps `github:owner/repo#vX.Y.Z` to the `github-tags` datasource with npm versioning, which is what (d) relies on.

## Decision

(d). The root `package.json` is `@zebradil/starlight-kit`; `exports` points at `packages/starlight-kit/`, and `files` ships only the kit and `schema/site.schema.json` + `schema/validate.mjs`, so the kit imports the validator by relative path with no copy step. `astro`, `@astrojs/starlight`, `ajv` and `yaml` are regular dependencies: a consumer declares one dependency and gets the `astro` binary through npm's hoisting.

A consumer's `docs/package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": { "build": "astro build" },
  "dependencies": { "@zebradil/starlight-kit": "github:Zebradil/docs-kit#v0.1.0" }
}
```

Releasing is pushing a `vX.Y.Z` tag. `version` in `package.json` is not used.

## Verified

- npm 11.19 (Node 24) installs `github:Zebradil/docs-kit#<commit>` into a scratch consumer, links `node_modules/.bin/astro`, and `npm run build` builds the site with the right base (`/kasha/`).
- `npm ci` of that consumer works with SSH disabled and a cold cache (fetches the codeload tarball over HTTPS).
- npm resolves a tag ref (`github:sindresorhus/is#v7.0.0`) over HTTPS with SSH disabled and global git config ignored. npm tries HTTPS first and SSH only as a fallback; the lock file records a `git+ssh://` URL regardless, which does not matter for public repos.
- Renovate: from source, as cited above.

## Not verified

- A real Renovate run bumping a consumer, including its lock file update. Checked in the kasha pilot (#10).
- Installing a `vX.Y.Z` tag of this repo: no tag exists yet. Same code path as the commit and third-party tag installs above.
- pnpm with (c): not tried, since Renovate cannot bump it.

## Consequences

- Owner step: push a `v0.1.0` tag when this lands so consumers have something to pin.
- The whole repo is the package: new root `dependencies` reach every consumer. Keep tooling for other parts of the repo (refgen, skills) out of root `dependencies`.
- npm 11 warns that `esbuild`'s install script is not in `allowScripts`. The build works without it (esbuild ships its binary as an optional platform package).
- Moving to (a) later is cheap: drop `private`, add a publish workflow, consumers switch the spec to a semver range.
