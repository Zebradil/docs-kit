import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import docsKit from './index.mjs';

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
