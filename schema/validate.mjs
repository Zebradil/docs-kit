#!/usr/bin/env node
// Validates site.yaml files against the content contract.
// Usage: node schema/validate.mjs <site.yaml>...
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse } from 'yaml';

const schema = JSON.parse(readFileSync(new URL('./site.schema.json', import.meta.url), 'utf8'));
const check = new Ajv2020({ allErrors: true }).compile(schema);

/** Returns a list of human-readable errors; empty when the site config is valid. */
export function validateSite(site) {
  if (check(site)) return [];
  return check.errors.map((e) => {
    const where = e.instancePath || '(root)';
    if (e.keyword === 'enum') return `${where} must be one of: ${e.params.allowedValues.join(', ')}`;
    if (e.keyword === 'additionalProperties') return `${where} has unknown field '${e.params.additionalProperty}'`;
    return `${where} ${e.message}`;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: validate.mjs <site.yaml>...');
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    const errors = validateSite(parse(readFileSync(file, 'utf8')));
    for (const err of errors) console.error(`${file}: ${err}`);
    if (errors.length) failed = true;
    else console.log(`${file}: ok`);
  }
  process.exit(failed ? 1 : 0);
}
