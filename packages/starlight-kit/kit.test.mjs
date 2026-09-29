import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
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

test('rejects an invalid site.yaml with readable errors', () => {
  assert.throws(() => docsKit({ site: path('../../schema/testdata/broken.yaml') }), /must be one of: default, mono, porridge/);
});
