# 5. Cascade panel and the sieve theme

Status: accepted, 2026-10-05

## Context

sito routes each request through ordered tiers of upstream caches. Its design asked for a landing panel showing one request falling through those tiers, in a few scenarios (at home, away, only upstream), plus its own theme. The `flow` panel draws pairwise connections, which cannot show an ordered fall-through or per-scenario state.

## Decision

- New optional `site.yaml` field `cascade`: a request, an optional hub row, ordered `tiers` of `backends`, and `scenarios`, each mapping backend ids to `hit`, `miss`, `down` or `idle`. The kit renders it below the install block, one Starlight tab per scenario. The validator rejects scenario states naming undeclared backends.
- Panel colors come from Starlight tokens: accent for `hit`, `--sl-color-orange*` for `down`, grays otherwise, so every theme styles it.
- New theme `sieve`: graphite neutrals, signal-green accent, amber orange tokens, Schibsted Grotesk over IBM Plex Mono, self-hosted through `@fontsource` as ADR 0003 allows.

## Consequences

- A project without `cascade` renders as before.
- CI's theme diff covers `sieve` too.
