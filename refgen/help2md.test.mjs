// Run: node --test (from the repo root)
// testdata/bin/* replay the captured help in testdata/help, so no cargo or go is needed here.
// Fixture CLI changed? Run testdata/regen.sh (needs cargo and go) and review the golden diff.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const dir = import.meta.dirname;
const golden = join(dir, 'testdata/golden');

const run = (out) => {
  // A page for a command that no longer exists must be removed.
  writeFileSync(join(out, 'clapdemo-removed.md'), 'stale');
  for (const bin of ['clapdemo', 'cobrademo']) {
    execFileSync('node', [join(dir, 'help2md.mjs'), '--bin', join(dir, 'testdata/bin', bin), '--out', out]);
  }
  return Object.fromEntries(readdirSync(out).sort().map((f) => [f, readFileSync(join(out, f), 'utf8')]));
};

test('clap and cobra help produce the golden pages, byte-identical across runs', () => {
  const first = run(mkdtempSync(join(tmpdir(), 'help2md-')));
  const second = run(mkdtempSync(join(tmpdir(), 'help2md-')));
  const expected = Object.fromEntries(
    readdirSync(golden).sort().map((f) => [f, readFileSync(join(golden, f), 'utf8')]),
  );
  assert.deepEqual(first, expected);
  assert.deepEqual(second, first);
});
