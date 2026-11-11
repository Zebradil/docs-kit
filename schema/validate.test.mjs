import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { validateSite } from './validate.mjs';

const load = (path) => parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('example site.yaml is valid', () => {
  assert.deepEqual(validateSite(load('../examples/site.yaml')), []);
});

test('broken site.yaml reports every problem readably', () => {
  assert.deepEqual(validateSite(load('./testdata/broken.yaml')).sort(), [
    "(root) must have required property 'tagline'",
    '/features must NOT have more than 6 items',
    '/theme must be one of: default, mono, porridge, sieve, vortex',
  ]);
});

test('build requires path', () => {
  const site = load('../examples/site.yaml');
  delete site.reference.cli.path;
  assert.deepEqual(validateSite(site), ['/reference/cli must have property path when property build is present']);
});

test('logo paths are relative to the docs directory', () => {
  const site = load('../examples/site.yaml');
  site.logo = { light: './src/assets/logo.svg', dark: 'src/assets/logo-dark.svg' };
  assert.deepEqual(validateSite(site), ['/logo/dark must match pattern "^\\./"']);
});

test('flow arrows are forward, back or both', () => {
  const site = load('../examples/site.yaml');
  site.flow = { steps: [{ from: 'a', to: 'b', label: 'c', arrow: 'up' }] };
  assert.deepEqual(validateSite(site), ['/flow/steps/0/arrow must be one of: forward, back, both']);
});

test('cascade scenarios name only declared backends', () => {
  const site = load('../packages/docs-kit/fixture/site.yaml');
  assert.deepEqual(validateSite(site), []);
  site.cascade.tiers[1].backends.push({ id: 'a', name: 'dup' });
  site.cascade.scenarios[0].states.z = { state: 'hit' };
  assert.deepEqual(validateSite(site), [
    "/cascade/tiers declares backend 'a' more than once",
    "/cascade/scenarios/0/states names unknown backend 'z'",
  ]);
});

test('a tree needs a node with an id, and ids are unique', () => {
  const site = load('../examples/site.yaml');
  site.tree = { root: { name: 'envs/', children: [{ name: 'a/' }] } };
  assert.deepEqual(validateSite(site), ['/tree has no node with an id']);
  site.tree.root.children = [{ name: 'a/', id: 'x' }, { name: 'b/', id: 'x' }];
  assert.deepEqual(validateSite(site), ["/tree declares id 'x' more than once"]);
});

test('illustrations are SVG files relative to the docs directory', () => {
  const site = load('../examples/site.yaml');
  site.art = 'src/assets/hero.png';
  assert.deepEqual(validateSite(site), ['/art must match pattern "^\\./.+\\.svg$"']);
});
