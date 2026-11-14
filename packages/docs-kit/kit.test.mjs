import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import docsKit from './index.mjs';
import { minorVersions, selectVersions } from './versions.mjs';

const path = (p) => fileURLToPath(new URL(p, import.meta.url));

test('schema theme enum matches the shipped theme files', () => {
  const schema = JSON.parse(readFileSync(path('../../schema/site.schema.json'), 'utf8'));
  const themes = readdirSync(path('themes')).map((f) => f.replace(/\.css$/, ''));
  assert.deepEqual(themes.sort(), schema.properties.theme.enum.sort());
});

test('serves the site at <owner>.github.io/<repo>', () => {
  const config = docsKit({ site: path('../../examples/site.yaml') });
  assert.equal(config.site, 'https://zebradil.github.io');
  assert.equal(config.base, '/kasha');
});

test('serves the site at the root of a custom domain', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-kit-'));
  const site = join(dir, 'site.yaml');
  writeFileSync(site, `${readFileSync(path('../../examples/site.yaml'), 'utf8')}\ndomain: kasha.dev\n`);
  const config = docsKit({ site });
  assert.equal(config.site, 'https://kasha.dev');
  assert.equal(config.base, '/');
});

test('accepts analytics with data-* attributes only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-kit-'));
  const site = join(dir, 'site.yaml');
  const withAttribute = (attr) =>
    `${readFileSync(path('../../examples/site.yaml'), 'utf8')}\nanalytics:\n  script: https://stats.example.dev/app.js\n  attributes:\n    ${attr}\n`;
  writeFileSync(site, withAttribute('data-website-id: abc'));
  assert.doesNotThrow(() => docsKit({ site }));
  writeFileSync(site, withAttribute('onload: alert(1)'));
  assert.throws(() => docsKit({ site }), /\/analytics\/attributes/);
});

test('rejects an invalid site.yaml with readable errors', () => {
  assert.throws(() => docsKit({ site: path('../../schema/testdata/broken.yaml') }), /must be one of: default, mono, porridge/);
});

test('serves a release version below the site root', (t) => {
  t.after(() => delete process.env.DOCS_KIT_VERSION);
  process.env.DOCS_KIT_VERSION = 'v1.2';
  const config = docsKit({ site: path('../../examples/site.yaml') });
  assert.equal(config.base, '/kasha/v1.2');
  process.env.DOCS_KIT_VERSION = '../x';
  assert.throws(() => docsKit({ site: path('../../examples/site.yaml') }), /not a path segment/);
});

test('picks the newest patch of each minor version, newest minor first', () => {
  const tags = ['v1.2.0', 'v1.10.0', 'v1.2.3', 'v1.2.10', 'v2.0.0-rc.1', 'v0.9.1', 'docs-v3.0.0', 'v1.10.1', ''];
  assert.deepEqual(minorVersions(tags), [
    { name: 'v1.10', tag: 'v1.10.1', line: '1' },
    { name: 'v1.2', tag: 'v1.2.10', line: '1' },
    { name: 'v0.9', tag: 'v0.9.1', line: '0.9' },
  ]);
});

test('selects the newest minors, the newest minor of each newest major, and pinned ones', () => {
  const tags = ['v3.0.0', 'v2.5.0', 'v2.4.0', 'v2.3.0', 'v1.9.0', 'v1.8.0', 'v0.4.0', 'v0.3.0'];
  const names = (options) => selectVersions(minorVersions(tags), options).map((v) => v.name);
  assert.deepEqual(names({ majors: 3, minors: 3 }), ['v3.0', 'v2.5', 'v2.4', 'v1.9']);
  assert.deepEqual(names({ majors: 0, minors: 1, pin: ['v1.8', 'v9.9'] }), ['v3.0', 'v1.8']);
  // Below 1.0 each minor is its own release line.
  assert.deepEqual(names({ majors: 5, minors: 0 }), ['v3.0', 'v2.5', 'v1.9', 'v0.4', 'v0.3']);
  assert.deepEqual(names({}), ['v3.0', 'v2.5', 'v2.4', 'v1.9']);
});
