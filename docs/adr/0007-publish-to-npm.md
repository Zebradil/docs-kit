# 7. Publish the kit to npm as @zebradil/docs-kit

Status: accepted, 2026-11-11. Supersedes [ADR 0001](0001-kit-as-repo-root-git-dependency.md).

## Context

ADR 0001 shipped the kit as a git dependency, `github:Zebradil/docs-kit#vX.Y.Z`. Renovate's hosted runner refuses git dependencies (`npm error code EALLOWGIT`, `Fetching packages of type "git" have been disabled`), so a kit bump updates `docs/package.json` but not `package-lock.json`, and `npm ci` then fails in the consumer (mykso/myks#1010). Every bump needed a hand-made lock file commit.

## Decision

Publish the repository root to npmjs as `@zebradil/docs-kit`, option (a) of ADR 0001. The package keeps the repo's name, so the npm package, the repository, the reusable workflow and the Claude Code plugin share one name; the source directory follows as `packages/docs-kit/`.

- release-please's workflow (`.github/workflows/release-please.yml`) publishes each release from its tag through npm trusted publishing: GitHub OIDC, no token in the repository. npm attaches provenance on its own.
- The publish step skips a version already on npm, so a failed run can be rerun.
- Consumers pin an exact version, `"@zebradil/docs-kit": "X.Y.Z"`, next to `uses: Zebradil/docs-kit/.github/workflows/docs.yml@vX.Y.Z`. One Renovate rule groups both names, `@zebradil/docs-kit` (npm datasource) and `Zebradil/docs-kit` (github-tags).

## Owner steps

1. First publish: `npm publish` from the first release tag, logged in to npmjs as an owner of the `@zebradil` scope. Trusted publishing is configured in the package's settings, so the package has to exist first (not verified: npm's docs do not say).
2. On npmjs.com, package settings, Trusted Publisher: GitHub Actions, `Zebradil` / `docs-kit`, workflow `release-please.yml`, no environment.
3. Then under Publishing access: require two-factor authentication and disallow tokens.

## Consequences

- Each consumer migrates once by hand: the dependency spec, the two imports (`astro.config.mjs`, `src/content.config.mjs`), the `$schema` path in `site.yaml`, and the Renovate group rule. Renovate does not switch a git dependency to a registry package.
- The tag exists a minute before the npm version. A Renovate run in between can open the group PR with only the workflow bump; the next run adds the package.
- Versions before 0.10.0 exist only as git tags.
